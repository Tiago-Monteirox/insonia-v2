import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware que limita requisições ao prefixo /auth por IP."""

    def __init__(self, app, max_requests: int = 10, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/auth"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            window_start = now - self.window_seconds

            self._requests[client_ip] = [
                t for t in self._requests[client_ip] if t > window_start
            ]

            if len(self._requests[client_ip]) >= self.max_requests:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Try again later."},
                )

            self._requests[client_ip].append(now)

        return await call_next(request)
