from fastapi import APIRouter

from app.api.v1.endpoints import health, users, tasks, voices, tts, video, streaming, storage, d_id_files

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(voices.router, prefix="/voices", tags=["voices"])
api_router.include_router(tts.router, prefix="/tts", tags=["tts"])
api_router.include_router(video.router, prefix="/video", tags=["video"])
api_router.include_router(streaming.router, prefix="/streaming", tags=["streaming"])
api_router.include_router(storage.router, prefix="/storage", tags=["storage"])
api_router.include_router(d_id_files.router, prefix="/d-id-files", tags=["d-id-files"])
# api_router.include_router(websocket_streaming.router, prefix="/websocket", tags=["websocket"]) 