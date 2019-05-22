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
echo "Archive dist/index.js and config/default.json to archive/slack-cleaner.zip."
mkdir .tmp .tmp/config
cd .tmp
cp ../dist/index.js ./index.js
cp ../config/default.json ./config/default.json
zip -9qr slack-cleaner.zip .
cp slack-cleaner.zip ../archive
cd ..
rm -rf .tmp
