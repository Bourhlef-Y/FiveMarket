-- Table pour stocker les informations escrow des commandes
CREATE TABLE IF NOT EXISTS public.order_escrow_info (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    cfx_id text,
    email text,
    username text,
    submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT order_escrow_info_pkey PRIMARY KEY (id),
    CONSTRAINT unique_order_escrow UNIQUE (order_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_order_escrow_info_buyer_id ON public.order_escrow_info(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_escrow_info_resource_id ON public.order_escrow_info(resource_id);

-- Politique RLS pour l'accès aux informations escrow
DROP POLICY IF EXISTS "Les acheteurs peuvent voir leurs informations escrow" ON public.order_escrow_info;
DROP POLICY IF EXISTS "Les acheteurs peuvent créer leurs informations escrow" ON public.order_escrow_info;
DROP POLICY IF EXISTS "Les acheteurs peuvent modifier leurs informations escrow" ON public.order_escrow_info;

CREATE POLICY "Les acheteurs peuvent voir leurs informations escrow" ON public.order_escrow_info
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Les acheteurs peuvent créer leurs informations escrow" ON public.order_escrow_info
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Les acheteurs peuvent modifier leurs informations escrow" ON public.order_escrow_info
  FOR UPDATE USING (buyer_id = auth.uid());

-- Activer RLS
ALTER TABLE public.order_escrow_info ENABLE ROW LEVEL SECURITY;
