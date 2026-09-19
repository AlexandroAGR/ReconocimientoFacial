import json

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile
)
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.face_embedding_model import FaceEmbedding
from app.models.persona_model import Persona
from app.schemas.recognition_schema import EmbeddingResponse, RecognitionResponse
from app.services.face_service import face_service
from app.services.recognition_service import DEFAULT_THRESHOLD, reconocer_persona


router = APIRouter(
    prefix="/api",
    tags=["Reconocimiento Facial"]
)


@router.post(
    "/personas/{persona_id}/rostro",
    response_model=EmbeddingResponse
)
async def registrar_rostro(
    persona_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    persona = db.get(
        Persona,
        persona_id
    )

    if persona is None:
        raise HTTPException(
            status_code=404,
            detail="Persona no encontrada"
        )

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="El archivo no tiene tipo MIME"
        )

    if not file.content_type.startswith(
        "image/"
    ):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen"
        )

    image_bytes = await file.read()

    try:

        result = face_service.generate_embedding(
            image_bytes
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    embedding = result["embedding"]

    face_embedding = FaceEmbedding(
        persona_id=persona_id,
        embedding=json.dumps(
            embedding
        ),
        modelo="buffalo_l"
    )

    db.add(
        face_embedding
    )

    db.commit()

    return EmbeddingResponse(
        persona_id=persona_id,
        modelo="buffalo_l",
        det_score=result["det_score"],
        embedding_dimension=len(
            embedding
        )
    )

@router.post(
    "/reconocimiento",
    response_model=RecognitionResponse
)
async def reconocer(
    file: UploadFile = File(...),
    umbral: float = Form(
        DEFAULT_THRESHOLD,
        ge=0.0,
        le=1.0,
        description="Umbral de aceptación de la coincidencia (0-1)."
    ),
    db: Session = Depends(get_db)
):

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="El archivo no tiene tipo MIME"
        )

    if not file.content_type.startswith(
        "image/"
    ):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen"
        )

    image_bytes = await file.read()

    try:

        resultado = reconocer_persona(
            db,
            image_bytes,
            threshold=umbral
        )

        return resultado

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )