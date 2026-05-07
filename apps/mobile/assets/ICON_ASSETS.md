# Mobile icon inventory

Scope: `apps/mobile` only. The web copies in `apps/web/public/icons` are still used by the web app, SEO metadata, manifests, PDF logo URLs and email templates.

## Used icon files

| File | Used as | Size | Background rule |
| --- | --- | ---: | --- |
| `assets/icon.png` | Expo app icon from `app.json` and iOS default/light icon from `app.config.js` | 1024 x 1024 | Opaque PNG export with a light background. Do not pre-round corners; Apple masks the square icon. |
| `assets/icon-dark.png` | iOS dark icon from `app.config.js` | 1024 x 1024 | Opaque PNG export with a dark background. Do not pre-round corners. |
| `assets/icon-tinted.png` | iOS tinted icon from `app.config.js` | 1024 x 1024 | Dedicated opaque/tint-friendly variant. Keep the mark simple and high contrast. |
| `assets/adaptive-icon.png` | Android adaptive foreground from `app.config.js` / `app.json` | 1024 x 1024 | Transparent background allowed. Keep the visible mark inside the adaptive safe area. |
| `assets/adaptive-icon-dark.png` | Android monochrome adaptive icon from `app.config.js` | 1024 x 1024 | Transparent background allowed. Artwork should work as a single-color mask. |
| `assets/splash-icon.png` | Expo splash image from `app.json` | 200 x 200 | Transparent background allowed. Icon-only, no rectangular logo. |
| `assets/icons/pills/*.png` | Pillbox fill-state icons in `src/screens/calendar/PillboxScreen.tsx` | 320 x 320 | Transparent background allowed. Generated from the matching SVG files. |
| `assets/icons/pills/*.svg` | Source files for `scripts/convert-pill-svgs.mjs` | vector | Transparent background source. |

## Apple icon rules applied

Apple's Human Interface Guidelines define iOS/iPadOS app icons as square `1024 x 1024 px` layouts. The system applies the rounded-rectangle mask, so exported files must stay square and must not include manually rounded corners.

Apple now treats app icons as layered designs with appearance variants: default, dark, clear light, clear dark, tinted light and tinted dark. This Expo setup maps the practical mobile exports to `light`, `dark` and `tinted` PNG files in `app.config.js`. Because these PNGs are not an Icon Composer package, the iOS app-icon exports are made opaque with an explicit background.

Transparent Illustrator artboards are still correct as sources. The export script adds the required opaque background only for the iOS app-icon PNGs. Android adaptive icons, splash and internal pill icons remain transparent.

## Apple design checklist

Use this checklist for the Illustrator source before exporting Apple app icons:

| Rule | Applied expectation |
| --- | --- |
| Shape | Square artboards only for iOS/iPadOS/macOS. Do not draw rounded corners or masks. |
| Size | Export Apple app icons at `1024 x 1024 px`; the system generates smaller sizes. |
| Background | Full-bleed opaque background layer. A solid color or subtle vertical gradient is preferred. |
| Foreground | One simple centered mark, preferably vector, with clearly defined edges. Avoid feathered/soft edges. |
| Safe content | Keep the main mark centered and away from the outer edges so system corner masking does not truncate it. |
| Layers | Keep Illustrator source layers separated: background plus one or more foreground layers. For native Apple production, import those layers into Icon Composer. |
| Variants | Keep the same core mark across default, dark and tinted variants. Do not swap major elements between variants. |
| Dark variant | Base it on the light icon, use complementary subdued colors and a dark color background with strong contrast. |
| Tinted variant | Keep it simple and legible; avoid relying on many small colors or details. |
| Effects | Do not bake in heavy highlights, shadows, bevels, blur or glow. Let Apple system effects handle depth where Icon Composer is used. |
| Text | Avoid text unless it is essential to the brand. Do not include the app name in the icon. |
| Content | Use an illustration or symbol, not a photo, screenshot, UI replica or Apple hardware replica. |
| Color space | Use sRGB unless a specific Display P3 workflow is intentionally chosen. |

For this Expo mobile app, `assets/icon.png`, `assets/icon-dark.png` and `assets/icon-tinted.png` are flattened PNG outputs for the current config. The Illustrator file should still keep separate layers so the same artwork can be imported into Apple's Icon Composer later if the native iOS project adopts layered icon assets.

## Removed from mobile

The following mobile copies were not referenced by `apps/mobile`: `assets/favicon.png`, `assets/icons/apple-touch-icon.png`, `assets/icons/favicon.ico`, `assets/icons/icon-16.png`, `assets/icons/icon-32.png`, `assets/icons/icon-48.png`, `assets/icons/icon-192.png`, `assets/icons/icon-512.png`, `assets/icons/logo.png`, `assets/icons/logo.webp`, `assets/icons/logo_white.png`, `assets/icons/logo_white.webp`, `assets/icons/og-image.png`, `assets/icons/datamatrix.webp`.

Their web equivalents were kept in `apps/web/public/icons` because they are used outside the mobile app.
