import argparse
from enum import Enum
from dotenv import load_dotenv
from os.path import abspath, join, dirname, isdir, isfile
import os


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
