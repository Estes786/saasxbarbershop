#!/bin/bash

# Batch text replacement script for BALIK.LAGI re-branding
# This script replaces "OASIS BI PRO" with "BALIK.LAGI" in all .md files

echo "🔄 Starting BALIK.LAGI Re-branding Batch Replacement..."
echo ""

# Count total files
TOTAL_FILES=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" | wc -l)
echo "📊 Found $TOTAL_FILES markdown files to process"
echo ""

# Counter
PROCESSED=0
UPDATED=0

# Process each .md file
for file in $(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*"); do
    PROCESSED=$((PROCESSED + 1))
    
    # Check if file contains "OASIS BI PRO"
    if grep -q "OASIS BI PRO" "$file"; then
        echo "[$PROCESSED/$TOTAL_FILES] ✏️  Updating: $file"
        
        # Create backup
        cp "$file" "${file}.backup"
        
        # Replace "OASIS BI PRO" with "BALIK.LAGI"
        sed -i 's/OASIS BI PRO/BALIK.LAGI/g' "$file"
        
        # Replace standalone "OASIS" (but keep OASIS in specific contexts like access keys)
        # This is more conservative - only replaces obvious brand references
        sed -i 's/platform OASIS/platform BALIK.LAGI/g' "$file"
        sed -i 's/untuk OASIS/untuk BALIK.LAGI/g' "$file"
        sed -i 's/di OASIS/di BALIK.LAGI/g' "$file"
        sed -i 's/Project OASIS/Project BALIK.LAGI/g' "$file"
        sed -i 's/brand OASIS/brand BALIK.LAGI/g' "$file"
        
        UPDATED=$((UPDATED + 1))
    else
        echo "[$PROCESSED/$TOTAL_FILES] ⏭️  Skipped (no changes): $file"
    fi
done

echo ""
echo "✅ Re-branding complete!"
echo "📊 Summary:"
echo "   - Total files processed: $PROCESSED"
echo "   - Files updated: $UPDATED"
echo "   - Files skipped: $((PROCESSED - UPDATED))"
echo ""
echo "💾 Backups created with .backup extension"
echo "🔍 Review changes with: git diff"
