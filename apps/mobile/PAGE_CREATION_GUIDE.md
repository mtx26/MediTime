# Mobile Page Creation Context

Use this context for every new mobile page.

## Goal

Mobile pages should reproduce the web behavior and page structure, adapted to React Native and Expo Router.

The priority is:

1. use Apple-native components and interactions whenever they exist
2. use community wrappers for native iOS components when React Native core does not expose them
3. build a custom component only when no acceptable native option exists

Do not jump directly to a custom UI.

## Native-First Rule

Before creating a new mobile UI element, always check whether an Apple-native component or pattern already exists.

Examples:

- action sheets
- pickers
- date and time pickers
- segmented controls
- switches
- search bars
- lists and grouped settings sections
- native navigation headers

If a native component or native-style wrapper exists, prefer it.

If you find that a native option probably exists but you are not sure whether it should be used here, stop and ask before continuing.

If you find a native option and a custom option is still possible, do not choose the custom option by default. Stop and ask what should be done.

## Before Creating A Page

1. Read the matching web page.
2. Read the matching web hook or page logic.
3. Read the related shared utilities in `packages/utils`.
4. Read the related types in `packages/types`.
5. Check `ROUTER_SCHEMA.md` and create the route at the matching path.
6. Check whether Apple already has a native component or interaction for the UI you are about to build.

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

Screen files in `apps/mobile/src/screens` should mostly compose UI.

Avoid putting large API logic, action builders, route decisions, and data transformations directly in screen files. Move that work into hooks or package helpers.

Good screen responsibilities:

- layout composition
- choosing which reusable components to render
- passing hook data to components
- rendering loading, empty, and error states
- preferring native iOS components when available

Avoid:

- large API functions
- duplicated personal/shared-user branches throughout JSX
- long inline helper functions
- inventing custom controls when Apple already has one

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

## Components

Use exactly one React component per file.

If a component needs to be custom, first confirm that no Apple-native component is the better fit.

Reusable UI goes in:

- `apps/mobile/src/components/common`
- `apps/mobile/src/components/calendar`
- or another domain folder if the domain is specific

If a component needs props, define the prop type in `packages/types`, not locally, unless it is truly private and temporary.

## Shared Packages

Use packages consistently:

- `packages/types`
- `packages/utils`
- `packages/constants`

Do not duplicate logic from web when it can reasonably live in `packages/utils`.

## Header Pattern

For pushed pages:

- keep the native back arrow when possible
- use native page actions when possible
- put page actions in `headerRight`
- do not add a second in-page title if the header already has the page title

## Loading Pattern

Use a reusable loading component.

Recommended states:

- full-screen loading for first page load
- inline loading for backend updates after the page is already visible
- refresh control for pull-to-refresh

## Navigation Pattern

Use mobile route paths from `ROUTER_SCHEMA.md`.

When adapting web links, convert them through the mobile route helper instead of hand-building the same conversion in many places.

## Type Rules

Always put reusable types in `packages/types`.

## Verification

After creating or changing a page:

```bash
npm run type-check --workspace=apps/mobile
npm run type-check
```

If a route is completed, mark it with `✅` in `ROUTER_SCHEMA.md`.
