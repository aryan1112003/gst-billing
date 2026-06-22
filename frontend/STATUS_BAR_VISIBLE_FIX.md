# Status Bar Always Visible - Expo Configuration

## Problem
Status bar (time, battery, icons) might be hidden in the built APK.

## Solution for Expo/EAS Build

### ✅ 1. app.json Configuration
```json
{
  "expo": {
    "android": {
      "statusBar": {
        "barStyle": "dark-content",
        "backgroundColor": "#00000000",
        "translucent": true,
        "hidden": false          // ← KEY: Ensures status bar is visible
      },
      "navigationBar": {
        "visible": true,
        "barStyle": "dark-content",
        "backgroundColor": "#00000000"
      },
      "softwareKeyboardLayoutMode": "pan"
    }
  }
}
```

### ✅ 2. Use expo-status-bar (Not React Native StatusBar)

**App.tsx:**
```typescript
import { StatusBar } from 'expo-status-bar';  // ← Use Expo's StatusBar

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar 
        style="dark"              // Dark icons for light background
        translucent={true}        // Content flows behind it
        backgroundColor="transparent"
        hidden={false}            // ← Always visible
      />
      {/* Your app content */}
    </SafeAreaProvider>
  );
}
```

**MainLayout.tsx:**
```typescript
import { StatusBar } from 'expo-status-bar';  // ← Use Expo's StatusBar

export const MainLayout = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View>
      <StatusBar 
        style="dark" 
        translucent={true}
        hidden={false}
      />
      <View style={{ paddingTop: insets.top }}>
        {/* Content with safe area padding */}
      </View>
    </View>
  );
};
```

### ✅ 3. Safe Area Insets

Always use `useSafeAreaInsets()` to prevent content overlap:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<View style={{ paddingTop: insets.top }}>
  {/* Your content won't overlap status bar */}
</View>
```

## Why This Works for Expo

1. **expo-status-bar** is designed for Expo builds
2. **app.json** configuration applies to native builds
3. **hidden: false** explicitly keeps status bar visible
4. **translucent: true** allows transparent background
5. **Safe area insets** prevent content overlap

## Differences from Bare React Native

| Bare React Native | Expo/EAS Build |
|-------------------|----------------|
| Edit `styles.xml` | Edit `app.json` |
| Edit `MainActivity.java` | Not needed |
| Use `react-native` StatusBar | Use `expo-status-bar` |
| Manual gradle config | Handled by Expo |

## Build Command

```powershell
npx eas build --platform android --profile preview --clear-cache --non-interactive
```

## What You'll Get

✅ Status bar always visible (time, battery, icons)
✅ Transparent status bar with content behind it
✅ Dark icons for visibility on light backgrounds
✅ Transparent navigation bar at bottom
✅ No content overlap with system UI
✅ Floating transparent pagination footer

## Testing Checklist

After installing the APK:

- [ ] Status bar is visible at the top
- [ ] Time and battery icons are visible
- [ ] Icons are dark (visible on light background)
- [ ] Content flows behind status bar
- [ ] No content is hidden by status bar
- [ ] Navigation bar at bottom is transparent
- [ ] Pagination footer is semi-transparent
- [ ] App looks edge-to-edge

## Troubleshooting

### Status bar still hidden?
1. Check `app.json` has `"hidden": false`
2. Verify using `expo-status-bar` not `react-native`
3. Rebuild with `--clear-cache`
4. Check `hidden={false}` prop in StatusBar component

### Content overlapping status bar?
1. Ensure `SafeAreaProvider` wraps your app
2. Use `useSafeAreaInsets()` hook
3. Apply `paddingTop: insets.top` to container

### Icons not visible?
1. Set `style="dark"` for light backgrounds
2. Set `style="light"` for dark backgrounds
3. Check `barStyle: "dark-content"` in app.json

## Summary

For Expo/EAS builds:
- ✅ Use `expo-status-bar` package
- ✅ Configure `app.json` with `hidden: false`
- ✅ Use `SafeAreaProvider` and `useSafeAreaInsets()`
- ✅ No need to edit native Android files
- ✅ Rebuild with EAS Build

Your status bar will be visible in the APK! 🎉
