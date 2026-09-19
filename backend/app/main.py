from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.history import router as history_router
from app.api.routes.models import router as models_router
from app.api.routes.personas import router as personas_router
from app.api.routes.probabilities import router as probabilities_router
from app.api.routes.recognition import router as recognition_router
from app.database.connection import Base, engine

# Se importan todos los modelos para que queden registrados en
# Base.metadata antes de crear las tablas que aún no existan
# (por ejemplo, ml_training_records al actualizar el proyecto).
from app.models.face_embedding_model import FaceEmbedding  # noqa: F401
from app.models.ml_training_record_model import MLTrainingRecord  # noqa: F401
from app.models.persona_model import Persona  # noqa: F401
from app.models.recognition_log_model import RecognitionLog  # noqa: F401

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Sistema Inteligente de Reconocimiento Facial",
    description="API para reconocimiento facial y análisis de probabilidades",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(personas_router)
app.include_router(recognition_router)
app.include_router(health_router)
app.include_router(history_router)
app.include_router(probabilities_router)
app.include_router(models_router)


@app.get("/")
def root():
    return {
        "message": "API de reconocimiento facial funcionando"
    }

