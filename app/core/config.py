from decouple import config

DATABASE_URL: str = config("DATABASE_URL")
SECRET_KEY: str = config("SECRET_KEY")
RESET_PASSWORD_SECRET: str = config("RESET_PASSWORD_SECRET", default=SECRET_KEY)
VERIFICATION_SECRET: str = config("VERIFICATION_SECRET", default=SECRET_KEY)
DEBUG: bool = config("DEBUG", default=False, cast=bool)
JWT_LIFETIME_SECONDS: int = config("JWT_LIFETIME_SECONDS", default=3600, cast=int)
MAX_IMAGE_SIZE_MB: int = config("MAX_IMAGE_SIZE_MB", default=5, cast=int)
