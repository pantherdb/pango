"""Where build records live, what builds and runs are called, and the one timestamp format."""

import os
import re
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Bumped when a field changes meaning or disappears; additions don't bump it.
SCHEMA_VERSION = 1

# This file is loader/src/build_record/paths.py.
LOADER_DIR = Path(__file__).resolve().parents[2]
DEFAULT_BUILDS_DIR = LOADER_DIR / 'builds'

_UNSAFE = re.compile(r'[^A-Za-z0-9._-]+')


def slug(text, max_length: int = 60) -> str:
    """A path- and URL-safe id part: [A-Za-z0-9._-], never starting or ending in '.' or '-'."""
    cleaned = _UNSAFE.sub('-', str(text)).strip('-.')
    return cleaned[:max_length].rstrip('-.') or 'x'


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(moment: datetime) -> str:
    """UTC with milliseconds and a trailing Z, the only timestamp format a record uses."""
    return moment.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def stamp(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')


def builds_dir() -> Path:
    """`PANGO_BUILDS_DIR`, else `loader/builds/` wherever the process was started from."""
    configured = os.environ.get('PANGO_BUILDS_DIR', '').strip()
    return Path(configured).expanduser() if configured else DEFAULT_BUILDS_DIR


def recording_enabled() -> bool:
    return os.environ.get('PANGO_RECORD', '1').strip().lower() not in ('0', 'false', 'no', 'off')


def env_text(name: str, max_length: int = 200) -> Optional[str]:
    value = os.environ.get(name, '').strip()
    return value[:max_length] or None


def build_id_from_env() -> Optional[str]:
    value = env_text('PANGO_BUILD_ID')
    return slug(value, 120) if value else None


def new_build_id(name: str, started: datetime) -> str:
    """Sorts by start time; the random suffix keeps two builds started in one second apart."""
    return f'{stamp(started)}-{slug(name, 40)}-{secrets.token_hex(2)}'


def new_run_id(step: str, dataset: Optional[str], started: datetime, pid: int) -> str:
    parts = [stamp(started), slug(step, 40)]
    if dataset:
        parts.append(slug(dataset, 40))
    parts += [str(pid), secrets.token_hex(2)]
    return '-'.join(parts)
