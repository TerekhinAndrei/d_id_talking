"""
Base class for services that require authentication testing
"""

from typing import Dict, Any
from abc import abstractmethod

from app.core.base import BaseService
from app.core.interfaces import ServiceError


class AuthenticatedService(BaseService):
    """Base class for services that require authentication testing"""
    
    @abstractmethod
    async def _test_authentication_impl(self) -> Dict[str, Any]:
        """Implementation specific authentication test"""
        pass
    
    async def test_authentication(self) -> Dict[str, Any]:
        """Base authentication test implementation - eliminates duplication"""
        try:
            self.logger.info(f"Testing {self.service_name} authentication")
            result = await self._test_authentication_impl()
            
            # Standardize response format
            if isinstance(result, dict):
                if "authenticated" not in result:
                    result["authenticated"] = True
                if "message" not in result:
                    result["message"] = f"{self.service_name} authentication successful"
                if "timestamp" not in result:
                    from datetime import datetime, timezone
                    result["timestamp"] = datetime.now(timezone.utc).isoformat()
            
            self.logger.info(f"{self.service_name} authentication successful")
            return result
            
        except Exception as e:
            self.logger.error(f"{self.service_name} authentication failed: {e}")
            return {
                "authenticated": False,
                "message": f"{self.service_name} authentication failed: {str(e)}",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
