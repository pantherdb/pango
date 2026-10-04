"""Warnings and errors, grouped so that 40,000 copies of one line read as one row.

A record is keyed by its level, its logger and a template of its message, in which
quoted values, paths and numbers are blanked. "No PubMed summary for PMIDs 123, 456"
and the same line with other PMIDs therefore count together, and the first few
messages of each key are kept word for word.

Records come from two places: the logging module (a handler on the root logger, which
is how index_es logs) and `run.log(...)` calls for messages a step only prints.
"""

import logging
import os
import re
import traceback
from typing import Callable, Dict, Optional, Tuple

MAX_KEYS = 100
MAX_SAMPLES = 5
MAX_MESSAGE = 2000
MAX_TRACEBACK = 4000

_QUOTED = re.compile(r"'[^']*'|\"[^\"]*\"")
_PATHISH = re.compile(r'(?:[A-Za-z]:)?(?:[\w.~-]*[\\/])+[\w.~-]*')
_NUMBER = re.compile(r'(?<![A-Za-z])\d+(?:[.,:]\d+)*')
# "PMIDs 123, 456, 789" and "PMIDs 123" are the same message.
_NUMBER_LIST = re.compile(r'#(?:\s*,\s*#)+')
_SPACE = re.compile(r'\s+')
_HAS_LETTER = re.compile(r'[A-Za-z]')


def message_template(message: str) -> str:
    """The grouping form of a message: variable parts blanked, whitespace collapsed."""
    text = _QUOTED.sub("'…'", message)
    text = _PATHISH.sub(lambda m: '<path>' if _HAS_LETTER.search(m.group()) else m.group(), text)
    text = _NUMBER_LIST.sub('#', _NUMBER.sub('#', text))
    return _SPACE.sub(' ', text).strip()[:240]


def bucket_for(level: str) -> str:
    return 'error' if level in ('ERROR', 'CRITICAL') else 'warning'


class Ledger:
    """Counts warning and error records by key, keeping a few verbatim samples."""

    def __init__(self, max_keys: int = MAX_KEYS, max_samples: int = MAX_SAMPLES):
        self.max_keys = max_keys
        self.max_samples = max_samples
        self.entries: Dict[str, dict] = {}
        self.totals = {'warning': 0, 'error': 0}
        # Records whose key arrived after max_keys distinct keys: counted, not described.
        self.overflow = {'warning': 0, 'error': 0}

    def add(self, *, level: str, logger: str, message: str, at: str, phase: Optional[str] = None,
            exception: Optional[str] = None) -> Tuple[Optional[dict], bool]:
        """Count one record. Returns (its entry, or None past the key cap; whether it was sampled)."""
        bucket = bucket_for(level)
        message = message.strip()[:MAX_MESSAGE]
        self.totals[bucket] += 1
        template = message_template(message)
        key = f'{level}|{logger}|{template}'
        entry = self.entries.get(key)
        if entry is None:
            if len(self.entries) >= self.max_keys:
                self.overflow[bucket] += 1
                return None, False
            entry = {
                'key': key,
                'bucket': bucket,
                'level': level,
                'logger': logger,
                'template': template,
                'message': message,
                'count': 0,
                'first_at': at,
                'last_at': at,
                'samples': [],
            }
            self.entries[key] = entry
        entry['count'] += 1
        entry['last_at'] = at
        sampled = len(entry['samples']) < self.max_samples
        if sampled:
            sample = {'at': at, 'message': message, 'phase': phase}
            if exception:
                sample['exception'] = exception[-MAX_TRACEBACK:]
            entry['samples'].append(sample)
        return entry, sampled

    def total(self, bucket: str) -> int:
        return self.totals[bucket]

    def to_dict(self) -> dict:
        result = {}
        for bucket in ('warning', 'error'):
            entries = sorted((e for e in self.entries.values() if e['bucket'] == bucket),
                             key=lambda e: (-e['count'], e['first_at']))
            result[bucket] = {
                'total': self.totals[bucket],
                'keys': len(entries),
                'overflow': self.overflow[bucket],
                'entries': [{k: v for k, v in e.items() if k != 'bucket'} for e in entries],
            }
        return result


def record_message(record: logging.LogRecord) -> str:
    try:
        return record.getMessage()
    except Exception:  # a bad %-format must not lose the record
        return str(record.msg)


def record_exception(record: logging.LogRecord) -> Optional[str]:
    if not record.exc_info or not record.exc_info[0]:
        return None
    return ''.join(traceback.format_exception(*record.exc_info))[-MAX_TRACEBACK:]


class RecordingHandler(logging.Handler):
    """Hands WARNING and above to `sink`, from the owning process only.

    The pid check matters where pool workers are forked: a child inherits the handler
    and must not write into its parent's record. The handler never raises.
    """

    def __init__(self, sink: Callable[[logging.LogRecord], None], owner_pid: int):
        super().__init__(level=logging.WARNING)
        self.sink = sink
        self.owner_pid = owner_pid

    def emit(self, record: logging.LogRecord) -> None:
        if os.getpid() != self.owner_pid or record.name.startswith('src.build_record'):
            return
        try:
            self.sink(record)
        except Exception:
            pass
