# Architecture Globale

## Vue d'ensemble

```mermaid
flowchart TD
    subgraph Frontend["Frontend (Next.js)"]
        UI["Interface Utilisateur"]
        Components["Composants React"]
        Contexts["Contexts"]
        Hooks["Custom Hooks"]
    end

    subgraph Backend["Backend (Supabase)"]
        Auth["Authentication"]
        DB["PostgreSQL"]
        RLS["Row Level Security"]
        Realtime["Realtime"]
    end

    subgraph External["Services Externes"]
        Vercel["Vercel Hosting"]
        Stripe["Stripe Payment"]
    end

    UI --> Components
    Components --> Contexts
    Components --> Hooks
    Contexts --> Auth
    Hooks --> DB
    Auth --> DB
    DB --> RLS
    DB --> Realtime
    Realtime --> Contexts
    Frontend --> Vercel
    Frontend --> Stripe
```

## Composants principaux

### Frontend (Next.js)
- **Interface Utilisateur** : Pages et composants React
- **Composants React** : Composants réutilisables
- **Contexts** : Gestion de l'état global
- **Custom Hooks** : Logique réutilisable

### Backend (Supabase)
- **Authentication** : Gestion des utilisateurs
- **PostgreSQL** : Base de données principale
- **Row Level Security** : Sécurité au niveau des données
- **Realtime** : Mises à jour en temps réel

### Services Externes
- **Vercel** : Hébergement et déploiement
- **Stripe** : Gestion des paiements

## Flux de données

1. **Authentification**
   - Gestion via Supabase Auth
   - JWT pour les sessions
   - Refresh tokens automatiques

2. **Données**
   - API Routes Next.js
   - Requêtes Supabase
   - Politiques RLS
   - Subscriptions Realtime

3. **Paiements**
   - Intégration Stripe
   - Webhooks sécurisés
   - Confirmation asynchrone
