-- Créer la table user_carts
CREATE TABLE IF NOT EXISTS user_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES user_carts(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, resource_id)
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_resource_id ON cart_items(resource_id);

-- Activer RLS
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_carts
CREATE POLICY "Users can view their own cart" ON user_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart" ON user_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON user_carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart" ON user_carts
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour cart_items
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_carts 
      WHERE user_carts.id = cart_items.cart_id 
      AND user_carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create items in their own cart" ON cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_carts 
      WHERE user_carts.id = cart_items.cart_id 
      AND user_carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their own cart" ON cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_carts 
      WHERE user_carts.id = cart_items.cart_id 
      AND user_carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own cart" ON cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_carts 
      WHERE user_carts.id = cart_items.cart_id 
      AND user_carts.user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_user_carts_updated_at 
  BEFORE UPDATE ON user_carts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
