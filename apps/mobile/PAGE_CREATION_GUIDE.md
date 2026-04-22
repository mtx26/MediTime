# Mobile Page Creation Context

Use this context for every new mobile page.

## Goal

Mobile pages should reproduce the web behavior and page structure, adapted to React Native and Expo Router. The mobile implementation should avoid duplication, keep route files small, and put shared contracts in packages.

## Before Creating A Page

1. Read the matching web page.
2. Read the matching web hook or page logic.
3. Read the related shared utilities in `packages/utils`.
4. Read the related types in `packages/types`.
5. Check `ROUTER_SCHEMA.md` and create the route at the matching path.

## Route Files

Route files in `apps/mobile/app` should stay tiny.

They should usually only import a screen and pass route-specific props:

```tsx
import SomeScreen from '../../../../../src/screens/calendar/SomeScreen';

export default function Page() {
  return <SomeScreen sourceType="personal" />;
}
```

For paired routes like personal and shared-user calendars, use one shared screen and pass a source prop instead of duplicating the page.

## Screen Files

Screen files in `apps/mobile/src/screens` should be grouped by route/domain and should mostly compose UI.

Current screen folders:

- `auth`: login, register, reset password, auth callback, email verification
- `calendar`: calendar detail subpages such as overview, daily, ICS tokens, boxes, pillbox, settings
- `calendars`: the main calendars list and calendar-list-level pages
- `share`: shared calendars and invitation acceptance
- `notifications`: notification routes
- `settings`: settings routes
- `legal`: privacy and terms
- `general`: app-level fallback pages such as not found

Prefer matching hooks and screens by domain, for example:

- `src/screens/calendar/IcsTokensScreen.tsx`
- `src/hooks/calendar/useIcsTokens.ts`
- `src/components/calendar/IcsTokenCard.tsx`

Avoid putting large API logic, action builders, route decisions, and data transformations directly in screen files. Move that work into hooks or package helpers.

Good screen responsibilities:

- layout composition
- choosing which reusable components to render
- passing hook data to components
- rendering loading, empty, and error states

Avoid:

- large API functions
- duplicated personal/shared-user branches throughout JSX
- long inline helper functions
- declaring multiple React components in the same file

## Hooks

Put page logic in `apps/mobile/src/hooks`.

Hooks should handle:

- API calls
- loading and refresh states
- page actions
- route parameter extraction
- navigation helpers
- shared personal/shared-user branching
- transforming backend responses into screen-ready data

Prefer one page hook per complex screen, for example:

```ts
useCalendarDetail(...)
useSomethingSettings(...)
useSomethingList(...)
```

## Components

Use exactly one React component per file.

Do not declare helper/sub components in the same file as a screen, layout, hook consumer, or another component. If JSX becomes reusable or needs its own name, create a new file for it.

Reusable UI goes in:

- `apps/mobile/src/components/common`
- `apps/mobile/src/components/calendar`
- or another domain folder if the domain is specific

If a component needs props, define the prop type in `packages/types`, not locally, unless it is truly private and temporary.

## Shared Packages

Use packages consistently:

- `packages/types`: shared prop types, API result types, page modes, source types, model types
- `packages/utils`: shared logic, route helpers, action builders, data transforms, date helpers
- `packages/constants`: shared constants and enum-like objects

Do not duplicate logic from web when it can reasonably live in `packages/utils`.

## Header Pattern

For pushed pages:

- keep the native back arrow when possible
- use a custom title component if the title needs truncation
- put page actions in `headerRight`
- do not add a second in-page title if the header already has the page title

For root tab pages:

- header title can be simple
- bottom tab bar should remain active

## Loading Pattern

Use a reusable loading component.

Recommended states:

- full-screen loading for first page load
- inline loading for backend updates after the page is already visible
- refresh control for pull-to-refresh
- avoid showing contradictory loaders for the same request

## Navigation Pattern

Use mobile route paths from `ROUTER_SCHEMA.md`.

When adapting web links, convert them through the mobile route helper instead of hand-building the same conversion in many places.

## Type Rules

Always put reusable types in `packages/types`.

Examples:

- component prop types
- page source types
- page mode types
- API response shapes
- shared hook return/input types when used across files

Avoid local exported types in app code if they describe reusable app contracts.

## Verification

After creating or changing a page:

```bash
npm run type-check --workspace=apps/mobile
npm run type-check
```

If a route is completed, mark it with `✅` in `ROUTER_SCHEMA.md`.
