"""
Service metrics and monitoring
"""

import time
import statistics
from typing import Dict, Any, List
from datetime import datetime, timezone
from dataclasses import dataclass, field


@dataclass
class ServiceMetrics:
    """Service metrics collection"""
    
    service_name: str
    request_count: int = 0
    error_count: int = 0
    response_times: List[float] = field(default_factory=list)
    last_request_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def record_request(self, duration: float, success: bool = True):
        """Record a service request"""
        self.request_count += 1
        self.response_times.append(duration)
        self.last_request_time = datetime.now(timezone.utc)
        
        if not success:
            self.error_count += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        if not self.response_times:
            return {
                "service_name": self.service_name,
                "request_count": self.request_count,
                "error_count": self.error_count,
                "error_rate": 0.0,
                "avg_response_time": 0.0,
                "min_response_time": 0.0,
                "max_response_time": 0.0,
                "last_request_time": self.last_request_time.isoformat()
            }
        
        return {
            "service_name": self.service_name,
            "request_count": self.request_count,
            "error_count": self.error_count,
            "error_rate": self.error_count / self.request_count if self.request_count > 0 else 0.0,
            "avg_response_time": statistics.mean(self.response_times),
            "min_response_time": min(self.response_times),
            "max_response_time": max(self.response_times),
            "last_request_time": self.last_request_time.isoformat()
        }


class MetricsCollector:
    """Global metrics collector"""
    
    def __init__(self):
        self.metrics: Dict[str, ServiceMetrics] = {}
    
    def get_service_metrics(self, service_name: str) -> ServiceMetrics:
        """Get or create service metrics"""
        if service_name not in self.metrics:
            self.metrics[service_name] = ServiceMetrics(service_name)
        return self.metrics[service_name]
    
    def record_request(self, service_name: str, duration: float, success: bool = True):
        """Record a request for a service"""
        metrics = self.get_service_metrics(service_name)
        metrics.record_request(duration, success)
    
    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all services"""
        return {
            service_name: metrics.get_stats()
            for service_name, metrics in self.metrics.items()
        }
    
    def reset_metrics(self, service_name: str = None):
        """Reset metrics for a service or all services"""
        if service_name:
            if service_name in self.metrics:
                self.metrics[service_name] = ServiceMetrics(service_name)
        else:
            self.metrics.clear()


# Global metrics collector instance
_metrics_collector = MetricsCollector()


def get_metrics_collector() -> MetricsCollector:
    """Get global metrics collector"""
    return _metrics_collector


def record_service_request(service_name: str, duration: float, success: bool = True):
    """Record a service request"""
    _metrics_collector.record_request(service_name, duration, success)


class MetricsMiddleware:
    """FastAPI middleware for collecting request metrics"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        start_time = time.time()
        
        # Call the next middleware/application
        await self.app(scope, receive, send)
        
        # Record metrics
        duration = time.time() - start_time
        record_service_request("api", duration, True)  # Assume success for now
