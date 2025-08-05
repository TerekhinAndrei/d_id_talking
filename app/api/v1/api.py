from fastapi import APIRouter

from app.api.v1.endpoints import health, users, tasks, generation

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(generation.router, tags=["generation"]) 