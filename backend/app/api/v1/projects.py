from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.schemas import Project, Document, ProjectCreate, ProjectResponse, DocumentResponse
from app.services.ingestion import DocumentIngestionService

router = APIRouter(prefix="/projects", tags=["Projects"])
ingestion_service = DocumentIngestionService()

# In-memory document chunks index store keyed by project_id for fast hybrid search
project_chunks_store = {}

@router.post("/", response_model=ProjectResponse)
async def create_project(
    title: str = Form(...),
    urls: Optional[str] = Form(None), # Comma separated URLs
    github_repos: Optional[str] = Form(None), # Comma separated Github Repos
    pdf_files: Optional[List[UploadFile]] = File(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Create a new synthesis project and ingest documents from multiple sources."""
    new_project = Project(title=title)
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    all_chunks = []
    
    # 1. Process PDF files
    if pdf_files:
        for file in pdf_files:
            if file and getattr(file, 'filename', None) and file.filename.lower().endswith('.pdf'):
                file_bytes = await file.read()
                parsed_text = ingestion_service.parse_pdf(file_bytes, file.filename)
                chunks = ingestion_service.semantic_chunking(parsed_text, file.filename)
                all_chunks.extend(chunks)
                
                doc = Document(
                    project_id=new_project.id,
                    file_name=file.filename,
                    file_type="pdf",
                    status="indexed",
                    chunk_count=len(chunks),
                    content_preview=parsed_text[:300]
                )
                db.add(doc)

    # 2. Process URLs
    if urls:
        url_list = [u.strip() for u in urls.split(',') if u.strip()]
        for url in url_list:
            parsed_text = ingestion_service.parse_url(url)
            chunks = ingestion_service.semantic_chunking(parsed_text, url)
            all_chunks.extend(chunks)
            
            doc = Document(
                project_id=new_project.id,
                file_name=url,
                file_type="url",
                status="indexed",
                chunk_count=len(chunks),
                content_preview=parsed_text[:300]
            )
            db.add(doc)

    # 3. Process GitHub Repositories
    if github_repos:
        repo_list = [r.strip() for r in github_repos.split(',') if r.strip()]
        for repo in repo_list:
            parsed_text = ingestion_service.parse_github_repo(repo)
            chunks = ingestion_service.semantic_chunking(parsed_text, repo)
            all_chunks.extend(chunks)
            
            doc = Document(
                project_id=new_project.id,
                file_name=repo,
                file_type="github",
                status="indexed",
                chunk_count=len(chunks),
                content_preview=parsed_text[:300]
            )
            db.add(doc)

    # Fallback sample chunk if no documents uploaded
    if not all_chunks:
        sample_text = f"# Multi-Agent RAG Synthesis Overview for {title}\n\nThis project provides an automated pipeline for multi-document research, semantic chunking, and hybrid vector-BM25 retrieval."
        chunks = ingestion_service.semantic_chunking(sample_text, "Default Overview")
        all_chunks.extend(chunks)
        
        doc = Document(
            project_id=new_project.id,
            file_name="Overview Document",
            file_type="overview",
            status="indexed",
            chunk_count=len(chunks),
            content_preview=sample_text[:300]
        )
        db.add(doc)

    await db.commit()
    
    # Store chunks in memory for project RAG query
    project_chunks_store[new_project.id] = all_chunks

    return ProjectResponse(
        id=new_project.id,
        title=new_project.title,
        created_at=new_project.created_at,
        document_count=len(all_chunks),
        status="indexed"
    )

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    """List all projects."""
    result = await db.execute(select(Project).options(selectinload(Project.documents)))
    projects = result.scalars().all()
    return [
        ProjectResponse(
            id=p.id,
            title=p.title,
            created_at=p.created_at,
            document_count=len(p.documents),
            status="active"
        )
        for p in projects
    ]

@router.get("/{project_id}")
async def get_project_details(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get project details and ingested documents."""
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.documents), selectinload(Project.reports))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return {
        "id": project.id,
        "title": project.title,
        "created_at": project.created_at,
        "documents": [
            {
                "id": d.id,
                "file_name": d.file_name,
                "file_type": d.file_type,
                "status": d.status,
                "chunk_count": d.chunk_count,
                "content_preview": d.content_preview
            } for d in project.documents
        ],
        "reports": [
            {
                "id": r.id,
                "query": r.query,
                "created_at": r.created_at,
                "ragas_score": r.ragas_score
            } for r in project.reports
        ]
    }
