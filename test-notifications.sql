-- Script pour créer des notifications de test
-- Remplacez 'USER_ID_HERE' par l'ID d'un utilisateur existant

INSERT INTO public.notifications (user_id, type, title, message, product_title, order_id, read)
VALUES 
  ('USER_ID_HERE', 'order_received', 'Commande reçue', 'Votre commande a été reçue et est en cours de traitement', 'Police Scanner Radar', gen_random_uuid(), false),
  ('USER_ID_HERE', 'order_delivered', 'Commande livrée', 'Votre ressource a été livrée avec succès', 'Firefighters Hydrant Booster', gen_random_uuid(), false),
  ('USER_ID_HERE', 'order_received', 'Nouvelle commande', 'Une nouvelle commande a été passée pour votre ressource', 'Police Drone Surveillance', gen_random_uuid(), true);

-- Pour trouver un USER_ID existant, exécutez d'abord :
-- SELECT id, email FROM auth.users LIMIT 5;
