-- Script pour corriger les politiques RLS de la table orders
-- Ce script permet aux vendeurs de voir les commandes de leurs produits

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Les acheteurs peuvent voir leurs commandes" ON public.orders;
DROP POLICY IF EXISTS "Les vendeurs peuvent voir les commandes de leurs produits" ON public.orders;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des commandes" ON public.orders;

-- Créer les nouvelles politiques
-- 1. Les acheteurs peuvent voir leurs propres commandes
CREATE POLICY "Les acheteurs peuvent voir leurs commandes" ON public.orders
  FOR SELECT USING (buyer_id = auth.uid());

-- 2. Les vendeurs peuvent voir les commandes de leurs produits
CREATE POLICY "Les vendeurs peuvent voir les commandes de leurs produits" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = orders.resource_id 
      AND resources.author_id = auth.uid()
    )
  );

-- 3. Les utilisateurs peuvent créer des commandes
CREATE POLICY "Les utilisateurs peuvent créer des commandes" ON public.orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- 4. Les vendeurs peuvent mettre à jour le statut de leurs commandes
CREATE POLICY "Les vendeurs peuvent mettre à jour leurs commandes" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.resources 
      WHERE resources.id = orders.resource_id 
      AND resources.author_id = auth.uid()
    )
  );

-- Vérifier que RLS est activé
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
