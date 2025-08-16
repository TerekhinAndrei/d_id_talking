"""
Video generation endpoints
"""
from fastapi import APIRouter, HTTPException, status

from app.models.common import VideoGenerationRequest, BaseResponse

router = APIRouter()

@router.post("/generate", response_model=BaseResponse)
async def generate_video(request: VideoGenerationRequest):
    """Generate video with talking head"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Video generation endpoint not implemented"
    )

@router.get("/status/{task_id}", response_model=BaseResponse)
async def get_video_status(task_id: str):
    """Get video generation status"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Video status endpoint not implemented"
    )
