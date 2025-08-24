#!/bin/bash
set -e

# Prefer USB, fallback to radio
if ping -c 1 -W 1 172.22.11.2 > /dev/null; then
  TARGET="lvuser@172.22.11.2"
else
  TARGET="lvuser@10.1.72.2"
fi

echo "📡 Deploying to $TARGET..."

# Adjust source folder and destination path
scp -r ./dist/* "$TARGET:/home/lvuser/dashboard/"

echo "✅ Deploy complete."
