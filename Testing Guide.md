# Testing Guide

Complete verification guide for all implemented features.

---

## ✅ Feature Checklist

### 1. Camera Lock & Typing Indicator
- **Status:** ✅ Working
- **Test:**
  1. Run `npm run dev`
  2. Open `http://localhost:5173`
  3. Click on the code textarea
  4. **Expected:** Camera controls disabled, bright green border appears with "TYPING MODE - Camera Disabled"
  5. Press Escape key
  6. **Expected:** Camera controls re-enabled, typing indicator disappears

### 2. Obstacle System
- **Status:** ✅ Working
- **Test:**
  1. Run `npm run dev`
  2. Open `http://localhost:5173`
  3. **Expected:** 8 obstacles visible:
     - 4 walls (gray boxes)
     - 1 tower (tall cylinder)
     - 1 hoop (ring)
     - 2 cones (orange cones)
  4. All obstacles positioned within 2m radius
  5. Collision detection active (drone stops at obstacles)

### 3. Python Scripts (v1.1.4 API)
- **Status:** ✅ Updated
- **Changes:**
  - `get_distance()` → `get_front_range()`
  - `move_up()` → `go("up", ...)`
  - LED/buzzer commands use correct API
- **Files:**
  - `showcase.py` - Full feature demonstration
  - `obama.py` - Obama portrait flight path
  - `swarm_showcase.py` - 20-drone swarm formation

### 4. Build System
- **Status:** ✅ Working
- **Test:**
  ```bash
  npm run build
  ```
  **Expected:** Successful compilation, output in `dist/` folder

---

## 🚀 Quick Test Commands

### Run Development Server
```bash
npm run dev
# Then open: http://localhost:5173
```

### Build for Production
```bash
npm run build
```

### Build AppImage
```bash
npm run package
# Output: dist-app/Drone Planner-1.1.4.AppImage
```

---

## 📋 Test Scenarios

### Scenario 1: Basic Functionality
1. Start app with `npm run dev`
2. Verify drone model loads correctly
3. Verify base map with 8 obstacles loads
4. Verify camera controls work (mouse drag, scroll)

### Scenario 2: Typing Mode
1. Click on code textarea
2. Verify camera controls are disabled
3. Verify bright green typing indicator appears
4. Verify "TYPING MODE - Camera Disabled" text is visible
5. Press Escape
6. Verify camera controls work again
7. Verify typing indicator disappears

### Scenario 3: Obstacle Collision
1. Write code to move drone forward
2. Position drone near a wall
3. Run the code
4. Verify drone stops at obstacle (collision detection)

### Scenario 4: Python Script Generation
1. Write flight path in UI
2. Click "Generate Python"
3. Verify generated code uses v1.1.4 API:
   - `get_front_range()` instead of `get_distance()`
   - `go("up", ...)` instead of `move_up()`

---

## 🐛 Troubleshooting

### Camera Lock Not Working
- **Check:** Ensure code textarea has focus
- **Check:** Look for green border indicator
- **Fix:** Click on code textarea to activate

### Obstacles Not Visible
- **Check:** Ensure app fully loaded
- **Check:** Look for 8 objects in scene
- **Fix:** Refresh page, check browser console

### AppImage Not Running
- **Check:** File permissions
  ```bash
  chmod +x Drone\ Planner-1.1.4.AppImage
  ```
- **Check:** Try running from terminal to see errors

### Build Failing
- **Check:** Node.js version (16+ required)
- **Check:** npm version (7+ required)
- **Fix:**
  ```bash
  npm install
  npm run build
  ```

---

## 📊 Verification Results

| Feature | Status | Test Date |
|---------|--------|-----------|
| Camera Lock | ✅ Working | Today |
| Typing Indicator | ✅ Working | Today |
| Obstacle System | ✅ Working | Today |
| Collision Detection | ✅ Working | Today |
| Python Scripts v1.1.4 | ✅ Updated | Today |
| Build System | ✅ Working | Today |
| AppImage | ✅ Built | Today |

---

## 🎯 Next Steps

1. ✅ All features implemented
2. ✅ All features tested
3. ✅ Documentation complete
4. ✅ AppImage built

**Ready for production use!**

---

## 📞 Support

For issues or questions:
- Check [[Development Notes]] for technical details
- Check [[API Reference]] for educational drone API
- Review this testing guide for troubleshooting
