# Android Blank Screen - Quick Fix

## 🚀 Fastest Fix (30 seconds)

```bash
cd frontend
npx react-native start --reset-cache
```

In another terminal:
```bash
npm run android
```

## 🔧 If That Doesn't Work (2 minutes)

```bash
cd frontend

# Clear app data
adb shell pm clear com.erpbusinessmanagementfrontend

# Restart
npm run android
```

## 🧹 Nuclear Option (5 minutes)

```bash
cd frontend

# Clear everything
rm -rf node_modules
rm -rf android/app/build
npm install

# Start fresh
npx react-native start --reset-cache

# In another terminal
npm run android
```

## ✅ What Was Fixed

1. **App.android.tsx** - Android-specific entry (NEW)
2. **AuthProvider** - Added 5-second timeout
3. **AsyncStorage** - Added 3-second timeout
4. **App.tsx** - Better error handling

## 📱 Expected Result

- ✅ App launches (no blank screen)
- ✅ Login screen visible
- ✅ No infinite loading
- ✅ Can interact with UI

## 🐛 Still Not Working?

### Check Logs
```bash
npx react-native log-android
```

Look for:
- "Android App ready"
- "Navigation ready"
- Any errors

### Uninstall & Reinstall
```bash
adb uninstall com.erpbusinessmanagementfrontend
npm run android
```

### Try Test App
```bash
cd frontend
mv App.tsx App.main.tsx
mv App.test.android.tsx App.tsx
npm run android
```

If test app works, the issue is in the main app.
If test app doesn't work, it's an Android/RN setup issue.

## 📚 More Help

- **Detailed Guide**: `ANDROID_FIX.md`
- **Complete Summary**: `../ANDROID_BLANK_SCREEN_FIX.md`
- **Diagnostic Tool**: `./test-android.sh`

## 💡 Quick Checks

```bash
# Is device connected?
adb devices

# Is Metro running?
lsof -i :8081

# Is app installed?
adb shell pm list packages | grep erpbusiness

# View errors
adb logcat | grep -i error
```

## ⚡ Pro Tips

1. Always clear Metro cache first
2. Check adb devices before building
3. Use `--reset-cache` flag
4. Test on real device if emulator fails
5. Check Android version (need 5.0+)

---

**Quick Status Check**:
- Metro running? ⬜
- Device connected? ⬜
- App installed? ⬜
- Login screen visible? ⬜

If all checked, you're good! ✅
