import asyncio
import json
from typing import Dict, List, AsyncGenerator

class SSEStreamManager:
    """Manages async Server-Sent Events (SSE) subscriptions for real-time agent workflow updates."""
    
    def __init__(self):
        self.subscribers: Dict[str, List[asyncio.Queue]] = {}

    async def subscribe(self, project_id: str) -> AsyncGenerator[str, None]:
        queue = asyncio.Queue()
        if project_id not in self.subscribers:
            self.subscribers[project_id] = []
        self.subscribers[project_id].append(queue)
        
        try:
            # Send initial connected message
            init_msg = {
                "event": "connected",
                "data": {"message": f"Connected to SSE stream for project {project_id}"}
            }
            yield f"data: {json.dumps(init_msg)}\n\n"
            
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            if project_id in self.subscribers and queue in self.subscribers[project_id]:
                self.subscribers[project_id].remove(queue)

    async def broadcast(self, project_id: str, event_type: str, payload: dict):
        if project_id in self.subscribers:
            message = {
                "event": event_type,
                "data": payload
            }
            for queue in self.subscribers[project_id]:
                await queue.put(message)

stream_manager = SSEStreamManager()
