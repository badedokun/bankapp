#!/bin/bash

# List of problematic files
files=(
  "src/screens/ModernAIChatScreen.tsx"
  "src/screens/transfers/CompleteTransferFlow.tsx"
  "src/components/transfers/TransferHeader.tsx"
  "src/services/ModernNotificationService.tsx"
  "src/components/transfers/BankSelectorPicker.tsx"
)

for file in "${files[@]}"; do
  echo "Processing $file"
  
  # First fix the imports - handle TextInput too
  sed -i '' 's/TextInput/RNTextInput/g' "$file"
  
  # Fix all remaining Text patterns (not RNText, not TextInput)
  sed -i '' 's/\([^RN]\)Text /\1RNText /g' "$file"
  sed -i '' 's/^Text /RNText /g' "$file"
  sed -i '' 's/{Text}/{RNText}/g' "$file"
  sed -i '' 's/<Text/<RNText/g' "$file"
  sed -i '' 's/<\/Text>/<\/RNText>/g' "$file"
done

echo "All files processed"
