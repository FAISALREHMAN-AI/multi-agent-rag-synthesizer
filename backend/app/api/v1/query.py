from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import QueryRequest, Report
from app.api.v1.projects import project_chunks_store
from app.agents.graph import workflow_runner

router = APIRouter(prefix="/query", tags=["Query"])

async def run_agent_workflow_task(project_id: str, query: str, chunks: list, report_id: str, db_session_factory):
    """Background task to run LangGraph multi-agent synthesis and persist report."""
    try:
        final_state = await workflow_runner.execute_workflow(project_id, query, chunks)
        
        async with db_session_factory() as session:
            new_report = Report(
                id=report_id,
                project_id=project_id,
                query=query,
                content=final_state["final_report"],
                ragas_score=final_state["ragas_score"],
                execution_trace=final_state["execution_trace"]
            )
            session.add(new_report)
            await session.commit()
    except Exception as e:
        print(f"Error during agent workflow execution: {e}")

@router.post("/")
async def execute_query(
    request: QueryRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Trigger multi-agent RAG workflow for a given project query."""
    project_id = request.project_id
    query = request.query.strip()
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    chunks = project_chunks_store.get(project_id, [])
    if not chunks:
        # Fallback default chunks if project chunks not in memory cache
        chunks = [{
            "text": f"Project {project_id} document content for query: {query}",
            "source": "Document Context",
            "section": "Overview"
        }]

    import uuid
    report_id = str(uuid.uuid4())
    
    from app.core.database import AsyncSessionLocal
    background_tasks.add_task(
        run_agent_workflow_task,
        project_id=project_id,
        query=query,
        chunks=chunks,
        report_id=report_id,
        db_session_factory=AsyncSessionLocal
    )
    
    return {
        "status": "processing",
        "message": "LangGraph multi-agent research workflow started.",
        "project_id": project_id,
        "report_id": report_id
    }
