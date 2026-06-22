# Android Blank Screen Fix

## Problem
The app shows a blank screen on Android but works fine on web.

## Solutions Applied

### 1. Created Android-Specific App Entry (`App.android.tsx`)
- Simplified initialization for Android
- Added timeout to prevent hanging
- Better error handling

### 2. Fixed AuthProvider
- Added 5-second timeout to prevent infinite loading
- Removed error blocking (app continues even if storage fails)
- Better AsyncStorage error handling

### 3. Fixed Auth Persistence
- Added timeout to AsyncStorage operations
- Prevents hanging if AsyncStorage is slow/unavailable

## Testing Steps

### 1. Clear App Data
```bash
# Clear React Native cache
cd frontend
npx react-native start --reset-cache

# Or clear Android app data
adb shell pm clear com.yourapp
```

### 2. Rebuild the App
```bash
cd frontend
npm start -- --clear

# In another terminal
npm run android
```

### 3. Check Logs
```bash
# View Android logs
npx react-native log-android

# Or use adb
adb logcat | grep -i "react"
```

## Common Issues & Fixes

### Issue 1: AsyncStorage Not Working

**Symptoms**: App stuck on loading screen

**Fix**: The app now has a 3-second timeout for AsyncStorage operations

**Manual Fix** (if needed):
```bash
# Clear AsyncStorage
adb shell run-as com.yourapp rm -rf /data/data/com.yourapp/files/*
```

### Issue 2: Metro Bundler Cache

**Symptoms**: Old code running

**Fix**:
```bash
cd frontend
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

### Issue 3: Android Build Cache

**Symptoms**: App not updating

**Fix**:
```bash
cd frontend/android
./gradlew clean
cd ..
npm run android
```

### Issue 4: Navigation Not Initializing

**Symptoms**: Blank screen after splash

**Fix**: The Android-specific app now has delayed initialization

**Check**:
```bash
adb logcat | grep "Navigation ready"
```

## Debug Mode

### Enable Debug Logging

Add to `frontend/App.android.tsx`:
```typescript
console.log('App State:', {
  isReady,
  error,
  platform: Platform.OS
});
```

### Check What's Rendering

In Android logs, look for:
- "Android App initializing..."
- "Android App ready"
- "Navigation ready on Android"
- "AuthProvider: Starting auth initialization..."

### View Redux State

Add to any component:
```typescript
import { useSelector } from 'react-redux';

const authState = useSelector((state: RootState) => state.auth);
console.log('Auth State:', authState);
```

## Quick Fixes

### Fix 1: Force Fresh Start
```bash
cd frontend
rm -rf node_modules
npm install
npx react-native start --reset-cache

# In another terminal
npm run android
```

### Fix 2: Clear Everything
```bash
# Clear Metro cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear watchman
watchman watch-del-all

# Clear Android build
cd android
./gradlew clean
cd ..

# Reinstall
rm -rf node_modules
npm install

# Start fresh
npm run android
```

### Fix 3: Reset Android App
```bash
# Uninstall app
adb uninstall com.yourapp

# Reinstall
npm run android
```

## Verification

After applying fixes, you should see:

1. **In Metro logs**:
   ```
   Android App initializing...
   Android App ready
   Navigation ready on Android
   ```

2. **In Android logs**:
   ```
   AuthProvider: Starting auth initialization...
   AuthProvider: Auth initialization completed
   AppNavigator - isAuthenticated: false
   ```

3. **On Device**:
   - Login screen appears
   - No blank screen
   - No infinite loading

## Still Not Working?

### Check Device/Emulator

1. **Restart Android Emulator**
   ```bash
   adb reboot
   ```

2. **Check Android Version**
   - Minimum: Android 5.0 (API 21)
   - Recommended: Android 8.0+ (API 26+)

3. **Check Available Space**
   ```bash
   adb shell df
   ```

### Check Dependencies

```bash
cd frontend
npm list react-native
npm list @react-navigation/native
npm list @react-native-async-storage/async-storage
```

### Enable React DevTools

```bash
# In Metro terminal, press 'd'
# Or shake device
# Select "Debug"
```

### Check for JavaScript Errors

```bash
adb logcat | grep -i "error\|exception"
```

## Prevention

### 1. Always Test on Android

```bash
# After any change
npm run android
```

### 2. Use Platform-Specific Code

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  // Android-specific code
}
```

### 3. Handle Async Operations

```typescript
// Always add timeout
const result = await Promise.race([
  asyncOperation(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 3000)
  )
]);
```

### 4. Test AsyncStorage

```typescript
// Test before using
try {
  await AsyncStorage.setItem('test', 'value');
  await AsyncStorage.getItem('test');
  await AsyncStorage.removeItem('test');
} catch (error) {
  console.error('AsyncStorage not working:', error);
}
```

## Files Modified

1. ✅ `frontend/App.android.tsx` - NEW: Android-specific entry
2. ✅ `frontend/App.tsx` - Better error handling
3. ✅ `frontend/src/components/Auth/AuthProvider.tsx` - Timeout added
4. ✅ `frontend/src/store/middleware/authPersistence.ts` - Timeout added

## Next Steps

1. Test on Android device/emulator
2. Check logs for any errors
3. Verify login screen appears
4. Test navigation
5. Test all features

## Support

If still having issues:

1. Check `adb logcat` for errors
2. Enable debug mode
3. Check Metro bundler logs
4. Try on different Android version
5. Test on physical device (not just emulator)

## Success Criteria

- ✅ App launches on Android
- ✅ Login screen visible
- ✅ No blank screen
- ✅ Navigation works
- ✅ No infinite loading
- ✅ AsyncStorage works (or gracefully fails)
