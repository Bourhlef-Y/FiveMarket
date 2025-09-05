-- Script de débogage pour vérifier les commandes
-- Exécutez ce script dans Supabase pour voir les commandes

-- 1. Voir toutes les commandes récentes
SELECT 
  o.id,
  o.amount,
  o.status,
  o.created_at,
  o.buyer_id,
  o.resource_id,
  r.title as resource_title,
  r.author_id as resource_author_id,
  p.username as buyer_username,
  p2.username as seller_username
FROM public.orders o
LEFT JOIN public.resources r ON o.resource_id = r.id
LEFT JOIN public.profiles p ON o.buyer_id = p.id
LEFT JOIN public.profiles p2 ON r.author_id = p2.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 2. Voir les ressources et leurs auteurs
SELECT 
  r.id,
  r.title,
  r.author_id,
  p.username as author_username
FROM public.resources r
LEFT JOIN public.profiles p ON r.author_id = p.id
WHERE r.status = 'approved'
ORDER BY r.created_at DESC
LIMIT 10;

-- 3. Vérifier les profils des vendeurs
SELECT 
  id,
  username,
  role,
  auth_email
FROM public.profiles 
WHERE role = 'seller'
ORDER BY created_at DESC;
