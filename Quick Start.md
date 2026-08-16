# Quick Start Guide

Get started with the Educational Drone Flight Path Planner in minutes!

---

## 📥 Installation

### Option A: Use AppImage (Easiest - No Installation Required)

1. **Download** the AppImage: `Drone Planner-1.1.4.AppImage`
2. **Make executable**:
   ```bash
   chmod +x Drone\ Planner-1.1.4.AppImage
   ```
3. **Run**:
   ```bash
   ./Drone\ Planner-1.1.4.AppImage
   ```

**Note**: AppImage is **106MB** and contains everything needed to run the app.

---

### Option B: Development Setup

### Prerequisites
- **Node.js** 16 or higher
- **npm** 7 or higher
- **Python** 3.7 or higher (for running generated scripts)
- **Educational drone** hardware (optional, for real flights)

### Setup

1. **Clone or download** this vault
2. **Open terminal** in the vault folder
3. **Install dependencies**:
   ```bash
   npm install
   ```

---

## 🚀 Running the App

### Development Mode (Recommended)
```bash
npm run dev
```
- Opens in browser at `http://localhost:5173`
- Auto-reloads on code changes
- Best for development and testing

### Production Build
```bash
npm run build
npm start
```
- Creates optimized production build
- Runs Electron app

---

## 🎮 Using the Planner

### 1. Create a New Plan
1. Click **New** button in toolbar
2. Add commands from the **Command Palette**
3. Watch the 3D simulation

### 2. Add Commands
- Open **Command Palette** (click "Commands" button)
- Browse categories:
  - **Flight**: Takeoff, Land, Move, Turn, etc.
  - **Control Flow**: If, While, For loops
  - **Output**: LED, Buzzer
  - **Sensors**: Battery, Height, Distance, etc.
  - **Variables**: Set, Print, User Input
  - **Functions**: Define, Call
  - **Timer**: Start, Elapsed
- Click a command to add it to your drone

### 3. Edit Code Manually
1. View generated code in **Code Preview** panel
2. Click on the code textarea
3. **Typing Mode Activated**:
   - Camera controls are **disabled**
   - Bright **green border** appears
   - "TYPING MODE" indicator shows
4. Edit the code as needed
5. Click **Apply** to update the plan
6. Press **Escape** or click outside to exit typing mode

### 4. Simulate Flight
1. Click **Play** button
2. Watch the drone(s) move in 3D
3. Click **Stop** to pause
4. Click **Reset** to return to start

### 5. Export Code
1. Click **Export Single** for single drone code
2. Click **Export Swarm** for multi-drone code
3. Click **Export Animation** for animation script
4. Copy code and run on your educational drone

---

## 📁 Example Scripts

The vault includes three ready-to-use Python scripts:

### 1. showcase.py
**Full feature demonstration** - Shows all educational drone capabilities:
- Variables and operations
- Lists and list operations
- Functions and function calls
- All movement commands
- All sensor readings
- LED and buzzer control
- Control flow (if/else, while, for)
- Patterns (circle, square, triangle)
- Flips

### 2. obama.py
**Obama portrait** - Draws a portrait of Obama using the drone:
- Head outline
- Hair
- Eyes
- Nose
- Mouth
- Ears

### 3. swarm_showcase.py
**20-drone swarm** - Creates a face using 20 drones:
- Head outline (10 drones)
- Left eye (2 drones)
- Right eye (2 drones)
- Nose (2 drones)
- Mouth (4 drones)
- Light show with all drones

---

## 🎯 Tips & Tricks

### Camera Controls
- **Left-click + drag**: Rotate camera
- **Right-click + drag**: Pan camera
- **Scroll**: Zoom in/out
- **Disabled during typing**: Camera won't move while editing code

### Code Editing
- **Escape key**: Quick exit from typing mode
- **Green indicator**: Shows when camera is locked
- **Apply button**: Update plan from edited code

### Simulation
- **Speed control**: Adjust playback speed
- **Multiple drones**: Add more drones for swarm
- **Formation**: Use formation presets

---

## ❓ Troubleshooting

### Camera Not Moving
- **Check**: Is the code textarea focused?
- **Solution**: Click outside the textarea or press Escape

### Code Not Generating
- **Check**: Are there commands in your plan?
- **Solution**: Add commands from the palette

### Simulation Not Playing
- **Check**: Do you have commands?
- **Solution**: Add commands and try again

### App Not Starting
- **Check**: Did you run `npm install`?
- **Solution**: Run `npm install` first

---

## 📚 Learn More

- [[Development Notes]] - Technical details and architecture
- [[API Reference]] - Complete educational drone API documentation
- [[Changelog]] - Version history and updates

---

## Tags

#quickstart #guide #tutorial #beginner
