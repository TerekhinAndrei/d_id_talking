"""
Unified error handling for the application
"""

from typing import Dict, Any
from fastapi import HTTPException, status

from app.core.interfaces import ServiceError, ConfigurationError, APIError


class ServiceErrorHandler:
    """Unified error handler for converting service errors to HTTP exceptions"""
    
    @staticmethod
    def handle_service_error(error: ServiceError) -> HTTPException:
        """Convert service errors to HTTP exceptions"""
        if isinstance(error, ConfigurationError):
            return HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Configuration error: {str(error)}"
            )
        elif isinstance(error, APIError):
            return HTTPException(
                status_code=error.status_code,
                detail=f"API error {error.status_code}: {error.message}"
            )
        else:
            return HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Service error: {str(error)}"
            )
    
    @staticmethod
    def handle_validation_error(field: str, message: str) -> HTTPException:
        """Handle validation errors"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error for {field}: {message}"
        )
    
    @staticmethod
    def handle_not_found_error(resource: str, resource_id: str) -> HTTPException:
        """Handle not found errors"""
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with id {resource_id} not found"
        )
    
    @staticmethod
    def handle_unauthorized_error(message: str = "Unauthorized") -> HTTPException:
        """Handle unauthorized errors"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    @staticmethod
    def handle_forbidden_error(message: str = "Forbidden") -> HTTPException:
        """Handle forbidden errors"""
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )


class ErrorResponse:
    """Standardized error response format"""
    
    def __init__(self, error: str, message: str, details: Dict[str, Any] = None):
        self.error = error
        self.message = message
        self.details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format"""
        return {
            "success": False,
            "error": self.error,
            "message": self.message,
            "details": self.details
        }
