# Schema de routage mobile

Ce schema reprend la structure fonctionnelle du web, mais l'app mobile ne monte pour l'instant que trois pages produit : login, register et calendars.

## Routes montees

| Route mobile | Fichier | Acces | Equivalent web |
| --- | --- | --- | --- |
| `/` | `app/index.tsx` | Redirect | `/:lng` |
| `/(auth)/login` | `app/(auth)/login.tsx` | Public si non connecte | `/:lng/login` |
| `/(auth)/register` | `app/(auth)/register.tsx` | Public si non connecte | `/:lng/register` |
| `/(tabs)` | `app/(tabs)/index.tsx` | Prive | `/:lng/calendars` |

## Arborescence active

```text
apps/mobile/app
  _layout.tsx
  index.tsx
  (auth)
    _layout.tsx
    login.tsx
    register.tsx
  (tabs)
    _layout.tsx
    index.tsx
```

## Redirections

| Depuis | Condition | Vers |
| --- | --- | --- |
| `/` | utilisateur connecte | `/(tabs)` |
| `/` | utilisateur non connecte | `/(auth)/login` |
| `/(auth)/*` | utilisateur connecte | `/(tabs)` |
| `/(tabs)` | utilisateur non connecte | `/(auth)/login` |

## Correspondance web complete

Ces routes web existent dans `apps/web/src/routes/AppRouter.tsx`. Elles ne sont pas montees dans l'app mobile actuelle tant que l'objectif reste limite a login, register et calendars.

| Web | Etat mobile |
| --- | --- |
| `/:lng/home` | Non montee. Pas de home mobile. |
| `/:lng/login` | Monte via `/(auth)/login`. |
| `/:lng/register` | Monte via `/(auth)/register`. |
| `/:lng/reset-password` | Non montee. |
| `/:lng/calendars` | Monte via `/(tabs)`. |
| `/:lng/settings` | Non montee. |
| `/:lng/notifications` | Non montee. |
| `/:lng/add-calendar` | Integre dans l'ecran calendars, pas une route separee. |
| `/:lng/calendar/:calendarId/*` | Non montee. |
| `/:lng/shared-user-calendar/:calendarId/*` | Non montee. |
| `/:lng/shared-token-calendar/:sharedToken/*` | Non montee. |
| `/:lng/shared-calendars` | Non montee. |
| `/:lng/accept-invite` | Non montee. |
| `/:lng/privacy` | Non montee. |
| `/:lng/terms` | Non montee. |
| `/:lng/auth/callback` | Deep link Supabase `meditime://auth/callback`, pas une page visible. |

## Regles d'implementation

- Toute logique partageable avec le web doit vivre dans `packages/*`.
- Le mobile consomme les helpers deja exportes par `@meditime/utils` avant d'ajouter du code local.
- Les routes non montees ne doivent pas avoir de fichier sous `apps/mobile/app`, car Expo Router les exposerait automatiquement.
