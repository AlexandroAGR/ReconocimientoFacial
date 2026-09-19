from pydantic import BaseModel


class ProbabilityStatsResponse(BaseModel):
    total_reconocimientos: int
    coincidencias: int
    no_coincidencias: int
    tasa_coincidencia: float
    similitud_promedio: float
    similitud_maxima: float | None
    similitud_minima: float | None

