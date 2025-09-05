"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  framework: string;
  images?: string;
  download_count: number;
  created_at: string;
  status: string;
  author_id: string;
}

export default function TestProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-products');
      const data = await response.json();
      console.log('Produits de test:', data);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async () => {
    try {
      const response = await fetch('/api/test-approve', { method: 'POST' });
      const data = await response.json();
      console.log('Résultat approbation:', data);
      if (response.ok) {
        loadProducts(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur approbation:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7101]"></div>
          <p className="text-gray-400 text-sm">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Produits de test</h1>
      
      <div className="mb-4 flex space-x-4">
        <Button onClick={loadProducts} className="bg-[#FF7101] hover:bg-[#FF7101]/90">
          Recharger
        </Button>
        <Button onClick={approveProduct} className="bg-green-600 hover:bg-green-700">
          Approuver un produit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">{product.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">{product.description}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Prix: {product.price}€</p>
                <p className="text-sm text-gray-400">Catégorie: {product.category}</p>
                <p className="text-sm text-gray-400">Framework: {product.framework}</p>
                <p className="text-sm text-gray-400">Statut: {product.status}</p>
                <p className="text-sm text-gray-400">Auteur ID: {product.author_id}</p>
                <p className="text-sm text-gray-400">Téléchargements: {product.download_count}</p>
              </div>
              <Button 
                className="w-full mt-4 bg-[#FF7101] hover:bg-[#FF7101]/90"
                onClick={() => window.location.href = `/checkout?product=${product.id}`}
              >
                Tester l'achat
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">Aucun produit approuvé trouvé</p>
        </div>
      )}
    </div>
  );
}
