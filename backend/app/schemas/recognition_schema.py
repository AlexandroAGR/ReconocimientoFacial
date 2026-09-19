from pydantic import BaseModel


class EmbeddingResponse(BaseModel):
    persona_id: int
    modelo: str
    det_score: float
    embedding_dimension: int


class RecognitionResponse(BaseModel):
    success: bool
    persona_id: int | None
    nombre: str | None
    similitud: float | None
    distancia: float | None
    umbral: float
    coincide: bool
    probabilidad_calibrada: float | None
    confianza: str | None