# Composant Logo - FiveMarket

Un composant réutilisable pour afficher le logo FiveMarket avec différentes tailles et options de style.

## Utilisation

```typescript
import Logo from "@/components/Logo";

// Usage basique
<Logo />

// Avec différentes tailles
<Logo size="sm" />    // Petit
<Logo size="md" />    // Moyen (par défaut)
<Logo size="lg" />    // Grand
<Logo size="xl" />    // Très grand
<Logo size="hero" />  // Hero responsive

// Avec options avancées
<Logo 
  size="xl" 
  withShadow={true}
  showBackground={true}
  className="custom-class"
  href="/custom-link"
/>
```

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'hero'` | `'md'` | Taille du logo |
| `className` | `string` | `undefined` | Classes CSS supplémentaires |
| `showBackground` | `boolean` | `false` | Affiche un arrière-plan sombre |
| `withShadow` | `boolean` | `false` | Ajoute une ombre lumineuse |
| `href` | `string` | `"/"` | Lien de destination |

## Tailles disponibles

- **`sm`**: `text-lg` - Pour les petits espaces
- **`md`**: `text-xl` - Taille standard
- **`lg`**: `text-2xl` - Pour les footers, headers
- **`xl`**: `text-4xl` - Pour la navigation principale
- **`hero`**: `text-5xl md:text-6xl lg:text-7xl` - Pour les pages d'accueil

## Exemples d'utilisation

### Navigation principale
```typescript
<Logo size="xl" />
```

### Footer
```typescript
<Logo size="lg" className="mb-2" />
```

### Page héro
```typescript
<Logo size="hero" withShadow={true} showBackground={true} />
```

### Logo personnalisé
```typescript
<Logo 
  size="lg" 
  className="hover:scale-105 transition-transform" 
  href="/admin"
/>
```

## Style

Le logo utilise la police **Teko** avec les caractéristiques suivantes :
- Couleur : "Five" en orange (`#FF7101`), "Market" en blanc
- Police : Teko, font-semibold, tracking-wide
- Transition fluide et responsive
