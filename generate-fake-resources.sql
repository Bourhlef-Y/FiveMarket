-- Script SQL pour générer des produits aléatoires dans la marketplace FiveMarket
-- ⚠️ ATTENTION : Ce script utilise votre ID utilisateur existant comme auteur
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier qu'il y a au moins un utilisateur dans profiles
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM profiles;
    IF user_count = 0 THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé dans la table profiles. Créez d''abord un compte.';
    END IF;
    RAISE NOTICE 'Utilisateurs trouvés: %', user_count;
END $$;

-- 2. Générer 20 ressources aléatoires
INSERT INTO resources (
    author_id,
    title,
    description,
    price,
    resource_type,
    framework,
    category,
    status,
    thumbnail_url,
    download_count,
    created_at,
    approved_at,
    approved_by
)
SELECT 
    -- Alterner entre les deux utilisateurs spécifiés
    CASE 
        WHEN RANDOM() < 0.5 THEN 'bb825890-7a7a-4b50-a3a7-4ee1f5a5f1e0'::UUID
        ELSE 'b27ce2da-7bef-4152-8089-08fa4613eaec'::UUID
    END,
    
    -- Titres et descriptions associés
    combined_data.title,
    
    -- Descriptions correspondantes
    combined_data.description,
    
    -- Prix aléatoire entre 5€ et 50€ (ou gratuit parfois)
    CASE 
        WHEN RANDOM() < 0.1 THEN 0.00  -- 10% de chance d'être gratuit
        ELSE ROUND((RANDOM() * 45 + 5)::numeric, 2)  -- Entre 5€ et 50€
    END,
    
    -- Type de ressource aléatoire
    CASE 
        WHEN RANDOM() < 0.7 THEN 'non_escrow'::resource_type
        ELSE 'escrow'::resource_type
    END,
    
    -- Framework aléatoire
    (ARRAY['ESX', 'QBCore', 'Standalone'])[FLOOR(RANDOM() * 3 + 1)]::framework_type,
    
    -- Catégorie aléatoire
    (ARRAY['Police', 'Civilian', 'UI', 'Jobs', 'Vehicles'])[FLOOR(RANDOM() * 5 + 1)]::resource_category,
    
    -- Statut (la plupart approuvés pour être visibles)
    CASE 
        WHEN RANDOM() < 0.8 THEN 'approved'::resource_status
        WHEN RANDOM() < 0.9 THEN 'pending'::resource_status
        ELSE 'draft'::resource_status
    END,
    
    -- URL de thumbnail (placeholders colorés)
    CASE FLOOR(RANDOM() * 8)
        WHEN 0 THEN 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDc3M2ZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QTVBMU0hSPC90ZXh0Pjwvc3ZnPg=='
        WHEN 1 THEN 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY3MTAxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5STFNGPC90ZXh0Pjwvc3ZnPg=='
        WHEN 2 THEN 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTBkNzM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5SRVNPVVJDRTwvdGV4dD48L3N2Zz4='
        WHEN 3 THEN 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTI1NjQ5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GSVZFTTwvdGV4dD48L3N2Zz4='
        WHEN 4 THEN 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOTMzM2VhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TQ1JJUFQvdGV4dD48L3N2Zz4='
        WHEN 5 THEN 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjU5ZTBiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BRERPTjwvdGV4dD48L3N2Zz4='
        WHEN 6 THEN 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDliYWY0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NT0Q8L3RleHQ+PC9zdmc+'
        ELSE 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjM2NjY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QTE9MSEVSPC90ZXh0Pjwvc3ZnPg=='
    END,
    
    -- Nombre de téléchargements aléatoire
    FLOOR(RANDOM() * 500),
    
    -- Date de création aléatoire dans les 30 derniers jours
    NOW() - (RANDOM() * INTERVAL '30 days'),
    
    -- Date d'approbation (pour les ressources approuvées)
    CASE 
        WHEN (ARRAY['approved'])[1] = 'approved' THEN NOW() - (RANDOM() * INTERVAL '25 days')
        ELSE NULL
    END,
    
    -- Approuvé par (le premier admin trouvé, ou NULL)
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)

FROM (
    -- Table avec numéro de ligne pour associer titre et description
    SELECT 
        title,
        description,
        ROW_NUMBER() OVER () as rn
    FROM (
        VALUES 
        ('Police MDT Advanced', 'Un système MDT complet pour les forces de police avec interface moderne, gestion des rapports et base de données intégrée. Installation simple et configuration flexible.'),
        ('Realistic Car Handling Pack', 'Pack de gestion de véhicules réaliste avec physique améliorée, dommages dynamiques et personnalisation avancée. Compatible ESX et QBCore.'),
        ('Custom EMS System', 'Système médical complet avec animations réalistes, interface soignée et gestion des blessures avancée. Parfait pour améliorer le roleplay médical.'),
        ('Advanced Banking System', 'Solution bancaire moderne avec comptes multiples, virements, prêts et interface web élégante. Sécurisé et performant.'),
        ('Mechanic Job Enhanced', 'Métier de mécanicien amélioré avec système de réparation réaliste, factures et gestion des pièces. Interface intuitive incluse.'),
        ('Realistic Weather Script', 'Script météo dynamique avec effets visuels immersifs, synchronisation serveur et cycles jour/nuit naturels. Optimisé pour les performances.'),
        ('Custom HUD Interface', 'Interface utilisateur moderne et personnalisable avec informations en temps réel. Design responsive et animations fluides.'),
        ('Drug Dealing System', 'Système de trafic de drogue complet avec zones, effets et économie équilibrée. Gestion des territoires et conflits incluse.'),
        ('Real Estate Script', 'Script immobilier avancé avec visite virtuelle, système de vente et location. Interface agent immobilier incluse.'),
        ('Garage Management System', 'Gestion complète des garages avec stockage véhicules, modifications et facturation. Compatible tous frameworks.'),
        ('Advanced Inventory', 'Système d''inventaire moderne avec glisser-déposer, catégories et interface élégante. Optimisé pour la performance.'),
        ('Custom Phone Script', 'Téléphone réaliste avec applications, messages, appels et GPS intégré. Design moderne et fonctionnalités étendues.'),
        ('Faction Management Tool', 'Outil de gestion des factions avec hiérarchie, permissions et coffres partagés. Interface d''administration complète.'),
        ('Realistic Fuel System', 'Système de carburant réaliste avec stations-service, consommation dynamique et économie intégrée. Animations incluses.'),
        ('Custom Dispatch System', 'Système de dispatch professionnel pour les services d''urgence avec carte interactive et communication intégrée.'),
        ('Advanced Shops Script', 'Script de magasins avancé avec inventaire dynamique, promotions et système de points de fidélité. Interface moderne.'),
        ('Hospital Management', 'Gestion hospitalière complète avec admissions, traitements et facturation. Système de personnel médical inclus.'),
        ('Custom Racing System', 'Système de course personnalisé avec classements, récompenses et circuits modifiables. Interface spectateur incluse.'),
        ('Realistic Damage System', 'Système de dégâts réaliste pour véhicules avec réparations progressives et effets visuels. Compatible tous véhicules.'),
        ('Advanced Admin Menu', 'Menu d''administration complet avec permissions granulaires, logs détaillés et interface moderne. Sécurisé et efficace.')
    ) AS resource_data(title, description)
) AS combined_data

LIMIT 20;

-- 3. Mettre à jour les statuts pour que les ressources soient visibles
UPDATE resources 
SET 
    status = 'approved',
    approved_at = NOW() - (RANDOM() * INTERVAL '20 days'),
    approved_by = (SELECT id FROM profiles WHERE role IN ('admin', 'seller') LIMIT 1)
WHERE status != 'approved' AND RANDOM() < 0.8;

-- 4. Afficher un récapitulatif
SELECT 
    COUNT(*) as total_resources,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_resources,
    COUNT(*) FILTER (WHERE price = 0) as free_resources,
    COUNT(*) FILTER (WHERE price > 0) as paid_resources,
    ROUND(AVG(price), 2) as average_price
FROM resources;

-- 5. Afficher quelques exemples créés
SELECT 
    title,
    price,
    category,
    framework,
    status,
    download_count
FROM resources 
ORDER BY created_at DESC 
LIMIT 10;

-- Message de fin
SELECT 
    '✅ Script terminé ! ' || COUNT(*) || ' ressources créées avec succès.' as message
FROM resources 
WHERE created_at > NOW() - INTERVAL '1 minute';
