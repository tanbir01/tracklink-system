# TrackLink Android App Build & Setup Guide

This guide describes how to build, compile, install, and configure the Android background tracker client application.

## Prerequisites
- **Android Studio** (Hedgehog 2023.1.1 or newer recommended).
- Android SDK 34 (Android 14) installed.
- Gradle version 8.0+ configuration.
- A physical Android device running Android 8.0 (Oreo / API 26) or newer.

---

## Step 1: Open Project in Android Studio
1. Launch Android Studio.
2. Select **Open** and browse to the `./android` directory inside the project directory.
3. Gradle will begin syncing and downloading required dependencies (Fused Location Provider, Room database, OkHttp, Retrofit, Hilt DI compiler).

---

## Step 2: Hilt Compiler Check
Make sure **KSP** (Kotlin Symbol Processing) compiles dependencies correctly. If you get dependency compiler errors, run:
```bash
./gradlew clean build
```

---

## Step 3: Run the App
- Connect your physical Android phone via USB debugging.
- Click the **Run** button (green arrow) in Android Studio to deploy the debug APK.
- If testing on the official Android Emulator, the loopback gateway address is pre-configured to `http://10.0.2.2:8000/api/` which links to your host PC backend.

---

## Step 4: Client Configuration

### 1. Sign In
When opening the client for the first time:
- Input your **Server Gateway URL** (e.g., `https://tracklink.yourdomain.com/api/` or `http://192.168.1.100:8000/api/`).
- Sign in with your dashboard admin credentials (`admin@tracklink.local` / password).

### 2. Telemetry Toggle
- Grant permissions for **Location Access** and **Background Location Access** (select *Allow all the time*).
- Tap **Start Telemetry Tracking** to begin background telemetry.

---

## Optimizing Background Performance

To ensure Android does not kill the foreground tracking service:
1. Go to **Settings** > **Apps** > **TrackLink**.
2. Tap **Battery** and select **Unrestricted** (removes battery optimization limits).
3. Ensure background data is allowed.
