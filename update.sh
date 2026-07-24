#!/bin/bash
set -e

APP_DIR="/home/bradenz/projects/drone-planner"
INSTALL_DIR="/usr/local/bin"
DESKTOP_FILE="$HOME/.local/share/applications/drone-planner.desktop"

echo "=== Drone Planner Updater ==="
echo ""

# Pull latest from GitHub
echo "[1/4] Pulling latest changes..."
cd "$APP_DIR"
git pull origin main

# Install dependencies
echo "[2/4] Installing dependencies..."
npm install

# Build
echo "[3/4] Building..."
npm run build

# Reinstall system-wide
echo "[4/4] Installing system-wide..."
sudo rm -f "$INSTALL_DIR/drone-planner"
sudo ln -s "$APP_DIR/dist-app/Drone Planner.AppImage" "$INSTALL_DIR/drone-planner"
sudo chmod +x "$INSTALL_DIR/drone-planner"

# Update desktop entry
mkdir -p "$(dirname "$DESKTOP_FILE")"
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=Drone Planner
Exec=$INSTALL_DIR/drone-planner
Icon=drone-planner
Type=Application
Categories=Education;Science;
EOF
update-desktop-database "$HOME/.local/share/applications/" 2>/dev/null || true

echo ""
echo "Done! Drone Planner updated and installed."
echo "Run with: drone-planner"
