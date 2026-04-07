from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_expire_hours: int = 8
    admin_email: str
    admin_first_name: str
    admin_last_name: str
    admin_password: str

    class Config:
        env_file = ".env"


settings = Settings()
