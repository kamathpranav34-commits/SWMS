import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.db.database import Base

class MapLayer(Base):
    __tablename__ = "map_layers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    habitation_id: Mapped[str] = mapped_column(ForeignKey("habitations.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    layer_type: Mapped[str] = mapped_column(String(80), index=True)
    geometry: Mapped[object] = mapped_column(Geometry(geometry_type="GEOMETRY", srid=4326))
    properties: Mapped[dict] = mapped_column(JSON, default=dict)
    source_object_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    habitation = relationship("Habitation", back_populates="layers")
