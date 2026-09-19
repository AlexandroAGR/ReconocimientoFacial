from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class RecognitionLog(Base):
    __tablename__ = "recognition_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    persona_id: Mapped[int | None] = mapped_column(
        ForeignKey("personas.id", ondelete="SET NULL"),
        nullable=True
    )

    similitud: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    distancia: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    umbral: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    coincide: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )

    probabilidad_calibrada: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )