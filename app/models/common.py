"""
Common Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# Base Models
class BaseResponse(BaseModel):
    """Base response model"""
    success: bool = Field(..., description="Operation success status")
    message: Optional[str] = Field(None, description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional response data")


# Voice Models
class Voice(BaseModel):
    """Voice model"""
    voice_id: str = Field(..., description="Unique voice identifier")
    name: str = Field(..., description="Voice name")
    description: str = Field(..., description="Voice description")
    category: Optional[str] = Field(None, description="Voice category")
    language: Optional[str] = Field(None, description="Voice language")


class GetVoicesResponse(BaseResponse):
    """Response model for getting voices"""
    voices: List[Voice] = Field(..., description="List of available voices")


# Streaming Models
class CreateStreamRequest(BaseModel):
    """Request model for creating a stream"""
    image_url: HttpUrl = Field(..., description="URL of the image to use for streaming")
    presenter_id: Optional[str] = Field(None, description="D-ID presenter ID")


class CreateStreamResponse(BaseResponse):
    """Response model for creating a stream"""
    stream_id: str = Field(..., description="Unique stream identifier")
    session_id: str = Field(..., description="Session identifier")


class StartStreamRequest(BaseModel):
    """Request model for starting a stream"""
    image_url: str = Field(..., description="URL or D-ID file ID of the image to use for streaming")
    presenter_id: Optional[str] = Field(None, description="D-ID presenter ID")


class StartStreamResponse(BaseResponse):
    """Response model for starting a stream"""
    stream_id: str = Field(..., description="Unique stream identifier")
    session_id: str = Field(..., description="Session identifier")
    sdp_offer: str = Field(..., description="SDP offer for WebRTC")
    ice_servers: List[Dict[str, Any]] = Field(..., description="ICE servers configuration")


class SdpRequest(BaseModel):
    """Request model for SDP exchange"""
    sdp_answer: str = Field(..., description="SDP answer")
    session_id: Optional[str] = Field(None, description="Session identifier")


class SdpResponse(BaseResponse):
    """Response model for SDP exchange"""
    stream_id: str = Field(..., description="Stream identifier")


class WebRTCSessionRequest(BaseModel):
    """Request model for WebRTC session"""
    image_url: str = Field(..., description="URL or D-ID file ID of the image to use")
    presenter_id: Optional[str] = Field(None, description="D-ID presenter ID")


class WebRTCSessionResponse(BaseResponse):
    """Response model for WebRTC session"""
    stream_id: str = Field(..., description="Stream identifier")
    session_id: str = Field(..., description="Session identifier")
    sdp_offer: str = Field(..., description="SDP offer")
    ice_servers: List[Dict[str, Any]] = Field(..., description="ICE servers")


class WebRTCAnswerRequest(BaseModel):
    """Request model for WebRTC answer"""
    sdp_answer: str = Field(..., description="SDP answer")


class WebRTCAnswerResponse(BaseResponse):
    """Response model for WebRTC answer"""
    stream_id: str = Field(..., description="Stream identifier")


class AudioChunkRequest(BaseModel):
    """Request model for audio chunk"""
    audio_data: str = Field(..., description="Base64 encoded audio data")
    chunk_index: int = Field(..., description="Chunk index")


class AudioChunkResponse(BaseResponse):
    """Response model for audio chunk"""
    stream_id: str = Field(..., description="Stream identifier")
    processed: bool = Field(..., description="Whether chunk was processed")


class TalkStreamRequest(BaseModel):
    """Request model for talk stream"""
    text: str = Field(..., description="Text to convert to speech")
    voice_id: Optional[str] = Field(None, description="Voice ID to use")
    session_id: Optional[str] = Field(None, description="Session identifier")


class TalkStreamResponse(BaseResponse):
    """Response model for talk stream"""
    stream_id: str = Field(..., description="Stream identifier")
    audio_url: Optional[str] = Field(None, description="URL to generated audio")


class DeleteStreamRequest(BaseModel):
    """Request model for deleting a stream"""
    stream_id: str = Field(..., description="Stream identifier to delete")


class DeleteStreamResponse(BaseResponse):
    """Response model for deleting a stream"""
    stream_id: str = Field(..., description="Deleted stream identifier")


class IceCandidateRequest(BaseModel):
    """Request model for ICE candidate"""
    candidate: str = Field(..., description="ICE candidate")
    sdp_mid: Optional[str] = Field(None, description="SDP media ID")
    sdp_mline_index: Optional[int] = Field(None, description="SDP media line index")
    session_id: Optional[str] = Field(None, description="Session identifier")


class IceCandidateResponse(BaseResponse):
    """Response model for ICE candidate"""
    stream_id: str = Field(..., description="Stream identifier")


class GetSdpRequest(BaseModel):
    """Request model for getting SDP"""
    stream_id: str = Field(..., description="Stream identifier")


class GetSdpResponse(BaseResponse):
    """Response model for getting SDP"""
    stream_id: str = Field(..., description="Stream identifier")
    sdp_offer: str = Field(..., description="SDP offer")


class SubmitSdpAnswerRequest(BaseModel):
    """Request model for submitting SDP answer"""
    sdp_answer: str = Field(..., description="SDP answer")


class SubmitSdpAnswerResponse(BaseResponse):
    """Response model for submitting SDP answer"""
    stream_id: str = Field(..., description="Stream identifier")


class SubmitIceCandidateRequest(BaseModel):
    """Request model for submitting ICE candidate"""
    candidate: str = Field(..., description="ICE candidate")
    sdp_mid: Optional[str] = Field(None, description="SDP media ID")
    sdp_mline_index: Optional[int] = Field(None, description="SDP media line index")


class SubmitIceCandidateResponse(BaseResponse):
    """Response model for submitting ICE candidate"""
    stream_id: str = Field(..., description="Stream identifier")


class CreateTalkStreamRequest(BaseModel):
    """Request model for creating talk stream"""
    text: str = Field(..., description="Text to convert to speech")
    voice_id: Optional[str] = Field(None, description="Voice ID to use")
    session_id: Optional[str] = Field(None, description="Session identifier")


class CreateTalkStreamResponse(BaseResponse):
    """Response model for creating talk stream"""
    stream_id: str = Field(..., description="Stream identifier")
    audio_url: Optional[str] = Field(None, description="URL to generated audio")


class StreamStatusResponse(BaseResponse):
    """Response model for stream status"""
    stream_id: str = Field(..., description="Stream identifier")
    status: str = Field(..., description="Stream status")
    created_at: datetime = Field(..., description="Stream creation time")
    updated_at: datetime = Field(..., description="Stream last update time")


class StreamListResponse(BaseResponse):
    """Response model for stream list"""
    streams: List[Dict[str, Any]] = Field(..., description="List of active streams")


# TTS Models
class TTSRequest(BaseModel):
    """Request model for text-to-speech"""
    text: str = Field(..., description="Text to convert to speech")
    voice_id: Optional[str] = Field(None, description="Voice ID to use")
    model: Optional[str] = Field(None, description="TTS model to use")


class PlayVoiceRequest(BaseModel):
    """Request model for playing voice"""
    voice_id: str = Field(..., description="Voice ID to play")
    text: str = Field(..., description="Text to convert to speech")


# Video Models
class VideoGenerationRequest(BaseModel):
    """Request model for video generation"""
    image_url: HttpUrl = Field(..., description="URL of the image to use")
    audio_url: Optional[HttpUrl] = Field(None, description="URL of the audio to use")
    text: Optional[str] = Field(None, description="Text to convert to speech")
    voice_id: Optional[str] = Field(None, description="Voice ID to use")
    presenter_id: Optional[str] = Field(None, description="D-ID presenter ID")


# Model configuration
model_config = ConfigDict(from_attributes=True)
