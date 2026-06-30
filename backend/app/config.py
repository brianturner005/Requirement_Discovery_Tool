from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/requirements.db"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 25
    storage_backend: str = "local"  # "local" or "vercel_blob" — serverless hosts have no durable local disk
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    app_version: str = "0.2.0"
    app_title: str = "Requirements Discovery & Traceability Platform"
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
