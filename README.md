# D-ID Talking Avatar Generator

A web application that generates talking avatars using D-ID API, ElevenLabs speech processing, and Cloudinary file storage.

## Features

- **Voice Processing**: Audio processing through ElevenLabs Speech-to-Speech
- **Video Generation**: Talking avatar generation using D-ID API
- **File Storage**: Cloudinary integration for image and audio storage
- **Real-time Progress**: Live progress tracking for video generation
- **Modern UI**: React-based frontend with modern design

## Architecture

### Backend (FastAPI)
- **API Endpoints**: `/api/v1/generate`, `/api/v1/status`, `/api/v1/voices`
- **Services**: D-ID, ElevenLabs, Cloudinary integration
- **File Processing**: Audio conversion and image normalization
- **Background Tasks**: Asynchronous video generation

### Frontend (React + Vite)
- **File Upload**: Image and audio file upload
- **Voice Selection**: ElevenLabs voice selection
- **Progress Tracking**: Real-time generation progress
- **Video Display**: Generated video playback

## External APIs

### D-ID API
- **Purpose**: Video generation with talking avatars
- **Endpoints**: `/talks`, `/talks/{id}`
- **Features**: Face animation, audio synchronization

### ElevenLabs API
- **Purpose**: Speech-to-Speech audio processing
- **Endpoints**: `/v1/speech-to-speech/{voice_id}`
- **Features**: Voice cloning, audio enhancement

### Cloudinary
- **Purpose**: File storage and CDN
- **Features**: Image and audio upload, public URLs

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- D-ID API key
- ElevenLabs API key
- Cloudinary account

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
cp env.example .env
# Edit .env with your API keys

# Run backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 3001
```

### Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Run development server
npm run dev
```

## Environment Variables

```env
# D-ID API
D_ID_API_KEY=your_d_id_api_key
D_ID_API_URL=https://api.d-id.com

# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_API_URL=https://api.elevenlabs.io

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## Usage

1. **Upload Image**: Select a photo for the avatar
2. **Record Audio**: Record or upload audio file
3. **Select Voice**: Choose from available ElevenLabs voices
4. **Generate Video**: Start the generation process
5. **View Result**: Watch the generated talking avatar

## API Endpoints

### POST /api/v1/generate
Generate a talking avatar video.

**Request:**
- `image_file`: Image file (multipart/form-data)
- `audio_file`: Audio file (multipart/form-data)
- `voice_id`: ElevenLabs voice ID

**Response:**
```json
{
  "task_id": "uuid",
  "status": "processing",
  "progress": 0
}
```

### GET /api/v1/status/{task_id}
Get generation status and result.

**Response:**
```json
{
  "task_id": "uuid",
  "status": "completed",
  "progress": 100,
  "video_url": "https://...",
  "error_message": null
}
```

### GET /api/v1/voices
Get available ElevenLabs voices.

**Response:**
```json
[
  {
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "name": "Rachel",
    "category": "premade"
  }
]
```

## File Processing

### Image Normalization
- Removes spaces and special characters
- Handles URL encoding
- Prevents double extensions
- Supports JPG, JPEG, PNG formats

### Audio Processing
- Converts to MP3 format
- Processes through ElevenLabs Speech-to-Speech
- Maintains original quality
- Supports various input formats

## Development

### Testing
```bash
# Run backend tests
python -m pytest tests/

# Test external APIs
python test_full_flow.py
```

### Code Structure
```
d_id_talking/
├── app/
│   ├── api/v1/endpoints/    # API endpoints
│   ├── services/            # External API services
│   ├── models/              # Data models
│   └── config.py           # Configuration
├── frontend/               # React application
├── tests/                  # Test files
└── uploads/               # Temporary file storage
```

## Troubleshooting

### Common Issues
1. **D-ID API Errors**: Check API key and rate limits
2. **ElevenLabs Errors**: Verify voice ID and API key
3. **Cloudinary Errors**: Check upload credentials
4. **File Upload Issues**: Ensure proper file formats

### Debug Mode
Enable detailed logging by setting `DEBUG=true` in environment variables.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Open an issue on GitHub 