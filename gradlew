#!/usr/bin/env bash
set -euo pipefail

export EXPO_PUBLIC_DOMAIN=kochlojistik.com

npm install --legacy-peer-deps
npx expo prebuild --platform android --no-install

pushd android >/dev/null
chmod +x gradlew
./gradlew assembleDebug --no-daemon
popd >/dev/null

mkdir -p app/build/outputs/apk/debug
cp android/app/build/outputs/apk/debug/app-debug.apk app/build/outputs/apk/debug/app-debug.apk
