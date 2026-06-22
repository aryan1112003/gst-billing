# How to Start the App

## ✅ Fixed Issues
1. Added `android.package` to `app.json`
2. Added React Native CLI dependencies
3. Installed missing packages

## 🚀 Start the App (Choose One Method)

### Method 1: Using Expo (Recommended)

**Terminal 1 - Start Metro:**
```bash
cd frontend
npx expo start --clear
```

**Terminal 2 - Run on Android:**
```bash
cd frontend
npx expo start --android
```

Or press `a` in Terminal 1 after Metro starts.

### Method 2: Using npm scripts

**Terminal 1:**
```bash
cd frontend
npm start
```

**Terminal 2:**
```bash
cd frontend
npm run android
```

### Method 3: Using Batch File (Windows)

**Terminal 1:**
```bash
cd frontend
npx expo start --clear
```

**Terminal 2:**
```bash
cd frontend
start-android.bat
```

## 📱 What Should Happen

1. **Terminal 1**: Metro bundler starts
   ```
   Metro waiting on exp://...
   ```

2. **Terminal 2**: Android app builds and launches
   ```
   Building JavaScript bundle
   Opening app on Android...
   ```

3. **Device/Emulator**: App opens showing login screen

## 🐛 Troubleshooting

### Error: "android.package is not found"
✅ **FIXED** - Updated `app.json` with package name

### Error: "@react-native-community/cli not found"
✅ **FIXED** - Added to devDependencies and installed

### Error: "Metro bundler not running"
**Solution:**
```bash
cd frontend
npx expo start --clear
```

### Error: "No devices found"
**Solution:**
```bash
# Check connected devices
adb devices

# If no devices, start emulator or connect phone
```

### Error: "Port 8081 already in use"
**Solution:**
```bash
# Kill existing Metro
npx react-native start --reset-cache

# Or kill the process
# Windows:
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

## 🔍 Verify Setup

### Check app.json
```bash
cd frontend
type app.json
```

Should show:
```json
"android": {
  "package": "com.erpbusinessmanagement",
  ...
}
```

### Check dependencies
```bash
cd frontend
npm list @react-native-community/cli
```

Should show version installed.

### Check device connection
```bash
adb devices
```

Should show at least one device.

## 📋 Complete Startup Checklist

- [ ] In `frontend` directory
- [ ] Dependencies installed (`npm install`)
- [ ] Android device/emulator connected
- [ ] Metro bundler started (Terminal 1)
- [ ] Android app command run (Terminal 2)
- [ ] App opens on device

## 💡 Pro Tips

1. **Always use `--clear` flag** when starting Metro to avoid cache issues
   ```bash
   npx expo start --clear
   ```

2. **Check device before building**
   ```bash
   adb devices
   ```

3. **If stuck, restart everything**
   ```bash
   # Kill Metro
   Ctrl+C in Terminal 1
   
   # Clear cache and restart
   npx expo start --clear
   ```

4. **Use Expo Go app** for faster development (optional)
   - Install Expo Go from Play Store
   - Scan QR code from Metro terminal

## 🎯 Quick Commands

```bash
# Start Metro
cd frontend && npx expo start --clear

# Run on Android (in another terminal)
cd frontend && npx expo start --android

# Or just press 'a' in Metro terminal

# View logs
npx react-native log-android

# Clear everything and restart
cd frontend
rm -rf node_modules
npm install
npx expo start --clear
```

## ✅ Success Indicators

1. **Metro Terminal shows:**
   ```
   Metro waiting on exp://192.168.x.x:8081
   › Press a │ open Android
   ```

2. **Android Terminal shows:**
   ```
   › Opening exp://192.168.x.x:8081 on Android...
   › Opening app on Android...
   ```

3. **Device shows:**
   - App launches
   - Login screen visible
   - No errors

## 🆘 Still Having Issues?

1. Check `ANDROID_FIX.md` for Android-specific issues
2. Check `QUICK_FIX.md` for quick solutions
3. Run diagnostic: `./test-android.sh`
4. Check logs: `adb logcat | grep -i error`

---

**Status**: ✅ Configuration Fixed
**Next**: Start Metro → Run Android → Test App
