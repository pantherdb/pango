# PAN-GO API

A FastAPI application with GraphQL API powered by Strawberry GraphQL, Elasticsearch, and Poetry for dependency management.

## Overview

This GraphQL API provides access to gene annotation data, supporting queries for:

- Gene annotations and statistics
- Evidence models
- Term models
- Autocomplete functionality

## Prerequisites

- Python 3.10+
- Poetry (for dependency management)
- Docker & Docker Compose (for containerized deployment)
- Elasticsearch 8.5.0

## Setup

### 1. Install Dependencies with Poetry

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Install project dependencies
poetry install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env-example .env
```

Edit `.env` with your specific configuration (Elasticsearch host, ports, etc.)

## Running the Application

### Option 1: Local Development (without Docker)

Activate the Poetry virtual environment and run the server:

```bash
# Activate Poetry shell
poetry shell

# Run with Python
python main.py

# Or run with Poetry
poetry run python main.py
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
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src

# Run specific test file
poetry run pytest tests/test_graphql_api.py
```

### Adding Dependencies

```bash
# Add a production dependency
poetry add package-name

# Add a development dependency
poetry add --group dev package-name
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
- `pyproject.toml` - Poetry dependencies and project metadata

## Contact

For questions or issues, contact: pantherfeedback@yahoo.com
