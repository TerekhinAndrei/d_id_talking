from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import RedirectResponse
import uvicorn
from contextlib import asynccontextmanager

from app.config import config
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting FastAPI application...")
    yield
    # Shutdown
    print("🛑 Shutting down FastAPI application...")


def create_application() -> FastAPI:
    """
    Create FastAPI application with all middleware and routes
    """
    app = FastAPI(
        title=config.PROJECT_NAME,
        version=config.VERSION,
        description="FastAPI Backend API",
        openapi_url=f"{config.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # Set up CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Set up trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=config.ALLOWED_HOSTS,
    )

    # Include API router
    app.include_router(api_router, prefix=config.API_V1_STR)

    # Root endpoint that redirects to docs
    @app.get("/")
    async def root():
        return RedirectResponse(url="/docs")

    return app


app = create_application()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    ) 