from pathlib import Path
import re
from packaging import version
import shutil
import argparse

def copy_latest_versions(src_dir, dest_dir, prefix='pango'):
   print(f"Creating directory: {dest_dir}")
   Path(dest_dir).mkdir(parents=True, exist_ok=True)
   
   dirs = [d for d in Path(src_dir).iterdir() if d.is_dir() and re.match(r'\d{4}-\d{2}-\d{2}_\d+\.\d+(\.\d+)?$', d.name)]
   
   version_groups = {}
   for dir_path in dirs:
       version_str = dir_path.name.split('_')[1]
       major_version = '.'.join(version_str.split('.')[:2])
       if major_version not in version_groups:
           version_groups[major_version] = []
       version_groups[major_version].append(dir_path)
   
   for versions in version_groups.values():
       latest = max(versions, key=lambda x: version.parse(x.name.split('_')[1]))
       major = latest.name.split('_')[1].split('.')[0]
       new_name = f"{prefix}-{major}"
       dest_path = Path(dest_dir) / new_name
       print(f"Copying {latest} -> {dest_path}")
       shutil.copytree(latest, dest_path)

def main():
   parser = argparse.ArgumentParser(description='Copy latest version directories')
   parser.add_argument('-i', dest='src_dir', help='Source directory')
   parser.add_argument('-o', dest='dest_dir', help='Destination directory')
   parser.add_argument('-p', '--prefix', default='pango', help='Prefix for destination folders (default: pango)')
   
   args = parser.parse_args()
   copy_latest_versions(args.src_dir, args.dest_dir, args.prefix)

if __name__ == "__main__":
   main()