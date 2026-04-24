# Glass Effect Guide

Ce guide sert de procedure pour reproduire le rendu de reference de `app/glass-test.tsx`
dans les autres ecrans mobile.

## Reference

La source visuelle a suivre est la card `Etat runtime` dans:

```text
apps/mobile/app/glass-test.tsx
```

Le rendu attendu vient de `GlassView` directement, pas d'un fond blanc, pas d'un
`borderColor` manuel et pas d'un wrapper qui masque le contour natif.

## Regles

- Utiliser `GlassView` depuis `expo-glass-effect` pour les surfaces qui doivent
  avoir exactement le rendu natif de `glass-test`.
- Passer `colorScheme` depuis `useAppTheme()`.
- Utiliser `glassEffectStyle="clear"` pour reproduire la card de test.
- Mettre le style visuel directement sur le `GlassView`.
- Garder le contour natif du `GlassView`: ne pas ajouter `borderWidth` ou
  `borderColor` sauf besoin specifique valide.
- Eviter `overflow: 'hidden'` sur le `GlassView`, car cela peut couper le contour
  natif.
- Ne pas ajouter de `backgroundColor` sur la surface glass. Le centre doit rester
  transparent/glass, comme dans `glass-test`.
- Mettre seulement le padding necessaire. Si le contenu a deja son propre padding,
  commencer avec `padding: 8`.

## Pattern recommande

```tsx
import { GlassView, type GlassStyle } from 'expo-glass-effect';
import { useAppTheme } from '../../theme/ios';

export function ExampleGlassCard() {
  const { colorScheme } = useAppTheme();

  return (
    <GlassView
      colorScheme={colorScheme}
      glassEffectStyle="clear"
      style={{
        borderRadius: 24,
        padding: 8,
      }}
    >
      {/* contenu */}
    </GlassView>
  );
}
```

## Si le composant doit rester configurable

Exposer le style depuis le parent, comme `CalendarSection`:

```tsx
type Props = {
  glassEffectStyle?: GlassStyle;
  glassStyle?: StyleProp<ViewStyle>;
};

<GlassView
  colorScheme={colorScheme}
  glassEffectStyle={glassEffectStyle}
  style={[
    { borderRadius: 24 },
    glassStyle,
  ]}
>
  {children}
</GlassView>
```

Puis dans l'ecran:

```tsx
<CalendarSection
  glassEffectStyle="clear"
  glassStyle={{ borderRadius: 24, padding: 8 }}
/>
```

## Checklist avant de finir

- Comparer avec `app/glass-test.tsx`.
- Verifier qu'il n'y a pas de `backgroundColor` sur la surface glass.
- Verifier qu'il n'y a pas de `borderWidth` ou `borderColor` manuel.
- Verifier que `overflow: 'hidden'` n'est pas applique au `GlassView`.
- Lancer:

```bash
npm run type-check --workspace=apps/mobile
```
