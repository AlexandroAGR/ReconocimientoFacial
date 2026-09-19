from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.recognition_log_model import RecognitionLog
from app.schemas.ml_model_schema import (
    CalibrationPoint,
    PredictionRequest,
    PredictionResponse,
)
from app.schemas.probability_schema import ProbabilityStatsResponse
from app.services.probability_service import (
    calcular_probabilidad_calibrada,
    clasificar_confianza,
    generar_curva_calibracion,
)


router = APIRouter(
    prefix="/api/probabilidades",
    tags=["Probabilidades"]
)


@router.get(
    "",
    response_model=ProbabilityStatsResponse
)
def get_probability_stats(
    db: Session = Depends(get_db)
):
    total = db.scalar(
        select(
            func.count(RecognitionLog.id)
        )
    ) or 0

    coincidencias = db.scalar(
        select(
            func.count(RecognitionLog.id)
        ).where(
            RecognitionLog.coincide.is_(True)
        )
    ) or 0

    no_coincidencias = total - coincidencias

    promedio = db.scalar(
        select(
            func.avg(RecognitionLog.similitud)
        )
    )

    maxima = db.scalar(
        select(
            func.max(RecognitionLog.similitud)
        )
    )

    minima = db.scalar(
        select(
            func.min(RecognitionLog.similitud)
        )
    )

    probabilidad_promedio = db.scalar(
        select(
            func.avg(RecognitionLog.probabilidad_calibrada)
        ).where(
            RecognitionLog.probabilidad_calibrada.is_not(None)
        )
    )

    tasa_coincidencia = (
        coincidencias / total
        if total > 0
        else 0
    )

    umbrales = db.scalars(
        select(RecognitionLog.umbral)
    ).all()

    umbral_mas_usado = (
        Counter(umbrales).most_common(1)[0][0]
        if umbrales
        else None
    )

    return ProbabilityStatsResponse(
        total_reconocimientos=total,
        coincidencias=coincidencias,
        no_coincidencias=no_coincidencias,
        tasa_coincidencia=tasa_coincidencia,
        similitud_promedio=float(promedio or 0),
        similitud_maxima=(
            float(maxima)
            if maxima is not None
            else None
        ),
        similitud_minima=(
            float(minima)
            if minima is not None
            else None
        ),
        probabilidad_calibrada_promedio=(
            float(probabilidad_promedio)
            if probabilidad_promedio is not None
            else None
        ),
        umbral_mas_usado=umbral_mas_usado,
    )


@router.post(
    "/prediccion",
    response_model=PredictionResponse
)
def calcular_prediccion(
    datos: PredictionRequest
):
    """
    Calcula la probabilidad calibrada de coincidencia para una
    similitud/distancia/umbral dados, sin necesidad de ejecutar
    una comparación facial nueva. Corresponde al endpoint
    POST /api/probabilidades/prediccion del documento técnico.
    """

    probabilidad = calcular_probabilidad_calibrada(
        datos.similitud,
        datos.umbral
    )

    return PredictionResponse(
        similitud=datos.similitud,
        distancia=datos.distancia,
        umbral=datos.umbral,
        coincide=datos.similitud >= datos.umbral,
        probabilidad_calibrada=probabilidad,
        confianza=clasificar_confianza(probabilidad)
    )


@router.get(
    "/curva",
    response_model=list[CalibrationPoint]
)
def obtener_curva_calibracion(
    umbral: float = 0.75
):
    """
    Devuelve los puntos (similitud, probabilidad) de la curva de
    calibración usada por el gráfico del módulo Probabilidades.
    """

    return generar_curva_calibracion(umbral)
