from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.schemas import Report, ReportResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_by_id(report_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch final generated markdown report by ID along with Ragas score evaluation."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return ReportResponse(
        id=report.id,
        project_id=report.project_id,
        query=report.query,
        content=report.content,
        ragas_score=report.ragas_score,
        execution_trace=report.execution_trace,
        created_at=report.created_at
    )

@router.get("/project/{project_id}", response_model=List[ReportResponse])
async def get_reports_for_project(project_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch all reports generated for a project."""
    result = await db.execute(select(Report).where(Report.project_id == project_id).order_by(Report.created_at.desc()))
    reports = result.scalars().all()
    return [
        ReportResponse(
            id=r.id,
            project_id=r.project_id,
            query=r.query,
            content=r.content,
            ragas_score=r.ragas_score,
            execution_trace=r.execution_trace,
            created_at=r.created_at
        ) for r in reports
    ]
