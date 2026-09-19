from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # postgis/postgis image already contains the extension; enabling it is idempotent.
    with engine.begin() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS postgis'))
    from app.db.models import user, habitation, habitation_parameter, map_layer, data_import, simulation, scenario, simulation_result
    Base.metadata.create_all(bind=engine)
