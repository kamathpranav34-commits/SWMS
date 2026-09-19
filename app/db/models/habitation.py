import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Habitation(Base):
    __tablename__ = "habitations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), index=True)
    level: Mapped[str] = mapped_column(String(50), default="VILLAGE")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    parameters = relationship("HabitationParameter", back_populates="habitation", cascade="all, delete-orphan")
    layers = relationship("MapLayer", back_populates="habitation", cascade="all, delete-orphan")
