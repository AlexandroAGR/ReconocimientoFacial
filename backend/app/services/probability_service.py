import json
import math
import os
from datetime import datetime

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ml_training_record_model import MLTrainingRecord
from app.schemas.ml_model_schema import (
    CalibrationPoint,
    ConfusionMatrix,
    TrainingMetricsResponse,
    TrainingRecordCreate,
)

# ---------------------------------------------------------
# Rutas de persistencia del modelo entrenado y sus métricas.
# Equivalen a la carpeta "models/" descrita en la sección 9
# del documento técnico.
# ---------------------------------------------------------

MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "..",
    "models"
)
MODEL_PATH = os.path.join(MODELS_DIR, "ml_classifier.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "ml_metrics.json")

# Mapas de codificación de variables categóricas usadas por el
# modelo (sección 7: "calidad de imagen" e "iluminación").
CALIDAD_MAP = {"alta": 1.0, "media": 0.6, "baja": 0.3}
ILUMINACION_MAP = {"alta": 1.0, "media": 0.6, "baja": 0.3}

DEFAULT_K = 12.0  # pendiente de la sigmoide de calibración por defecto


# ---------------------------------------------------------
# 1. Similitud -> probabilidad calibrada (demostrativo)
# ---------------------------------------------------------
#
# El documento aclara (sección 6) que una similitud NO es una
# probabilidad: se necesita un modelo estadístico calibrado.
# Mientras no exista un modelo entrenado con suficiente data
# etiquetada (ver sección 3 más abajo), se usa una función
# logística centrada en el umbral de decisión como calibración
# de referencia. En cuanto el modelo de scikit-learn ha sido
# entrenado, se prioriza su propia estimación.

def calcular_probabilidad_calibrada(
    similitud: float,
    umbral: float,
    k: float = DEFAULT_K
) -> float:

    modelo, _ = _cargar_modelo_entrenado()

    if modelo is not None:
        entrada = np.array(
            [[similitud, round(1 - similitud, 4), 1.0, 1.0]]
        )
        probabilidad = float(
            modelo.predict_proba(entrada)[0][1]
        )
        return round(probabilidad, 4)

    exponente = -k * (similitud - umbral)
    probabilidad = 1 / (1 + math.exp(exponente))

    return round(probabilidad, 4)


def clasificar_confianza(probabilidad: float) -> str:

    if probabilidad >= 0.90:
        return "Muy alta"

    if probabilidad >= 0.75:
        return "Alta"

    if probabilidad >= 0.50:
        return "Media"

    return "Baja"


def generar_curva_calibracion(
    umbral: float,
    paso: float = 0.02
) -> list[CalibrationPoint]:

    puntos: list[CalibrationPoint] = []
    similitud = 0.30

    while similitud <= 1.0001:
        probabilidad = calcular_probabilidad_calibrada(
            round(similitud, 4),
            umbral
        )

        puntos.append(
            CalibrationPoint(
                similitud=round(similitud, 4),
                probabilidad=probabilidad
            )
        )

        similitud += paso

    return puntos


# ---------------------------------------------------------
# 2. Carga de datos de entrenamiento (módulo "Entrenamiento ML")
# ---------------------------------------------------------

def registrar_dato_entrenamiento(
    db: Session,
    datos: TrainingRecordCreate
) -> MLTrainingRecord:

    registro = MLTrainingRecord(
        similitud=datos.similitud,
        distancia=datos.distancia,
        calidad_imagen=datos.calidad_imagen,
        iluminacion=datos.iluminacion,
        resultado_real=datos.resultado_real
    )

    db.add(registro)
    db.commit()
    db.refresh(registro)

    return registro


def obtener_datos_entrenamiento(
    db: Session
) -> list[MLTrainingRecord]:

    query = select(MLTrainingRecord).order_by(
        MLTrainingRecord.created_at.desc()
    )

    return list(db.scalars(query).all())


# ---------------------------------------------------------
# 3. Entrenamiento y evaluación del modelo (Regresión Logística)
# ---------------------------------------------------------

def _codificar_registro(registro: MLTrainingRecord) -> list[float]:

    return [
        registro.similitud,
        registro.distancia
        if registro.distancia is not None
        else round(1 - registro.similitud, 4),
        CALIDAD_MAP.get(registro.calidad_imagen, 0.6),
        ILUMINACION_MAP.get(registro.iluminacion, 0.6),
    ]


def entrenar_modelo(db: Session) -> TrainingMetricsResponse:

    registros = obtener_datos_entrenamiento(db)

    if len(registros) < 6:
        return TrainingMetricsResponse(
            entrenado=False,
            total_registros=len(registros),
            registros_entrenamiento=0,
            registros_prueba=0,
            precision=None,
            recall=None,
            f1_score=None,
            tasa_falsos_positivos=None,
            tasa_falsos_negativos=None,
            matriz_confusion=None,
            trained_at=None,
            mensaje=(
                "Se necesitan al menos 6 registros de "
                "entrenamiento (recomendado: 50+) con ambos "
                "resultados representados. Registros actuales: "
                f"{len(registros)}."
            )
        )

    X = np.array(
        [_codificar_registro(r) for r in registros]
    )
    y = np.array(
        [1 if r.resultado_real else 0 for r in registros]
    )

    if len(set(y.tolist())) < 2:
        return TrainingMetricsResponse(
            entrenado=False,
            total_registros=len(registros),
            registros_entrenamiento=0,
            registros_prueba=0,
            precision=None,
            recall=None,
            f1_score=None,
            tasa_falsos_positivos=None,
            tasa_falsos_negativos=None,
            matriz_confusion=None,
            trained_at=None,
            mensaje=(
                "Los datos de entrenamiento deben incluir "
                "ejemplos de coincidencia (verdadero) y de "
                "no coincidencia (falso)."
            )
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.3,
        random_state=42,
        stratify=y
    )

    modelo = LogisticRegression(max_iter=1000)
    modelo.fit(X_train, y_train)

    y_pred = modelo.predict(X_test)

    matriz = confusion_matrix(
        y_test, y_pred, labels=[0, 1]
    )
    vn, fp, fn, vp = matriz.ravel()

    tasa_fp = float(fp / (fp + vn)) if (fp + vn) > 0 else 0.0
    tasa_fn = float(fn / (fn + vp)) if (fn + vp) > 0 else 0.0

    metricas = TrainingMetricsResponse(
        entrenado=True,
        total_registros=len(registros),
        registros_entrenamiento=len(X_train),
        registros_prueba=len(X_test),
        precision=round(
            float(precision_score(y_test, y_pred, zero_division=0)), 4
        ),
        recall=round(
            float(recall_score(y_test, y_pred, zero_division=0)), 4
        ),
        f1_score=round(
            float(f1_score(y_test, y_pred, zero_division=0)), 4
        ),
        tasa_falsos_positivos=round(tasa_fp, 4),
        tasa_falsos_negativos=round(tasa_fn, 4),
        matriz_confusion=ConfusionMatrix(
            verdaderos_positivos=int(vp),
            falsos_positivos=int(fp),
            verdaderos_negativos=int(vn),
            falsos_negativos=int(fn)
        ),
        trained_at=datetime.utcnow(),
        mensaje="Modelo entrenado correctamente."
    )

    _guardar_modelo(modelo, metricas)

    return metricas


def obtener_metricas() -> TrainingMetricsResponse:

    if not os.path.exists(METRICS_PATH):
        return TrainingMetricsResponse(
            entrenado=False,
            total_registros=0,
            registros_entrenamiento=0,
            registros_prueba=0,
            precision=None,
            recall=None,
            f1_score=None,
            tasa_falsos_positivos=None,
            tasa_falsos_negativos=None,
            matriz_confusion=None,
            trained_at=None,
            mensaje="Aún no se ha entrenado ningún modelo."
        )

    with open(METRICS_PATH, "r", encoding="utf-8") as archivo:
        datos = json.load(archivo)

    return TrainingMetricsResponse(**datos)


def _guardar_modelo(
    modelo: LogisticRegression,
    metricas: TrainingMetricsResponse
) -> None:

    os.makedirs(MODELS_DIR, exist_ok=True)

    joblib.dump(modelo, MODEL_PATH)

    with open(METRICS_PATH, "w", encoding="utf-8") as archivo:
        archivo.write(metricas.model_dump_json())


def _cargar_modelo_entrenado():

    if not os.path.exists(MODEL_PATH):
        return None, None

    try:
        modelo = joblib.load(MODEL_PATH)
        return modelo, MODEL_PATH

    except Exception:
        return None, None
