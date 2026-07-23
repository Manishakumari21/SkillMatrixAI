import os

# Get CORS origins from environment variable
cors_origins_str = os.getenv("CORS_ORIGINS", "")
if cors_origins_str:
    CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",")]
else:
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ]
