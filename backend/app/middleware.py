from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("SECRET_KEY", "prod_secret_88374_xyz_secure")
ALGORITHM = "HS256"

class RBACMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Define sensitive routes that require STRICT 'admin' role
        # We protect the "approve/reject" endpoint specifically here as a layer of defense
        # The path matches: /requests/{id}/approve or /requests/{id}/reject
        path = request.url.path
        if request.method == "PUT" and "/requests/" in path and ("/approve" in path or "/reject" in path):
            
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return JSONResponse(status_code=403, content={"detail": "Missing Authorization Header"})
            
            try:
                # Extract "Bearer <token>"
                parts = auth_header.split()
                if len(parts) != 2 or parts[0].lower() != 'bearer':
                     return JSONResponse(status_code=403, content={"detail": "Invalid Auth Header"})
                
                token = parts[1]
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                role = payload.get("role")
                
                if role != "admin":
                    return JSONResponse(
                        status_code=403, 
                        content={"detail": "RBAC Enforcement: Admin privileges required."}
                    )
                    
            except (JWTError, ValueError):
                return JSONResponse(status_code=403, content={"detail": "Invalid or expired credentials"})

        response = await call_next(request)
        return response