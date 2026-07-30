from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.stream_manager import stream_manager

router = APIRouter(prefix="/stream", tags=["Streaming"])

@router.get("/{project_id}")
async def stream_project_agent_updates(project_id: str):
    """Server-Sent Events (SSE) endpoint to stream real-time agent execution states and logs."""
    return StreamingResponse(
        stream_manager.subscribe(project_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
