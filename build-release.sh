#!/bin/bash

echo "🚀 Building 5str App Release"
echo "=============================="

# Check if EAS is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Login to EAS (if needed)
echo "📝 Please make sure you're logged in to EAS:"
eas whoami

echo ""
echo "🔨 Building Android Release APK..."
echo "This will create a production-ready APK file."
echo ""

# Build Android APK for release
eas build --platform android --profile release

echo ""
echo "✅ Build process initiated!"
echo "📱 You can monitor the build progress on https://expo.dev/"
echo "📦 Once complete, you'll receive a download link for your APK"
