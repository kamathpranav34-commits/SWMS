import uuid
from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base

class SimulationResult(Base):
    __tablename__ = "simulation_results"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id: Mapped[str] = mapped_column(ForeignKey("simulations.id", ondelete="CASCADE"), index=True)
    year: Mapped[int] = mapped_column(Integer)
    population: Mapped[float] = mapped_column(Float)
    waste_tpd: Mapped[float] = mapped_column(Float)
    collected_tpd: Mapped[float] = mapped_column(Float)
    treated_tpd: Mapped[float] = mapped_column(Float)
    disposed_tpd: Mapped[float] = mapped_column(Float)
    estimated_cost: Mapped[float] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    simulation = relationship("Simulation", back_populates="results")
