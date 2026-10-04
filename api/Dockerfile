# Dockerfile
FROM python:3.13-slim

# (Optional) create a non-root user 'fastapiuser'
RUN groupadd -r fastapiuser && useradd -r -g fastapiuser fastapiuser

# uv, pinned like any other build tool
COPY --from=ghcr.io/astral-sh/uv:0.11.7 /uv /uvx /bin/

WORKDIR /app

# Use the image's Python, and compile bytecode now since the app runs as a non-root user
ENV UV_PYTHON_DOWNLOADS=never \
    UV_COMPILE_BYTECODE=1

# Install the locked dependencies (without the dev group) into /app/.venv; this layer is
# rebuilt only when the lock changes
COPY pyproject.toml uv.lock .python-version /app/
RUN uv sync --locked --no-dev --no-cache

COPY . /app

ENV PATH="/app/.venv/bin:$PATH"

# Switch to non-root user
USER fastapiuser

EXPOSE 5000

# Default command: run Gunicorn with Uvicorn workers, console logging

CMD ["sh", "-c", "gunicorn main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind ${HOST_URL}:${HOST_PORT} \
  --log-config /app/log.docker.ini \
  --workers 2"]
