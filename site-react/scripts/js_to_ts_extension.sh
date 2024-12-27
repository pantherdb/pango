# Ensure a directory path is provided
if [ -z "$1" ]; then
  echo "Error: Directory path not provided."
  exit 1
fi

directory_path="$1"

# Recursively find .js and .jsx files and rename them
find "$directory_path" -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
  new_file="${file//js/ts}"
  echo "Renaming $file to $new_file"
  mv "$file" "$new_file"
done