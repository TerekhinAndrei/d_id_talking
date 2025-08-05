import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test basic health check endpoint"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["version"] == "1.0.0"
    assert data["environment"] == "development"


def test_detailed_health_check():
    """Test detailed health check endpoint"""
    response = client.get("/api/v1/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "services" in data
    assert data["services"]["api"] == "healthy"


def test_root_endpoint():
    """Test that the root endpoint redirects to docs"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307  # Redirect to /docs
    assert response.headers["location"] == "/docs"


def test_openapi_schema():
    """Test that OpenAPI schema is accessible"""
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert data["info"]["title"] == "FastAPI Backend"
    assert data["info"]["version"] == "1.0.0" 