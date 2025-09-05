-- Création des types énumérés
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('escrow', 'non_escrow');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL UNIQUE,
    avatar text, -- Base64 de l'image
    auth_email text NOT NULL,
    description text CHECK (length(description) <= 500),
    birth_date date,
    country character varying CHECK (country::text ~ '^[A-Z]{2,3}$'::text OR country IS NULL),
    role user_role DEFAULT 'buyer'::user_role,
    discord_username text, -- Nom d'utilisateur Discord (optionnel)
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Table des ressources (avec images en base64)
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text CHECK (length(description) >= 50),
    price numeric NOT NULL CHECK (price >= 0),
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    framework text NOT NULL CHECK (framework = ANY (ARRAY['ESX'::text, 'QBCore'::text, 'Standalone'::text])),
    category text NOT NULL CHECK (category = ANY (ARRAY['Police'::text, 'Civilian'::text, 'UI'::text, 'Jobs'::text, 'Vehicles'::text])),
    thumbnail text, -- Base64 de l'image principale
    images text[] NOT NULL DEFAULT '{}', -- Tableau de Base64 pour les images additionnelles
    download_url text,
    version text,
    resource_type resource_type NOT NULL DEFAULT 'non_escrow'::resource_type,
    status resource_status DEFAULT 'draft'::resource_status,
    download_count integer DEFAULT 0,
    approved_at timestamp with time zone,
    approved_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT resources_pkey PRIMARY KEY (id)
);

-- Table du panier (fusion de user_carts et cart_items)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    price_at_time numeric NOT NULL DEFAULT 0 CHECK (price_at_time >= 0::numeric),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cart_items_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_resource UNIQUE (user_id, resource_id)
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    amount numeric NOT NULL CHECK (amount > 0::numeric),
    status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])),
    payment_intent_id text,
    paid_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- Table des informations d'escrow pour les ressources
CREATE TABLE IF NOT EXISTS public.resource_escrow_info (
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    requires_cfx_id boolean NOT NULL DEFAULT FALSE,
    requires_email boolean NOT NULL DEFAULT FALSE,
    requires_username boolean NOT NULL DEFAULT FALSE,
    delivery_instructions text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT resource_escrow_info_pkey PRIMARY KEY (resource_id)
);

-- Table des demandes de statut vendeur
CREATE TABLE IF NOT EXISTS public.seller_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
    reason text, -- Raison de la demande (optionnel)
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT seller_requests_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_request UNIQUE (user_id)
);

-- Trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application du trigger sur toutes les tables concernées
DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_resources_updated_at
        BEFORE UPDATE ON public.resources
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trigger pour synchroniser l'email de auth.users vers profiles
CREATE OR REPLACE FUNCTION sync_auth_user_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET auth_email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER sync_auth_user_email_trigger
        AFTER UPDATE OF email ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION sync_auth_user_email();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Politiques RLS

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les profils"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id AND NOT is_admin())
    WITH CHECK (auth.uid() = id AND NOT is_admin());

-- Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les ressources approuvées"
    ON public.resources FOR SELECT
    USING (status = 'approved'::resource_status OR auth.uid() = author_id);

CREATE POLICY "Les vendeurs peuvent créer des ressources"
    ON public.resources FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('seller'::user_role, 'admin'::user_role)
        )
    );

CREATE POLICY "Les vendeurs peuvent modifier leurs propres ressources"
    ON public.resources FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Les vendeurs peuvent supprimer leurs propres ressources"
    ON public.resources FOR DELETE
    USING (auth.uid() = author_id);

-- Cart Items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres articles"
    ON public.cart_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent ajouter des articles à leur panier"
    ON public.cart_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer des articles de leur panier"
    ON public.cart_items FOR DELETE
    USING (auth.uid() = user_id);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres commandes"
    ON public.orders FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres commandes"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Fonction helper pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Politiques admin
CREATE POLICY "Les admins peuvent tout faire sur les profils"
    ON public.profiles
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Les admins peuvent tout faire sur les ressources"
    ON public.resources
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources (status);
CREATE INDEX IF NOT EXISTS idx_resources_author ON public.resources (author_id);
CREATE INDEX IF NOT EXISTS idx_resources_framework ON public.resources (framework);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources (category);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_resource ON public.cart_items (resource_id);

-- Création d'un admin par défaut
UPDATE public.profiles 
SET role = 'admin' 
WHERE auth_email = 'yass.play04@gmail.com';