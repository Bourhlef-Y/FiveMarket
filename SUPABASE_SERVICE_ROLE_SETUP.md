# Configuration du Service Role Supabase

## Aperçu

Pour permettre l'authentification par Bearer token dans les routes API, nous utilisons un client Supabase Admin avec la clé **Service Role**. Cette clé permet de contourner les restrictions RLS et de valider les tokens JWT côté serveur.

## Configuration requise

### 1. Variable d'environnement

Ajouter dans votre fichier `.env.local` :

```env
# Clé Service Role (différente de la clé publique Anon)
SUPABASE_SERVICE_ROLE_KEY=**************
```

### 2. Obtenir la Service Role Key

1. Allez dans votre projet Supabase Dashboard
2. Accédez à **Settings > API**
3. Dans la section **Project API keys**, copiez la clé `service_role`
4. ⚠️ **ATTENTION** : Cette clé donne des privilèges administrateur complets

### 3. Sécurité

- **Ne jamais** exposer cette clé côté client
- **Ne jamais** la commiter dans le code source
- Utilisez-la uniquement dans les routes API Next.js (côté serveur)
- Stockez-la dans les variables d'environnement sécurisées

## Utilisation dans les routes API

### Pattern d'authentification hybride

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // 1. Client standard pour authentification par cookies
    const supabase = createRouteHandlerClient({ cookies });
    
    let user = null;
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      // 2. Fallback avec client admin pour Bearer token
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
        
        const { data: { user: tokenUser }, error: tokenError } = 
          await supabaseAdmin.auth.getUser(token);
          
        if (!tokenError && tokenUser) {
          user = tokenUser;
        }
      }
      
      if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
    } else {
      user = authUser;
    }
    
    // Continuer avec l'utilisateur authentifié...
  } catch (error) {
    // Gestion d'erreur...
  }
}
```

## Cas d'utilisation

### 1. Authentification par cookies (navigateur)
- Utilisateur connecté via l'interface web
- Session automatiquement gérée par Supabase
- Cookies httpOnly sécurisés

### 2. Authentification par Bearer token (API/mobile)
- Applications mobiles ou intégrations tierces
- Token JWT explicite dans l'en-tête Authorization
- Validation côté serveur avec Service Role

## Avantages de cette approche

- ✅ **Compatibilité maximale** : Support cookies + Bearer token
- ✅ **Sécurité renforcée** : Validation côté serveur
- ✅ **Flexibilité** : Multiple méthodes d'authentification
- ✅ **Future-proof** : Compatible avec Supabase v2+

## Tests

### Test avec cookies
```bash
# L'utilisateur doit être connecté via l'interface web
curl -X POST https://localhost:3000/api/resources/123/images \
  -H "Content-Type: application/json" \
  -b "cookies_from_browser" \
  -d '{"images": [...]}'
```

### Test avec Bearer token
```bash
# Obtenir le token depuis supabase.auth.getSession().access_token
curl -X POST https://localhost:3000/api/resources/123/images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"images": [...]}'
```

## Dépannage

### Erreur "Invalid JWT"
- Vérifier que le token n'est pas expiré
- S'assurer que `SUPABASE_SERVICE_ROLE_KEY` est correctement configurée

### Erreur "nextCookies.get is not a function"
- Utiliser `createRouteHandlerClient({ cookies })` sans wrapper function
- S'assurer d'utiliser la version compatible de `@supabase/auth-helpers-nextjs`

### Authentification échoue
- Vérifier les logs côté serveur pour identifier la méthode d'auth utilisée
- Tester les deux méthodes séparément
