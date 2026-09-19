from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.persona_schema import (
    PersonaCreate,
    PersonaResponse,
    PersonaUpdate
)
from app.services.persona_service import (
    actualizar_persona,
    crear_persona,
    eliminar_persona,
    obtener_persona,
    obtener_personas
)


router = APIRouter(
    prefix="/api/personas",
    tags=["Personas"]
)


@router.post(
    "",
    response_model=PersonaResponse,
    status_code=status.HTTP_201_CREATED
)
def create_persona(
    datos: PersonaCreate,
    db: Session = Depends(get_db)
):
    return crear_persona(db, datos)


@router.get(
    "",
    response_model=list[PersonaResponse]
)
def get_personas(
    db: Session = Depends(get_db)
):
    return obtener_personas(db)


@router.get(
    "/{persona_id}",
    response_model=PersonaResponse
)
def get_persona(
    persona_id: int,
    db: Session = Depends(get_db)
):
    persona = obtener_persona(db, persona_id)

    if persona is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona no encontrada"
        )

    return persona


@router.put(
    "/{persona_id}",
    response_model=PersonaResponse
)
def update_persona(
    persona_id: int,
    datos: PersonaUpdate,
    db: Session = Depends(get_db)
):
    persona = obtener_persona(db, persona_id)

    if persona is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona no encontrada"
        )

    return actualizar_persona(
        db,
        persona,
        datos
    )


@router.delete(
    "/{persona_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_persona(
    persona_id: int,
    db: Session = Depends(get_db)
):
    persona = obtener_persona(db, persona_id)

    if persona is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona no encontrada"
        )

    eliminar_persona(db, persona)

    return None