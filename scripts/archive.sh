#!/bin/bash

# Clean archive directory if exist it.
# Make archive directory if not exist it.
if [ -e archive ]; then
    echo "Clean archive directory."
    rm -rf archive
    mkdir archive
else
    echo "Make archive directory."
    mkdir archive
fi

# Build application.
echo "Build application."
npm run build

# Archive dist/index.js
echo "Archive dist/index.js to archive/slack-cleaner.zip."
zip -9qr archive/slack-cleaner.zip dist/index.js
