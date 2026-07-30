import os
import tempfile

db_dir = "/tmp" if os.path.exists("/tmp") else "."
db_file = os.path.join(db_dir, "synthetix.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Synthetix AI - Multi-Agent RAG Synthesizer"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = f"sqlite+aiosqlite:///{db_file}"
    
    # Vector Search / RAG Settings
    DEFAULT_CHUNK_SIZE: int = 500
    DEFAULT_CHUNK_OVERLAP: int = 100
    TOP_K_RESULTS: int = 5
    RRF_K: float = 60.0  # RRF Constant
    
    # LLM Settings (Mock/Local/OpenAI fallback)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "mock-key")
    DEFAULT_MODEL: str = "gpt-4o-mini"
    
    class Config:
        case_sensitive = True

settings = Settings()
