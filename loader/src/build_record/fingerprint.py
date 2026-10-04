"""What a file was: its size, when it changed, its checksum and how many records it holds."""

import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import ijson

from .paths import iso

CHUNK = 1 << 20


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(CHUNK), b''):
            digest.update(block)
    return digest.hexdigest()


def count_json_items(path: Any) -> int:
    """The number of items in a top-level JSON array, streamed: no record is built.

    Depth counting over ijson's basic events is several times faster than building
    each item, which matters for the 400 MB annotation outputs.
    """
    depth = 0
    count = 0
    with open(path, 'rb') as f:
        for event, _ in ijson.basic_parse(f):
            if event in ('start_map', 'start_array'):
                if depth == 1:
                    count += 1
                depth += 1
            elif event in ('end_map', 'end_array'):
                depth -= 1
            elif depth == 1 and event != 'map_key':
                count += 1
    return count


def file_fingerprint(path: Any, *, role: Optional[str] = None, sha256: bool = True,
                     records: Optional[int] = None) -> dict:
    """A file as a record describes it. A missing file gets nulls, not an error."""
    target = Path(path)
    try:
        stat = target.stat()
    except OSError:
        return {'role': role, 'path': str(path), 'bytes': None, 'modified_at': None,
                'sha256': None, 'records': records}
    digest = None
    if sha256:
        try:
            digest = sha256_of(target)
        except OSError:
            digest = None
    return {
        'role': role,
        'path': str(path),
        'bytes': stat.st_size,
        'modified_at': iso(datetime.fromtimestamp(stat.st_mtime, timezone.utc)),
        'sha256': digest,
        'records': records,
    }
