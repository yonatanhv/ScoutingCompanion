#!/bin/bash

echo "Opening FRC Scouting App..."
echo "Server URL: http://localhost:5000"

# Try to detect the operating system and use the appropriate command
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "http://localhost:5000"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:5000"
  elif command -v gnome-open > /dev/null; then
    gnome-open "http://localhost:5000"
  else
    echo "Unable to open browser automatically. Please open http://localhost:5000 manually."
  fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  # Windows with Git Bash or similar
  start "http://localhost:5000"
else
  echo "Unable to open browser automatically. Please open http://localhost:5000 manually."
fi

echo "If the browser doesn't open automatically, please manually navigate to http://localhost:5000"