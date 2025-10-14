#!/bin/bash

# Find all TypeScript/TSX files and fix Text imports
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  # Check if file contains react-native import and Text
  if grep -q "from 'react-native'" "$file" && grep -q "\\bText\\b" "$file"; then
    echo "Fixing $file"

    # Fix various import patterns
    sed -i '' 's/, Text,/, Text as RNText,/g' "$file"
    sed -i '' 's/, Text }/, Text as RNText }/g' "$file"
    sed -i '' 's/{ Text,/{ Text as RNText,/g' "$file"
    sed -i '' 's/{ Text }/{ Text as RNText }/g' "$file"

    # Fix JSX tags
    sed -i '' 's/<Text /<RNText /g' "$file"
    sed -i '' 's/<\/Text>/<\/RNText>/g' "$file"
  fi
done

echo "All files fixed!"
