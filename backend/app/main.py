from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import projects, query, stream, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables
    await init_db()
    print("[Synthetix AI] Database initialized successfully.")
    yield
    # Shutdown logic
    print("[Synthetix AI] Shutting down FastAPI application.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-Grade Multi-Agent RAG & Knowledge Synthesizer API",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(query.router, prefix=settings.API_V1_STR)
app.include_router(stream.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
