# Dockerfile
FROM python:3.10-slim

# (Optional) create a non-root user 'fastapiuser'
RUN groupadd -r fastapiuser && useradd -r -g fastapiuser fastapiuser

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml poetry.lock /app/

RUN pip install --no-cache-dir poetry

# Disable Poetry's virtualenv creation inside container
RUN poetry config virtualenvs.create false

RUN poetry install --no-ansi --no-interaction --no-root

COPY . /app

# Switch to non-root user
USER fastapiuser

EXPOSE 5000

# Default command: run Gunicorn with Uvicorn workers, console logging

CMD ["sh", "-c", "gunicorn main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind ${HOST_URL}:${HOST_PORT} \
  --log-config /app/log.docker.ini \
  --workers 2"]