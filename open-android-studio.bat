@echo off
echo ==============================================
echo Opening Android Studio for PaymentTracker APK
echo ==============================================
call npm run build
call npx cap sync android
call npx cap open android
pause