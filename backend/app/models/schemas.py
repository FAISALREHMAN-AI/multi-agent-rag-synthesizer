from datetime import datetime
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, EmailStr, Field

from app.core.database import Base

# ==================== SQLAlchemy ORM Models ====================

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user: Mapped[Optional["User"]] = relationship("User", back_populates="projects")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="project", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String, ForeignKey("projects.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str] = mapped_column(String, nullable=False) # 'pdf', 'url', 'github'
    status: Mapped[str] = mapped_column(String, default="processing") # 'processing', 'indexed', 'failed'
    content_preview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chunk_count: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    project: Mapped["Project"] = relationship("Project", back_populates="documents")

class Report(Base):
    __tablename__ = "reports"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String, ForeignKey("projects.id"), nullable=False)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False) # Markdown
    ragas_score: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    execution_trace: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    project: Mapped["Project"] = relationship("Project", back_populates="reports")


# ==================== Pydantic Schemas ====================

class ProjectCreate(BaseModel):
    title: str = Field(..., example="Autonomous Driving Research Synthesis")
    user_email: Optional[EmailStr] = None
    urls: Optional[List[str]] = []
    github_repos: Optional[List[str]] = []

class ProjectResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    document_count: int = 0
    status: str = "active"

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    project_id: str
    file_name: str
    file_type: str
    status: str
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class QueryRequest(BaseModel):
    project_id: str
    query: str = Field(..., example="Synthesize the multi-modal transformer architecture and training loss dynamics.")

class RagasScoreSchema(BaseModel):
    faithfulness: float
    answer_relevance: float
    context_precision: float
    context_recall: float
    overall_ragas_score: float

class ReportResponse(BaseModel):
    id: str
    project_id: str
    query: str
    content: str
    ragas_score: Optional[RagasScoreSchema] = None
    execution_trace: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True
