-- Script pour créer des notifications de test
-- Exécutez d'abord : SELECT id, email FROM auth.users LIMIT 5;
-- Puis remplacez 'USER_ID_HERE' par un ID d'utilisateur réel

-- Créer des notifications de test
INSERT INTO public.notifications (user_id, type, title, message, product_title, order_id, read)
VALUES 
  ('USER_ID_HERE', 'order_received', 'Commande reçue', 'Votre commande a été reçue et est en cours de traitement', 'Police Scanner Radar', gen_random_uuid(), false),
  ('USER_ID_HERE', 'order_delivered', 'Commande livrée', 'Votre ressource a été livrée avec succès', 'Firefighters Hydrant Booster', gen_random_uuid(), false),
  ('USER_ID_HERE', 'order_received', 'Nouvelle commande', 'Une nouvelle commande a été passée pour votre ressource', 'Police Drone Surveillance', gen_random_uuid(), true),
  ('USER_ID_HERE', 'order_delivered', 'Livraison confirmée', 'Votre ressource escrow a été livrée par le vendeur', 'Civilian Food Cart', gen_random_uuid(), false);

-- Vérifier les notifications créées
SELECT 
  id,
  type,
  title,
  message,
  product_title,
  read,
  created_at
FROM public.notifications 
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;
