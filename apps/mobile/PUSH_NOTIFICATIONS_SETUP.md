# Push Notifications Production Setup

## Code status

- Mobile now registers an Expo push token after login when push notifications are enabled.
- Backend now stores push token metadata uniformly and sends through Expo Push for Expo tokens, with FCM fallback for legacy/native tokens.

## Production migration

Run the SQL migration in dumps/push_tokens_uniform_migration.sql on production before deploying the backend.

## Required files

Place these files in apps/mobile:

- google-services.json
- GoogleService-Info.plist

You can also point to them with these env vars before build:

- GOOGLE_SERVICES_JSON
- GOOGLE_SERVICES_INFO_PLIST

## Required Expo / Firebase configuration

1. In Firebase, keep Cloud Messaging enabled for the Android app matching app.meditime.mobile.
2. In Expo/EAS, build a development build or production build. Push notifications do not work in Expo Go for this production flow.
3. For iOS production, make sure your Apple Push Notification key or certificate is configured in the Apple/Expo credentials flow used by EAS.
4. For Android production, ensure google-services.json is from the same Firebase project used by the released app.

## Validation checklist

1. Log into the mobile app on a real device.
2. Confirm the backend receives a token in POST /api/notifications/push-token.
3. Verify a row is stored in fcm_tokens with provider=expo and the correct platform.
4. Trigger a backend notification and confirm the device receives it.
5. Tap the notification and confirm the app opens to the linked screen, or /notifications by default.