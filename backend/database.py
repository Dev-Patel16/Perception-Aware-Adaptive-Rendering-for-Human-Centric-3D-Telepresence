import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(DB_DIR), "data")
os.makedirs(DATA_DIR, exist_ok=True)

SQLITE_URL = f"sqlite:///{os.path.join(DATA_DIR, 'telepresence_research.db')}"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    try:
        from models import ExperimentRecord, SceneRecord, AblationRecord
    except ImportError:
        from .models import ExperimentRecord, SceneRecord, AblationRecord
    Base.metadata.create_all(bind=engine)


def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
