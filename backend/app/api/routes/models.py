from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.ml_model_schema import (
    TrainingMetricsResponse,
    TrainingRecordCreate,
    TrainingRecordResponse,
)
from app.services.probability_service import (
    entrenar_modelo,
    obtener_datos_entrenamiento,
    obtener_metricas,
    registrar_dato_entrenamiento,
)


router = APIRouter(
    prefix="/api/modelos",
    tags=["Machine Learning"]
)


@router.post(
    "/datos",
    response_model=TrainingRecordResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_dato_entrenamiento(
    datos: TrainingRecordCreate,
    db: Session = Depends(get_db)
):
    """
    Carga de datos: registra una comparación ya evaluada
    (similitud, distancia, calidad de imagen, iluminación y
    resultado real) para alimentar el entrenamiento del modelo.
    """

    return registrar_dato_entrenamiento(db, datos)


@router.get(
    "/datos",
    response_model=list[TrainingRecordResponse]
)
def listar_datos_entrenamiento(
    db: Session = Depends(get_db)
):
    return obtener_datos_entrenamiento(db)


@router.post(
    "/entrenar",
    response_model=TrainingMetricsResponse
)
def entrenar(
    db: Session = Depends(get_db)
):
    """
    Entrena un clasificador de Regresión Logística con los
    registros de ml_training_records y evalúa su desempeño
    (precisión, recall, F1, matriz de confusión, tasa de
    falsos positivos/negativos), tal como pide la sección 7
    del documento técnico.
    """

    return entrenar_modelo(db)


@router.get(
    "/metricas",
    response_model=TrainingMetricsResponse
)
def metricas():
    return obtener_metricas()
