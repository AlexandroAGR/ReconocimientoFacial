from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RecognitionHistoryResponse(BaseModel):
    id: int
    persona_id: int | None
    persona_nombre: str | None
    similitud: float
    distancia: float | None
    umbral: float
    coincide: bool
    probabilidad_calibrada: float | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

