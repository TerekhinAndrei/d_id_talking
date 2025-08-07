from fastapi import APIRouter

from app.api.v1.endpoints import health, users, tasks, generation, webrtc, streaming

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(generation.router, prefix="/generation", tags=["generation"])
api_router.include_router(webrtc.router, prefix="/webrtc", tags=["webrtc"])
api_router.include_router(streaming.router, prefix="/streaming", tags=["streaming"])
# api_router.include_router(websocket_streaming.router, prefix="/websocket", tags=["websocket"]) 