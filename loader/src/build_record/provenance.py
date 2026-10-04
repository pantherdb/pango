"""Which code, machine and libraries a run used, with secrets kept out of the record."""

import os
import platform
import re
import subprocess
import sys
from importlib import metadata
from pathlib import Path
from typing import Any, Optional

from .paths import LOADER_DIR

GIT_TIMEOUT_S = 3
DIRTY_PATHS = ('src', 'scripts')
PACKAGES = ('pandas', 'numpy', 'elasticsearch', 'ijson', 'requests', 'pydantic')

_SECRET_KEY = re.compile(r'(^|_)(password|passwd|secret|token|api_?key|credentials?)($|_)', re.I)
_URI_CREDENTIALS = re.compile(r'(?P<scheme>[a-z][a-z0-9+.-]*://)(?P<user>[^:/@\s]+):[^@/\s]+@', re.I)


def redact(text: str) -> str:
    """Hide the password in a `scheme://user:password@host` string."""
    return _URI_CREDENTIALS.sub(lambda m: f"{m.group('scheme')}{m.group('user')}:***@", text)


def clean_config(value: Any) -> Any:
    """JSON-safe with secrets hidden: paths become strings, tuples lists."""
    if isinstance(value, dict):
        return {str(k): ('***' if v and _SECRET_KEY.search(str(k)) else clean_config(v))
                for k, v in value.items()}
    if isinstance(value, (list, tuple, set, frozenset)):
        return [clean_config(v) for v in value]
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, str):
        return redact(value)
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return redact(str(value))


def _git(*args: str) -> Optional[str]:
    try:
        done = subprocess.run(['git', *args], cwd=LOADER_DIR, capture_output=True, text=True,
                              timeout=GIT_TIMEOUT_S)
    except (OSError, subprocess.SubprocessError):
        return None
    return done.stdout.strip() if done.returncode == 0 else None


def git_info() -> Optional[dict]:
    """Commit and branch of the loader's checkout.

    Dirty means src/ or scripts/ differ from the commit, new files included: a new
    module the build ran is as uncommitted as an edited one.
    """
    commit = _git('rev-parse', 'HEAD')
    if not commit:
        return None
    branch = _git('rev-parse', '--abbrev-ref', 'HEAD')
    status = _git('status', '--porcelain', '--untracked-files=normal', '--', *DIRTY_PATHS)
    return {
        'commit': commit,
        'short': commit[:7],
        'branch': None if branch in (None, 'HEAD') else branch,
        'dirty': None if status is None else bool(status),
    }


def host_info() -> dict:
    return {
        'name': platform.node(),
        'platform': sys.platform,
        'python': platform.python_version(),
    }


def process_info() -> dict:
    return {
        'pid': os.getpid(),
        'ppid': os.getppid(),
        'executable': sys.executable,
        'argv': [redact(str(a)) for a in sys.argv],
        'cwd': os.getcwd(),
    }


def package_versions() -> dict:
    versions = {}
    for name in PACKAGES:
        try:
            versions[name] = metadata.version(name)
        except metadata.PackageNotFoundError:
            versions[name] = None
    return versions
