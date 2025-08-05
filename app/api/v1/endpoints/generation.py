"""
API endpoints для генерации видео
"""

import os
import uuid
import logging
import subprocess
import tempfile
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


def convert_audio_to_mp3(input_path: str, output_path: str) -> bool:
    """
    Конвертирует аудио файл в MP3 формат с помощью ffmpeg
    """
    try:
        # Проверяем, что ffmpeg доступен
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        if result.returncode != 0:
            logger.error("ffmpeg не найден в системе")
            return False
        
        # Конвертируем аудио в MP3
        cmd = [
            'ffmpeg', '-i', input_path,
            '-acodec', 'libmp3lame',
            '-ab', '128k',
            '-ar', '44100',
            '-y',  # Перезаписывать выходной файл
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Аудио успешно сконвертировано: {input_path} -> {output_path}")
            return True
        else:
            logger.error(f"Ошибка конвертации аудио: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Ошибка при конвертации аудио: {e}")
        return False


def get_audio_format(file_path: str) -> str:
    """
    Определяет формат аудио файла
    """
    try:
        cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            import json
            data = json.loads(result.stdout)
            format_name = data.get('format', {}).get('format_name', '').split(',')[0]
            return format_name
        else:
            # Если ffprobe не работает, определяем по расширению
            ext = os.path.splitext(file_path)[1].lower()
            if ext == '.mp3':
                return 'mp3'
            elif ext == '.wav':
                return 'wav'
            elif ext == '.webm':
                return 'webm'
            elif ext == '.ogg':
                return 'ogg'
            else:
                return 'unknown'
    except Exception as e:
        logger.error(f"Ошибка определения формата аудио: {e}")
        return 'unknown'


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
        # 🔥 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ВХОДНЫХ ДАННЫХ
        print("🔥 ВХОДНЫЕ ДАННЫЕ ОТ ФРОНТЕНДА:")
        print(f"   📸 Image filename: {image_file.filename}")
        print(f"   📸 Image content_type: {image_file.content_type}")
        print(f"   🎵 Audio filename: {audio_file.filename}")
        print(f"   🎵 Audio content_type: {audio_file.content_type}")
        print(f"   🎤 Voice ID: {voice_id}")
        
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
        original_audio_path = os.path.join(task_folder, audio_file.filename)
        
        with open(image_path, "wb") as f:
            f.write(await image_file.read())
        
        with open(original_audio_path, "wb") as f:
            f.write(await audio_file.read())
        
        # 🔥 ПРОВЕРЯЕМ РАЗМЕРЫ ФАЙЛОВ
        image_size = os.path.getsize(image_path)
        audio_size = os.path.getsize(original_audio_path)
        print(f"🔥 РАЗМЕРЫ ФАЙЛОВ:")
        print(f"   📸 Изображение: {image_size} байт")
        print(f"   🎵 Аудио: {audio_size} байт")
        
        # Проверяем минимальный размер аудио
        if audio_size < 1000:  # Меньше 1KB
            print(f"⚠️  ВНИМАНИЕ: Аудио файл очень маленький ({audio_size} байт)!")
        elif audio_size < 10000:  # Меньше 10KB
            print(f"⚠️  ВНИМАНИЕ: Аудио файл довольно маленький ({audio_size} байт)")
        else:
            print(f"✅ Аудио файл нормального размера ({audio_size} байт)")
        
        # Конвертируем аудио в MP3 для совместимости с ElevenLabs
        audio_format = get_audio_format(original_audio_path)
        logger.info(f"Определен формат аудио: {audio_format}")
        
        if audio_format != 'mp3':
            logger.info(f"Конвертируем аудио из {audio_format} в MP3...")
            converted_audio_path = os.path.join(task_folder, "converted_audio.mp3")
            
            if convert_audio_to_mp3(original_audio_path, converted_audio_path):
                audio_path = converted_audio_path
                logger.info(f"Аудио сконвертировано: {converted_audio_path}")
            else:
                logger.warning(f"Не удалось сконвертировать аудио, используем оригинал")
                audio_path = original_audio_path
        else:
            audio_path = original_audio_path
            logger.info("Аудио уже в MP3 формате")
        
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
        logger.info(f"   🎵 Аудио: {os.path.basename(audio_path)} ({os.path.getsize(audio_path)} байт)")
        if audio_path != original_audio_path:
            logger.info(f"   🔄 Аудио сконвертировано в MP3 для совместимости с ElevenLabs")
        
        # Добавляем принудительный вывод в консоль
        print(f"🎯 Создана новая задача обработки через ElevenLabs: {task_id}")
        print(f"   📸 Изображение: {image_file.filename}")
        print(f"   🎵 Аудио: {os.path.basename(audio_path)} ({os.path.getsize(audio_path)} байт)")
        
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
        
        # ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ЗАДАЧИ
        print(f"[{task_id}] 🔥 НАЧАЛО ОБРАБОТКИ ЗАДАЧИ:")
        print(f"[{task_id}]   Task ID: {task_id}")
        print(f"[{task_id}]   Image path: {task.get('image_path', 'N/A')}")
        print(f"[{task_id}]   Audio path: {task.get('audio_path', 'N/A')}")
        print(f"[{task_id}]   Voice ID: {task.get('voice_id', 'N/A')}")
        print(f"[{task_id}]   Status: {task.get('status', 'N/A')}")
        
        print(f"[{task_id}] Запускаю обработку через ElevenLabs Speech to Speech...")
        
        # Шаг 1: Загрузка файлов в облачное хранилище
        print(f"[{task_id}] Шаг 1: Загрузка файлов в облачное хранилище...")
        task["progress"] = 10
        
        try:
            print(f"[{task_id}] 🔥 СОЗДАНИЕ STORAGE SERVICE...")
            logger.info(f"[{task_id}] 🔥 СОЗДАНИЕ STORAGE SERVICE...")
            storage_service = StorageService()
            print(f"[{task_id}] ✅ STORAGE SERVICE СОЗДАН")
            logger.info(f"[{task_id}] ✅ STORAGE SERVICE СОЗДАН")
            
            # Загружаем изображение
            print(f"[{task_id}] 🔥 ОТКРЫВАЕМ ИЗОБРАЖЕНИЕ: {task['image_path']}")
            logger.info(f"[{task_id}] 🔥 ОТКРЫВАЕМ ИЗОБРАЖЕНИЕ: {task['image_path']}")
            with open(task["image_path"], "rb") as f:
                image_data = f.read()
            print(f"[{task_id}] ✅ ИЗОБРАЖЕНИЕ ПРОЧИТАНО: {len(image_data)} байт")
            logger.info(f"[{task_id}] ✅ ИЗОБРАЖЕНИЕ ПРОЧИТАНО: {len(image_data)} байт")
            
            print(f"[{task_id}] 🔥 ЗАГРУЖАЕМ ИЗОБРАЖЕНИЕ В CLOUDINARY...")
            logger.info(f"[{task_id}] 🔥 ЗАГРУЖАЕМ ИЗОБРАЖЕНИЕ В CLOUDINARY...")
            image_result = storage_service.upload_image(image_data, os.path.basename(task["image_path"]))
            print(f"[{task_id}] ✅ ИЗОБРАЖЕНИЕ ЗАГРУЖЕНО: {image_result.public_url}")
            logger.info(f"[{task_id}] ✅ ИЗОБРАЖЕНИЕ ЗАГРУЖЕНО: {image_result.public_url}")
            
            # Загружаем аудио
            print(f"[{task_id}] 🔥 ОТКРЫВАЕМ АУДИО: {task['audio_path']}")
            logger.info(f"[{task_id}] 🔥 ОТКРЫВАЕМ АУДИО: {task['audio_path']}")
            with open(task["audio_path"], "rb") as f:
                audio_data = f.read()
            print(f"[{task_id}] ✅ АУДИО ПРОЧИТАНО: {len(audio_data)} байт")
            logger.info(f"[{task_id}] ✅ АУДИО ПРОЧИТАНО: {len(audio_data)} байт")
            
            print(f"[{task_id}] 🔥 ЗАГРУЖАЕМ АУДИО В CLOUDINARY...")
            logger.info(f"[{task_id}] 🔥 ЗАГРУЖАЕМ АУДИО В CLOUDINARY...")
            audio_result = storage_service.upload_audio(audio_data, os.path.basename(task["audio_path"]))
            print(f"[{task_id}] ✅ АУДИО ЗАГРУЖЕНО: {audio_result.public_url}")
            logger.info(f"[{task_id}] ✅ АУДИО ЗАГРУЖЕНО: {audio_result.public_url}")
            
            # Проверяем, что URL доступен
            print(f"[{task_id}] 🔥 ПРОВЕРЯЕМ ДОСТУПНОСТЬ URL АУДИО...")
            logger.info(f"[{task_id}] 🔥 ПРОВЕРЯЕМ ДОСТУПНОСТЬ URL АУДИО...")
            import requests
            try:
                test_response = requests.head(audio_result.public_url, timeout=10)
                print(f"[{task_id}] ✅ URL АУДИО ДОСТУПЕН: {test_response.status_code}")
                logger.info(f"[{task_id}] ✅ URL АУДИО ДОСТУПЕН: {test_response.status_code}")
            except Exception as e:
                print(f"[{task_id}] ⚠️ URL АУДИО НЕДОСТУПЕН: {e}")
                logger.warning(f"[{task_id}] ⚠️ URL АУДИО НЕДОСТУПЕН: {e}")
            
            print(f"[{task_id}] 🔥 УСТАНАВЛИВАЕМ PROGRESS = 20")
            logger.info(f"[{task_id}] 🔥 УСТАНАВЛИВАЕМ PROGRESS = 20")
            task["progress"] = 20
            print(f"[{task_id}] ✅ PROGRESS УСТАНОВЛЕН")
            logger.info(f"[{task_id}] ✅ PROGRESS УСТАНОВЛЕН")
            
        except StorageServiceError as e:
            logger.error(f"[{task_id}] Ошибка загрузки файлов в облако: {e}")
            task["status"] = "failed"
            task["error_message"] = f"Ошибка загрузки файлов: {str(e)}"
            return
        
        # Шаг 2: Обработка аудио через ElevenLabs
        print(f"[{task_id}] 🔥 ШАГ 2: ОБРАБОТКА АУДИО ЧЕРЕЗ ELEVENLABS...")
        logger.info(f"[{task_id}] 🔥 ШАГ 2: ОБРАБОТКА АУДИО ЧЕРЕЗ ELEVENLABS...")
        print(f"[{task_id}] 🔥 УСТАНАВЛИВАЕМ PROGRESS = 30")
        logger.info(f"[{task_id}] 🔥 УСТАНАВЛИВАЕМ PROGRESS = 30")
        task["progress"] = 30
        print(f"[{task_id}] ✅ PROGRESS УСТАНОВЛЕН")
        logger.info(f"[{task_id}] ✅ PROGRESS УСТАНОВЛЕН")
        
        try:
            print(f"[{task_id}] 🔥 СОЗДАНИЕ ELEVENLABS SERVICE...")
            logger.info(f"[{task_id}] 🔥 СОЗДАНИЕ ELEVENLABS SERVICE...")
            elevenlabs_service = ElevenLabsService()
            print(f"[{task_id}] ✅ ELEVENLABS SERVICE СОЗДАН")
            logger.info(f"[{task_id}] ✅ ELEVENLABS SERVICE СОЗДАН")
            
            # Обрабатываем аудио через ElevenLabs
            print(f"[{task_id}] 🔥 СОЗДАЕМ ПУТЬ ДЛЯ ОБРАБОТАННОГО АУДИО...")
            logger.info(f"[{task_id}] 🔥 СОЗДАЕМ ПУТЬ ДЛЯ ОБРАБОТАННОГО АУДИО...")
            processed_audio_path = os.path.join(os.path.dirname(task["audio_path"]), "processed_audio.mp3")
            print(f"[{task_id}] ✅ ПУТЬ СОЗДАН: {processed_audio_path}")
            logger.info(f"[{task_id}] ✅ ПУТЬ СОЗДАН: {processed_audio_path}")
            
            # Используем загруженное аудио из облака
            print(f"[{task_id}] 🔥 ВЫЗЫВАЕМ ELEVENLABS SPEECH TO SPEECH...")
            logger.info(f"[{task_id}] 🔥 ВЫЗЫВАЕМ ELEVENLABS SPEECH TO SPEECH...")
            print(f"[{task_id}]   Audio URL: {audio_result.public_url}")
            logger.info(f"[{task_id}]   Audio URL: {audio_result.public_url}")
            print(f"[{task_id}]   Voice ID: {task['voice_id']}")
            logger.info(f"[{task_id}]   Voice ID: {task['voice_id']}")
            processed_audio_data = elevenlabs_service.speech_to_speech_with_url(
                audio_result.public_url, 
                task["voice_id"]
            )
            print(f"[{task_id}] ✅ ELEVENLABS ОБРАБОТКА ЗАВЕРШЕНА: {len(processed_audio_data)} байт")
            logger.info(f"[{task_id}] ✅ ELEVENLABS ОБРАБОТКА ЗАВЕРШЕНА: {len(processed_audio_data)} байт")
            
            # Сохраняем обработанное аудио
            print(f"[{task_id}] 🔥 СОХРАНЯЕМ ОБРАБОТАННОЕ АУДИО...")
            logger.info(f"[{task_id}] 🔥 СОХРАНЯЕМ ОБРАБОТАННОЕ АУДИО...")
            with open(processed_audio_path, "wb") as f:
                f.write(processed_audio_data)
            print(f"[{task_id}] ✅ ОБРАБОТАННОЕ АУДИО СОХРАНЕНО: {processed_audio_path}")
            logger.info(f"[{task_id}] ✅ ОБРАБОТАННОЕ АУДИО СОХРАНЕНО: {processed_audio_path}")
            
            print(f"[{task_id}] 🔥 УСТАНАВЛИВАЕМ PROGRESS = 50")
            logger.info(f"[{task_id}] 🔥 УСТАНАВЛИВАЕМ PROGRESS = 50")
            task["progress"] = 50
            print(f"[{task_id}] ✅ PROGRESS УСТАНОВЛЕН")
            logger.info(f"[{task_id}] ✅ PROGRESS УСТАНОВЛЕН")
            print(f"[{task_id}] ✅ ОБРАБОТКА ЧЕРЕЗ ELEVENLABS ЗАВЕРШЕНА УСПЕШНО!")
            logger.info(f"[{task_id}] ✅ ОБРАБОТКА ЧЕРЕЗ ELEVENLABS ЗАВЕРШЕНА УСПЕШНО!")
            
        except ElevenLabsServiceError as e:
            logger.error(f"[{task_id}] Ошибка сервиса ElevenLabs: {e}")
            task["status"] = "failed"
            task["error_message"] = f"Speech to speech processing failed: {str(e)}"
            return
        
        # Шаг 3: Создание видео через D-ID
        logger.info(f"[{task_id}] 🔥 ШАГ 3: СОЗДАНИЕ ВИДЕО ЧЕРЕЗ D-ID...")
        logger.info(f"[{task_id}] 🔥 УСТАНАВЛИВАЕМ PROGRESS = 60")
        task["progress"] = 60
        logger.info(f"[{task_id}] ✅ PROGRESS УСТАНОВЛЕН")
        
        try:
            logger.info(f"[{task_id}] 🔥 СОЗДАНИЕ D-ID SERVICE...")
            d_id_service = DIdService()
            logger.info(f"[{task_id}] ✅ D-ID SERVICE СОЗДАН")
            
            # Загружаем обработанное аудио в облако
            logger.info(f"[{task_id}] 🔥 ОТКРЫВАЕМ ОБРАБОТАННОЕ АУДИО: {processed_audio_path}")
            with open(processed_audio_path, "rb") as f:
                processed_audio_data = f.read()
            logger.info(f"[{task_id}] ✅ ОБРАБОТАННОЕ АУДИО ПРОЧИТАНО: {len(processed_audio_data)} байт")
            
            logger.info(f"[{task_id}] 🔥 ЗАГРУЖАЕМ ОБРАБОТАННОЕ АУДИО В CLOUDINARY...")
            processed_audio_result = storage_service.upload_audio(processed_audio_data, "processed_audio.mp3")
            logger.info(f"[{task_id}] ✅ ОБРАБОТАННОЕ АУДИО ЗАГРУЖЕНО: {processed_audio_result.public_url}")
            
            # Создаем видео через D-ID с публичными URL
            logger.info(f"[{task_id}] 🔥 ВЫЗОВ D-ID API:")
            logger.info(f"[{task_id}]   Image URL: {image_result.public_url}")
            logger.info(f"[{task_id}]   Audio URL: {processed_audio_result.public_url}")
            logger.info(f"[{task_id}] 🔥 ВЫЗЫВАЕМ D-ID CREATE_TALK...")
            talk_id = d_id_service.create_talk(image_result.public_url, processed_audio_result.public_url)
            logger.info(f"[{task_id}] ✅ D-ID CREATE_TALK ВЫЗВАН")
            task["talk_id"] = talk_id
            logger.info(f"[{task_id}] ✅ TALK_ID УСТАНОВЛЕН: {talk_id}")
            logger.info(f"[{task_id}] ✅ TALK СОЗДАН В D-ID: {talk_id}")
            
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