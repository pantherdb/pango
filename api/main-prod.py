
import load_env
import uvicorn
from src.config.settings import settings
from src.app import create_app

app = create_app()

if __name__ == "__main__":
    print("Starting server...", settings.HOST_PORT)
    uvicorn.run("main:app", host=settings.HOST_URL, port=settings.HOST_PORT, reload=False)