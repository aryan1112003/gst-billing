#!/bin/bash

echo "🔍 Android App Diagnostic Tool"
echo "================================"
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ adb not found. Please install Android SDK Platform Tools"
    exit 1
fi

echo "✅ adb found"
echo ""

# Check connected devices
echo "📱 Checking connected devices..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ No Android devices connected"
    echo "   Please connect a device or start an emulator"
    exit 1
fi

echo "✅ Found $DEVICES device(s)"
echo ""

# Check if app is installed
echo "📦 Checking if app is installed..."
PACKAGE="com.erpbusinessmanagementfrontend"
if adb shell pm list packages | grep -q "$PACKAGE"; then
    echo "✅ App is installed"
else
    echo "⚠️  App not installed"
    echo "   Run: npm run android"
fi
echo ""

# Check app data
echo "💾 Checking app data..."
adb shell run-as $PACKAGE ls /data/data/$PACKAGE/files/ 2>/dev/null
echo ""

# Clear cache option
echo "🧹 Options:"
echo "1. Clear app cache"
echo "2. Clear app data"
echo "3. Uninstall app"
echo "4. View logs"
echo "5. Exit"
echo ""
read -p "Select option (1-5): " option

case $option in
    1)
        echo "Clearing app cache..."
        adb shell pm clear $PACKAGE
        echo "✅ Cache cleared"
        ;;
    2)
        echo "Clearing app data..."
        adb shell run-as $PACKAGE rm -rf /data/data/$PACKAGE/files/*
        echo "✅ Data cleared"
        ;;
    3)
        echo "Uninstalling app..."
        adb uninstall $PACKAGE
        echo "✅ App uninstalled"
        ;;
    4)
        echo "Viewing logs (Ctrl+C to exit)..."
        adb logcat | grep -i "react\|error\|exception"
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        ;;
esac

echo ""
echo "Done!"
