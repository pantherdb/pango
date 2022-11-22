import argparse
from enum import Enum
from os.path import isdir, isfile


class TableAggType(Enum):
    ANNOTATION = 'annotation'


def file_path(path):
    """
    Checks if a is valid 
    """
    print(path)
    if isfile(path):
        return path
    else:
        raise argparse.ArgumentTypeError(
            f"{path} is not a valid path")

def dir_path(path):
    if isdir(path):
        return path
    else:
        raise argparse.ArgumentTypeError(
            f"{path} is not a valid directory")

output_dir = 'tmp'
