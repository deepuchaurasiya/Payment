# PaymentTracker - Android Mobile App (Capacitor)

This folder is the standalone Android project for **Payment Tracker (DueLedger)**, pre-configured with:
- **Live Backend API**: `https://payment-tracker-gc2u-silk.vercel.app/api`
- **Capacitor 6/7** Native Android Wrapper
- **Automated GitHub Actions CI/CD** (Builds APK automatically in the cloud)

---

## 🚀 How to Get Your APK File (2 Easy Options)

### Option 1: Build & Download APK via GitHub (Recommended - No Software Needed)
1. Initialize a new Git repository in this folder (or push to a new repo on your GitHub account):
   ```bash
   git init
   git add .
   git commit -m "Initial mobile app setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/PaymentTracker-Mobile.git
   git push -u origin main
   ```
2. Go to your repository on **GitHub.com** and click on the **"Actions"** tab.
3. You will see the **"Build Android APK"** workflow running automatically.
4. Once completed (takes ~2 minutes), scroll to the **Artifacts** section at the bottom of the page and click **PaymentTracker-Debug-APK** to download your ready-to-install `.apk` file!

---

### Option 2: Build Locally using Android Studio
If you have **Android Studio** installed on your PC:
1. Double-click `open-android-studio.bat` (or run `npx cap open android`).
2. Wait for Android Studio to index the Gradle files.
3. In the top menu, go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
4. Once finished, click **"locate"** in the popup notification at the bottom right to get your `.apk` file.

---

## ⚙️ Configuration
- **API URL**: Configured in `.env` and `.env.production` (`VITE_API_URL=https://payment-tracker-gc2u-silk.vercel.app/api`).
- **App Name & ID**: Configured in `capacitor.config.json` (`Payment Tracker` / `com.dueledger.paymenttracker`).