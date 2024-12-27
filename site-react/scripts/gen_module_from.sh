# Check if the necessary arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 originalVariable newVariableName"
    exit 1
fi

originalVariable="$1"
newVariable="$2"
originalFolder="${originalVariable}s"
newFolder="${newVariable}s"

cd src/features

# Copy the original folder to the new folder
cp -r "$originalFolder" "$newFolder"

# Rename files and replace content
find "$newFolder" -type f -print0 | while IFS= read -r -d '' file; do
    # Rename files
    newFile=$(echo "$file" | sed -e "s/$originalVariable/$newVariable/g" -e "s/${originalVariable^}/${newVariable^}/g")
    mv "$file" "$newFile"
    
    # Replace content, preserving case
    sed -i -e "s/$originalVariable/$newVariable/g" -e "s/${originalVariable^}/${newVariable^}/g" "$newFile"
done

echo "Folder and contents have been renamed successfully."