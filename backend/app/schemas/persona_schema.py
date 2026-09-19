from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class PersonaCreate(BaseModel):
    nombre: str
    email: EmailStr | None = None


class PersonaUpdate(BaseModel):
    nombre: str | None = None
    email: EmailStr | None = None
    activo: bool | None = None


class PersonaResponse(BaseModel):
    id: int
    nombre: str
    email: str | None
    activo: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )