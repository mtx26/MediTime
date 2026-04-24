Legend:
  ✅ = route created in mobile app
  🪟 = page converted to Apple glass

apps/mobile/app
  ✅ _layout.tsx
  ✅ index.tsx
  ✅ +not-found.tsx

  (auth)
    ✅ _layout.tsx
    ✅ login.tsx
    ✅ register.tsx
    ✅ reset-password.tsx
    ✅ reset-password-confirm.tsx
    ✅ verify-email.tsx

  auth
    ✅ callback.tsx

  accept-invite
    ✅ index.tsx

  (tabs)
    calendars
      ✅🪟 index.tsx

      calendar
        [calendarId]
          _layout.tsx
          ✅ index.tsx
          boxes.tsx
          pillbox.tsx
          ✅ daily.tsx
          ✅ settings.tsx
          ✅ stock-alerts.tsx
          ✅ pillbox-uses.tsx
          ✅ ics-tokens.tsx
          missed-intakes
            index.tsx
            recap.tsx

      shared-user-calendar
        [calendarId]
          _layout.tsx
          ✅ index.tsx
          boxes.tsx
          pillbox.tsx
          ✅ daily.tsx
          ✅ settings.tsx
          ✅ stock-alerts.tsx
          ✅ pillbox-uses.tsx
          ✅ ics-tokens.tsx
          missed-intakes
            index.tsx
            recap.tsx

    shared-calendars
      ✅🪟 index.tsx

    notifications
      ✅🪟 index.tsx

    settings
      ✅🪟 index.tsx

  ✅🪟 privacy.tsx
  ✅ terms.tsx
