import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Simulation(Base):
    __tablename__ = "simulations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    habitation_id: Mapped[str] = mapped_column(ForeignKey("habitations.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    start_year: Mapped[int] = mapped_column(Integer, default=1)
    duration_years: Mapped[int] = mapped_column(Integer, default=20)
    status: Mapped[str] = mapped_column(String(30), default="QUEUED")
    input_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    results = relationship("SimulationResult", back_populates="simulation", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="simulation", cascade="all, delete-orphan")
