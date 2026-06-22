# Quick Build Guide - Transparent UI Android (Expo)

## What Was Changed

### ✅ Transparent Status Bar & Navigation Bar
- Status bar is now transparent (content flows behind it)
- Navigation bar is transparent (bottom system buttons)
- Dark icons for visibility on light backgrounds
- Safe area insets prevent content overlap
- **Status bar is ALWAYS VISIBLE** (not hidden)

### ✅ Floating Transparent Footer
- Pagination footer has semi-transparent white background (15% opacity)
- Soft rounded corners (12px)
- Enhanced shadows and elevation for depth
- Pagination buttons float with rounded corners (10px)

### ✅ Expo-Specific Configuration
- Using `expo-status-bar` for better control
- Configured in `app.json` for native builds
- `hidden: false` ensures status bar is always visible
- `translucent: true` allows content behind status bar

## Build Commands

### Option 1: Quick Build (Recommended)
```powershell
npx eas build --platform android --profile preview --clear-cache --non-interactive
```

### Option 2: Full Clean Build
```powershell
# Step 1: Clean
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Step 2: Install
npm install

# Step 3: Build
npx eas build --platform android --profile preview --clear-cache --non-interactive
```

## What You'll See

1. **Status Bar**: Transparent with system time/icons visible
2. **Navigation Bar**: Transparent bottom bar
3. **Content**: Flows edge-to-edge behind system bars
4. **Pagination**: Floating semi-transparent footer with soft shadows
5. **Buttons**: Rounded pagination buttons (1, 2, 3, >) with elevation

## Files Modified

- ✅ `app.json` - Added transparent system bar config with `hidden: false`
- ✅ `App.tsx` - Using `expo-status-bar` with `hidden={false}`
- ✅ `MainLayout.tsx` - Using `expo-status-bar` with safe area insets
- ✅ `EnhancedTable.tsx` - Updated pagination styling

## Key Configuration

### app.json
```json
"statusBar": {
  "barStyle": "dark-content",
  "backgroundColor": "#00000000",
  "translucent": true,
  "hidden": false  // ← Ensures status bar is visible
}
```

### App.tsx & MainLayout.tsx
```typescript
import { StatusBar } from 'expo-status-bar';

<StatusBar 
  style="dark"           // Dark icons on light background
  translucent={true}     // Content flows behind it
  backgroundColor="transparent"
  hidden={false}         // Always visible
/>
```

## Test After Build

Install the APK and check:
- Customers screen (has pagination)
- Vendors screen (has pagination)
- Invoices screen (has pagination)

Look for:
- Transparent status bar at top
- Transparent navigation bar at bottom
- Floating pagination footer with transparency
- No content hidden behind system UI

## Ready to Build?

Run this command:
```powershell
npx eas build --platform android --profile preview --clear-cache --non-interactive
```

Build time: ~10-15 minutes

You'll get a download link and QR code when done! 🎉
