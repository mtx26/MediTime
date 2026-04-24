# Glass Effect Guide

Ce guide sert de procedure pour appliquer le rendu glass aux pages existantes du
routeur mobile.

Le point de depart est toujours:

```text
apps/mobile/ROUTER_SCHEMA.md
```

Ne pas creer une nouvelle page de test pour dire que le glass est fait. Il faut
prendre une route existante, modifier l'ecran reel utilise par cette route, puis
marquer la route dans `ROUTER_SCHEMA.md`.

## Reference

La source visuelle a suivre est la card `Etat runtime` dans:

```text
apps/mobile/app/glass-test.tsx
```

Le rendu attendu vient de `GlassView` directement, pas d'un fond blanc, pas d'un
`borderColor` manuel et pas d'un wrapper qui masque le contour natif.

## Workflow routeur

1. Ouvrir `ROUTER_SCHEMA.md`.
2. Reperer une route creee avec `✅` mais pas encore marquee glass avec `🪟`.
3. Ouvrir le fichier route dans `apps/mobile/app`.
4. Depuis ce fichier route, trouver l'ecran reel dans `apps/mobile/src/screens`.
5. Modifier les surfaces principales de cet ecran ou de ses composants directs.
6. Ne pas changer le fond global de la page: il doit rester celui du theme iOS
   (`ios.background`), donc blanc en theme clair et noir en theme sombre.
7. Lancer le type-check mobile.
8. Quand la page est vraiment convertie, ajouter `🪟` a cote de la route dans
   `ROUTER_SCHEMA.md`.

Exemple de marquage:

```text
notifications
  ✅🪟 index.tsx
```

`✅` signifie que la route existe. `🪟` signifie que la page a ete convertie en
Apple glass.

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
- Ne pas ajouter de fond decoratif, formes, halos ou gradients juste pour rendre
  le glass plus visible. Le fond de page doit rester noir/blanc via le theme.
- Ne pas marquer une route avec `🪟` tant que l'ecran reel de cette route n'a pas
  ete modifie.

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

- Verifier `ROUTER_SCHEMA.md` et confirmer que seule la route convertie a `🪟`.
- Comparer avec `app/glass-test.tsx`.
- Verifier qu'il n'y a pas de `backgroundColor` sur la surface glass.
- Verifier qu'il n'y a pas de `borderWidth` ou `borderColor` manuel.
- Verifier que `overflow: 'hidden'` n'est pas applique au `GlassView`.
- Verifier que le fond global de page reste celui du theme iOS.
- Lancer:

```bash
npm run type-check --workspace=apps/mobile
```
