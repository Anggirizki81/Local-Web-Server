from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SHARED_FOLDER = BASE_DIR / "shared"

UPLOAD_FOLDER = BASE_DIR / "uploads"

PORT = 1981

DEBUG = True

PAGE_SIZE = 100

MAX_UPLOAD_SIZE = 20 * 1024 * 1024 * 1024  # 20 GB