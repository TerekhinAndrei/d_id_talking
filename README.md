# FastAPI Backend

A modern, scalable FastAPI backend application with comprehensive features and best practices.

## Features

- 🚀 **FastAPI** - Modern, fast web framework for building APIs
- 🔐 **Security** - JWT authentication, CORS middleware, trusted host validation
- 📊 **Database** - SQLAlchemy ORM with Alembic migrations
- 🧪 **Testing** - Pytest with async support
- 📝 **Documentation** - Auto-generated OpenAPI/Swagger docs
- 🔄 **Background Tasks** - Celery for async task processing
- 💾 **Caching** - Redis integration
- ⚙️ **Configuration** - Environment-based settings with Pydantic

## Project Structure

```
app/
├── api/
│   └── v1/
│       ├── api.py          # Main API router
│       └── endpoints/      # API endpoints
│           ├── health.py   # Health check endpoints
│           └── users.py    # User management endpoints
├── core/
│   └── config.py          # Application configuration
└── main.py                # FastAPI application entry point
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your specific settings.

### 3. Run the Application

#### Development Mode
```bash
python -m app.main
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Access the API

- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health

## API Endpoints

### Health Check
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health status

### Users
- `GET /api/v1/users/` - List all users
- `GET /api/v1/users/{user_id}` - Get specific user
- `POST /api/v1/users/` - Create new user
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

## Configuration

The application uses Pydantic settings for configuration management. Key settings:

- `PROJECT_NAME` - Application name
- `VERSION` - API version
- `API_V1_STR` - API version prefix
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - JWT secret key
- `ALLOWED_HOSTS` - CORS allowed origins

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black app/
isort app/
```

### Type Checking

```bash
mypy app/
```

## Production Deployment

1. Set `ENVIRONMENT=production` in your environment
2. Configure proper `SECRET_KEY`
3. Set up database and Redis connections
4. Use a production ASGI server like Gunicorn with Uvicorn workers

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License. 