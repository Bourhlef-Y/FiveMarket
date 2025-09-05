-- Script pour vérifier les types de ressources des produits
SELECT 
    id,
    title,
    resource_type,
    status
FROM public.resources 
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 10;
