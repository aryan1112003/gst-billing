# Debug Black Screen on Expo Go

## Current Status
- ✅ App loads in Expo Go
- ❌ Shows black screen
- ✅ Bundle completes (52138ms)

## Quick Fixes to Try

### Fix 1: Reload App
In Metro terminal, press **`r`**

### Fix 2: Clear Cache and Reload
```bash
# Stop Metro (Ctrl+C)
# Restart with clear cache
npx expo start --clear

# Then reload in Expo Go
```

### Fix 3: Enable Debug Mode
1. Shake your phone
2. Select "Debug Remote JS"
3. Check browser console for errors

### Fix 4: Check Expo Go Logs
1. Shake phone
2. Select "Show Performance Monitor"
3. Look for errors

## What to Check

### In Metro Terminal
Look for these logs:
```
App initializing...
App ready
Navigation ready
AuthProvider: Starting auth initialization...
AuthProvider: Auth initialization completed
```

### In Expo Go App
- Shake phone
- Select "Debug Remote JS"
- Open browser console (http://localhost:19000/debugger-ui/)
- Look for errors

## Common Causes

### 1. AsyncStorage Hanging
**Symptom**: App stuck after "App ready"
**Fix**: Already added timeout in AuthProvider

### 2. Navigation Not Initializing
**Symptom**: Black screen, no errors
**Fix**: Check if NavigationContainer is rendering

### 3. Theme Issues
**Symptom**: White/black screen
**Fix**: Check theme configuration

### 4. Component Error
**Symptom**: Silent crash
**Fix**: Enable error boundary

## Enable More Logging

Add to `App.tsx`:
```typescript
React.useEffect(() => {
  console.log('=== APP MOUNTED ===');
  console.log('Store state:', store.getState());
  console.log('Theme:', theme);
}, []);
```

## Try Minimal App

Temporarily replace `App.tsx` content with:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  console.log('MINIMAL APP RENDERING');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello from ERP App!</Text>
      <Text style={styles.subtext}>If you see this, React Native works!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  text: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
});
```

If this shows text, the issue is in the app logic.
If this is still black, it's an Expo Go issue.

## Check Device

### Android Version
- Minimum: Android 5.0
- Recommended: Android 8.0+

### Expo Go Version
- Update to latest from Play Store

### Device Storage
- Ensure sufficient space

## Next Steps

1. **Press `r` in Metro** to reload
2. **Shake phone** → Debug Remote JS
3. **Check browser console** for errors
4. **Try minimal app** to isolate issue

## If Still Black

Try these in order:

1. **Close Expo Go completely**
   - Swipe away from recent apps
   - Reopen and scan QR code

2. **Clear Expo Go cache**
   - Android: Settings → Apps → Expo Go → Clear Cache

3. **Reinstall Expo Go**
   - Uninstall from Play Store
   - Reinstall
   - Scan QR code again

4. **Try on different device**
   - Test on another phone
   - Or use Android emulator

5. **Use development build instead**
   - Build APK with `eas build`
   - Install on device
   - More stable than Expo Go

## Report Issue

If nothing works, provide:
1. Metro terminal logs
2. Browser console logs (from Debug Remote JS)
3. Android version
4. Expo Go version
5. Any error messages

---

**Most Likely Fix**: Press `r` in Metro terminal to reload!
