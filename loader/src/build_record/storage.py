"""Files a reader never sees half-written: the JSON snapshots and the append-only events file."""

import json
import os
import time
from pathlib import Path
from typing import Any

# On Windows os.replace fails while another process (the dashboard) holds the target
# open for reading. A read takes milliseconds, so a short retry nearly always wins.
REPLACE_ATTEMPTS = 8
REPLACE_BACKOFF_S = 0.025


def write_json_atomic(path: Path, data: Any) -> None:
    """Write `data` to `path` through a temp file and os.replace. Raises on failure."""
    tmp = path.with_name(f'.{path.name}.{os.getpid()}.tmp')
    try:
        with open(tmp, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(data, f, ensure_ascii=False, indent=1, default=str)
        for attempt in range(REPLACE_ATTEMPTS):
            try:
                os.replace(tmp, path)
                return
            except PermissionError:
                if attempt == REPLACE_ATTEMPTS - 1:
                    raise
                time.sleep(REPLACE_BACKOFF_S * (attempt + 1))
    finally:
        if tmp.exists():
            try:
                tmp.unlink()
            except OSError:
                pass


def read_json(path: Path) -> Any:
    with open(path, encoding='utf-8') as f:
        return json.load(f)


class EventWriter:
    """One JSON object per line. Only the owning process writes its file, and line
    buffering lets a reader tail it while the run goes on."""

    def __init__(self, path: Path):
        self.path = path
        self._file = open(path, 'a', encoding='utf-8', newline='\n', buffering=1)

    def write(self, event: dict) -> None:
        self._file.write(json.dumps(event, ensure_ascii=False, default=str) + '\n')

    def close(self) -> None:
        try:
            self._file.close()
        except OSError:
            pass
