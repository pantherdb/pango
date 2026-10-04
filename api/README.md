# PAN-GO API

A FastAPI application with GraphQL API powered by Strawberry GraphQL, Elasticsearch, and uv for dependency management.

## Overview

This GraphQL API provides access to gene annotation data, supporting queries for:

- Gene annotations and statistics
- Evidence models
- Term models
- Autocomplete functionality

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (installs Python 3.13 itself if it's missing)
- Docker & Docker Compose (for containerized deployment)
- Elasticsearch 8.5.0

## Setup

### 1. Install Dependencies with uv

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows: powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Create .venv with Python 3.13 (.python-version) and the locked dependencies (uv.lock)
uv sync
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your specific configuration (Elasticsearch host, ports, etc.)

## Running the Application

### Option 1: Local Development (without Docker)

Run the server in the project environment:

```bash
uv run python main.py
```

The API will be available at `http://localhost:5000` (or your configured `HOST_PORT`)

### Option 2: Docker Compose (Recommended for Production)

Choose the appropriate Docker Compose configuration based on your needs:

#### Standard 4G Configuration

```bash
docker-compose -f docker-compose-4G.yaml build
docker-compose -f docker-compose-4G.yaml up -d
```

#### 4G Configuration with Kibana

```bash
docker-compose -f docker-compose-4G-kibana.yaml build
docker-compose -f docker-compose-4G-kibana.yaml up -d
```

#### 2G Configuration (Lower Memory)

```bash
docker-compose -f docker-compose-2G.yaml build
docker-compose -f docker-compose-2G.yaml up -d
```

To stop the services:

```bash
docker-compose -f <docker-compose-file> down
```

## API Access

### GraphQL Playground

Once the server is running, access the GraphQL playground:

- **Local**: `http://localhost:5000/graphql`
- **Docker**: `http://localhost:<HOST_PORT>/graphql`

## Development

### Running Tests

```bash
# Run all tests (integration tests skip when Elasticsearch is unreachable)
uv run pytest

# Offline tests only
uv run pytest -m "not integration"

# Run specific test file
uv run pytest tests/test_graphql_queries.py
```

### Adding Dependencies

```bash
# Add a production dependency
uv add package-name

# Add a development dependency
uv add --dev package-name

# Upgrade locked versions (all, or one package)
uv lock --upgrade
uv lock --upgrade-package package-name
```

### Code Quality

The project uses:

- **Pydantic** for data validation
- **Strawberry GraphQL** for GraphQL schema and resolvers
- **Pytest** for testing

## Configuration Files

- `log.ini` - Logging configuration for general use
- `log.local.ini` - Logging configuration for local development
- `log.docker.ini` - Logging configuration for Docker containers
- `pytest.ini` - Pytest configuration
- `pyproject.toml` - Dependencies and project metadata
- `uv.lock` - Locked dependency versions (commit it; Docker builds with `--locked`)
- `.python-version` - Python version uv uses (3.13)

## Contact

For questions or issues, contact: pantherfeedback@yahoo.com
