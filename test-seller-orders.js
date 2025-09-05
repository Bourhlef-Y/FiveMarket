// Script de test pour l'API des commandes vendeur
// Exécutez ce script dans la console du navigateur sur localhost:3000

async function testSellerOrders() {
  console.log('🧪 Test de l\'API des commandes vendeur...');
  
  try {
    // Tester l'API des commandes détaillées
    const response = await fetch('/api/seller/orders-detailed');
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      console.log('Nombre de commandes:', data.orders?.length || 0);
      
      if (data.orders && data.orders.length > 0) {
        console.log('Première commande:', data.orders[0]);
      }
    } else {
      const error = await response.text();
      console.log('❌ Erreur:', error);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testSellerOrders();
