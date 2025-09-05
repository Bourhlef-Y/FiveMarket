-- Table pour les notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type = ANY (ARRAY['order_received'::text, 'order_delivered'::text, 'order_cancelled'::text])),
    title text NOT NULL,
    message text NOT NULL,
    product_title text,
    order_id uuid,
    read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Politique RLS pour les notifications
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs notifications" ON public.notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des notifications" ON public.notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent marquer leurs notifications comme lues" ON public.notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs notifications" ON public.notifications;

CREATE POLICY "Les utilisateurs peuvent voir leurs notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent créer des notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Les utilisateurs peuvent marquer leurs notifications comme lues" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent supprimer leurs notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
