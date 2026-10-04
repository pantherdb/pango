"""`python -m src.build_record begin|end`: the build record for a shell script.

    PANGO_BUILD_ID="$(python -m src.build_record begin --script all -i <input base> \
        -a <articles json> -o <output dir> || true)"
    python -m src.build_record end --build-id "$PANGO_BUILD_ID" --exit-code "$rc" || true

`begin` prints the new build id and nothing else on stdout, or nothing at all when
recording is off. Neither command exits non-zero: a recording problem goes to stderr
and never stops a build.
"""

import argparse
import sys
from typing import List, Optional

from .build import PLANNED_STEPS, begin_build, end_build


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(prog='python -m src.build_record',
                                     description='Open or close a build record.')
    commands = parser.add_subparsers(dest='command', required=True)
    begin = commands.add_parser('begin', help='write build.json and print the build id')
    begin.add_argument('--script', required=True, choices=sorted(PLANNED_STEPS))
    begin.add_argument('-i', '--input-base', help='the folder of dataset folders')
    begin.add_argument('-a', '--articles', help='the shared articles JSON (all.sh)')
    begin.add_argument('-o', '--output-dir', help='where outputs go (all.sh)')
    begin.add_argument('--label', help='free text; PANGO_BUILD_LABEL otherwise')
    end = commands.add_parser('end', help='record how the build ended')
    end.add_argument('--build-id', default='')
    end.add_argument('--exit-code', type=int, default=0)

    try:
        args = parser.parse_args(argv)
    except SystemExit:  # argparse has said why; a build must not stop over it
        return 0
    try:
        if args.command == 'begin':
            build_id = begin_build(script=args.script, input_base=args.input_base,
                                   articles=args.articles, output_dir=args.output_dir,
                                   label=args.label)
            if build_id:
                print(build_id)
        elif args.build_id:
            end_build(args.build_id, args.exit_code)
    except Exception as exc:
        print(f'build_record: {args.command} failed ({type(exc).__name__}: {exc})',
              file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
