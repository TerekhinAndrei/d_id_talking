"""
API endpoints для генерации видео
"""

import os
import uuid
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from app.services.elevenlabs_service import ElevenLabsService, ElevenLabsServiceError
from app.services.d_id_service import DIdService, DIdServiceError
from app.services.storage_service import StorageService, StorageServiceError
from app.models.generation import TaskStatusResponse
from app.config import config

logger = logging.getLogger(__name__)
router = APIRouter()

# Хранилище задач в памяти (в продакшене заменить на базу данных)
tasks_storage: Dict[str, Dict[str, Any]] = {}


@router.post("/generate")
async def generate_video(
    image_file: UploadFile = File(...),
    audio_file: UploadFile = File(...),
    voice_id: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """
    Создание задачи генерации видео
    """
    try:
        # Валидация файлов
        if not image_file.filename or not audio_file.filename:
            raise HTTPException(status_code=400, detail="Необходимо загрузить изображение и аудио файлы")
        
        # Создаем уникальный ID задачи
        task_id = str(uuid.uuid4())
        
        # Создаем папку для задачи
        task_folder = f"uploads/{task_id}"
        os.makedirs(task_folder, exist_ok=True)
        
        # Сохраняем файлы локально
        image_path = os.path.join(task_folder, image_file.filename)
        audio_path = os.path.join(task_folder, audio_file.filename)
        
        with open(image_path, "wb") as f:
            f.write(await image_file.read())
        
        with open(audio_path, "wb") as f:
            f.write(await audio_file.read())
        
        # Инициализируем задачу
        tasks_storage[task_id] = {
            "status": "processing",
            "progress": 0,
            "image_path": image_path,
            "audio_path": audio_path,
            "voice_id": voice_id or config.ELEVENLABS_DEFAULT_VOICE_ID,
            "video_url": None,
            "error_message": None,
            "talk_id": None
        }
        
        logger.info(f"Получены файлы: {image_file.filename} ({os.path.getsize(image_path)} байт) и {audio_file.filename} ({os.path.getsize(audio_path)} байт)")
        logger.info(f"🎯 Создана новая задача обработки через ElevenLabs: {task_id}")
        logger.info(f"   📸 Изображение: {image_file.filename}")
        logger.info(f"   🎵 Аудио: {audio_file.filename}")
        
        # Запускаем фоновую обработку
        if background_tasks:
            background_tasks.add_task(process_video_task, task_id)
        
        return {
            "task_id": task_id,
            "status": "processing",
            "progress": 0
        }
        
    except Exception as e:
        logger.error(f"Ошибка создания задачи: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания задачи: {str(e)}")


async def process_video_task(task_id: str):
    """
    Фоновая обработка задачи генерации видео
    """
    try:
        task = tasks_storage.get(task_id)
        if not task:
            logger.error(f"Задача {task_id} не найдена")
            return
        
        logger.info(f"[{task_id}] Запускаю обработку через ElevenLabs Speech to Speech...")
        
        # Шаг 1: Загрузка файлов в облачное хранилище
        logger.info(f"[{task_id}] Шаг 1: Загрузка файлов в облачное хранилище...")
        task["progress"] = 10
        
        try:
            storage_service = StorageService()
            
            # Загружаем изображение
            with open(task["image_path"], "rb") as f:
                image_data = f.read()
            image_result = storage_service.upload_image(image_data, os.path.basename(task["image_path"]))
            logger.info(f"[{task_id}] Изображение загружено в облако: {image_result.public_url}")
            
            # Загружаем аудио
            with open(task["audio_path"], "rb") as f:
                audio_data = f.read()
            audio_result = storage_service.upload_audio(audio_data, os.path.basename(task["audio_path"]))
            logger.info(f"[{task_id}] Аудио загружено в облако: {audio_result.public_url}")
            
            task["progress"] = 20
            
        except StorageServiceError as e:
            logger.error(f"[{task_id}] Ошибка загрузки файлов в облако: {e}")
            task["status"] = "failed"
            task["error_message"] = f"Ошибка загрузки файлов: {str(e)}"
            return
        
        # Шаг 2: Обработка аудио через ElevenLabs
        logger.info(f"[{task_id}] Шаг 2: Обработка аудио через ElevenLabs...")
        task["progress"] = 30
        
        try:
            elevenlabs_service = ElevenLabsService()
            
            # Обрабатываем аудио через ElevenLabs
            processed_audio_path = os.path.join(os.path.dirname(task["audio_path"]), "processed_audio.mp3")
            
            # Используем загруженное аудио из облака
            processed_audio_data = elevenlabs_service.speech_to_speech_with_url(
                audio_result.public_url, 
                task["voice_id"]
            )
            
            # Сохраняем обработанное аудио
            with open(processed_audio_path, "wb") as f:
                f.write(processed_audio_data)
            
            task["progress"] = 50
            logger.info(f"[{task_id}] Обработка через ElevenLabs завершена успешно!")
            logger.info(f"[{task_id}] Обработанный аудио сохранен: {processed_audio_path}")
            
        except ElevenLabsServiceError as e:
            logger.error(f"[{task_id}] Ошибка сервиса ElevenLabs: {e}")
            task["status"] = "failed"
            task["error_message"] = f"Speech to speech processing failed: {str(e)}"
            return
        
        # Шаг 3: Создание видео через D-ID
        logger.info(f"[{task_id}] Шаг 3: Создание видео через D-ID...")
        task["progress"] = 60
        
        try:
            d_id_service = DIdService()
            
            # Загружаем обработанное аудио в облако
            with open(processed_audio_path, "rb") as f:
                processed_audio_data = f.read()
            processed_audio_result = storage_service.upload_audio(processed_audio_data, "processed_audio.mp3")
            logger.info(f"[{task_id}] Обработанное аудио загружено в облако: {processed_audio_result.public_url}")
            
            # Создаем видео через D-ID с публичными URL
            talk_id = d_id_service.create_talk(image_result.public_url, processed_audio_result.public_url)
            task["talk_id"] = talk_id
            logger.info(f"[{task_id}] Talk создан в D-ID: {talk_id}")
            
            task["progress"] = 70
            
        except DIdServiceError as e:
            logger.error(f"[{task_id}] Ошибка сервиса D-ID: {e}")
            task["status"] = "failed"
            task["error_message"] = f"D-ID service error: {str(e)}"
            return
        
        # Шаг 4: Ожидание завершения генерации видео
        logger.info(f"[{task_id}] Шаг 4: Ожидание завершения генерации видео...")
        task["progress"] = 80
        
        try:
            # Опрашиваем статус D-ID
            max_attempts = 30  # Максимум 5 минут (30 * 10 секунд)
            attempt = 0
            
            while attempt < max_attempts:
                status_info = d_id_service.get_talk_status(talk_id)
                
                if status_info["status"] == "done":
                    task["video_url"] = status_info["result_url"]
                    task["status"] = "completed"
                    task["progress"] = 100
                    logger.info(f"[{task_id}] Видео готово: {task['video_url']}")
                    break
                elif status_info["status"] == "failed":
                    task["status"] = "failed"
                    task["error_message"] = f"D-ID video generation failed: {status_info.get('error', 'Unknown error')}"
                    logger.error(f"[{task_id}] Ошибка генерации видео в D-ID: {task['error_message']}")
                    break
                else:
                    # Обновляем прогресс на основе статуса
                    if status_info["status"] == "created":
                        task["progress"] = 85
                    elif status_info["status"] == "started":
                        task["progress"] = 90
                    
                    import asyncio
                    await asyncio.sleep(10)  # Ждем 10 секунд
                    attempt += 1
            
            if attempt >= max_attempts:
                task["status"] = "failed"
                task["error_message"] = "Timeout waiting for video generation"
                logger.error(f"[{task_id}] Таймаут ожидания генерации видео")
            
        except DIdServiceError as e:
            logger.error(f"[{task_id}] Ошибка получения статуса D-ID: {e}")
            task["status"] = "failed"
            task["error_message"] = f"Error getting D-ID status: {str(e)}"
            return
        
        logger.info(f"[{task_id}] Обработка задачи завершена успешно!")
        
    except Exception as e:
        logger.error(f"[{task_id}] Неожиданная ошибка при обработке задачи: {e}")
        if task_id in tasks_storage:
            tasks_storage[task_id]["status"] = "failed"
            tasks_storage[task_id]["error_message"] = f"Unexpected error: {str(e)}"


@router.get("/status/{task_id}")
async def get_task_status(task_id: str) -> TaskStatusResponse:
    """
    Получение статуса задачи
    """
    task = tasks_storage.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskStatusResponse(
        task_id=task_id,
        status=task["status"],
        video_url=task["video_url"],
        error_message=task["error_message"],
        progress=task["progress"],
        talk_id=task["talk_id"]
    )


@router.get("/voices")
async def get_voices():
    """
    Получение списка доступных голосов ElevenLabs
    """
    try:
        elevenlabs_service = ElevenLabsService()
        voices = elevenlabs_service.get_available_voices()
        return {"voices": voices}
    except ElevenLabsServiceError as e:
        logger.error(f"Error fetching voices: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching voices: {str(e)}")


@router.get("/voices/validate/{voice_id}")
async def validate_voice(voice_id: str):
    """
    Валидация ID голоса
    """
    try:
        elevenlabs_service = ElevenLabsService()
        is_valid = elevenlabs_service.validate_voice_id(voice_id)
        return {"valid": is_valid}
    except ElevenLabsServiceError as e:
        logger.error(f"Error validating voice: {e}")
        raise HTTPException(status_code=500, detail=f"Error validating voice: {str(e)}")


@router.get("/voices/{voice_id}")
async def get_voice(voice_id: str):
    """
    Получение информации о конкретном голосе
    """
    try:
        elevenlabs_service = ElevenLabsService()
        voice = elevenlabs_service.get_voice_by_id(voice_id)
        return voice
    except ElevenLabsServiceError as e:
        logger.error(f"Error fetching voice: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching voice: {str(e)}") 