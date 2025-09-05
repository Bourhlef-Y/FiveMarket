// Script de test pour le système de notifications
// Exécutez ce script dans la console du navigateur sur localhost:3000

async function testNotificationSystem() {
  console.log('🧪 Test du système de notifications...');
  
  try {
    // 1. Tester la récupération des notifications
    console.log('1. Récupération des notifications...');
    const response = await fetch('/api/notifications');
    const data = await response.json();
    console.log('✅ Notifications récupérées:', data);
    
    // 2. Tester la création d'une notification
    console.log('2. Création d\'une notification de test...');
    const createResponse = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-id', // Remplacez par un ID d'utilisateur réel
        type: 'order_received',
        title: 'Test Notification',
        message: 'Ceci est une notification de test',
        product_title: 'Produit Test',
        order_id: 'test-order-id'
      })
    });
    
    if (createResponse.ok) {
      console.log('✅ Notification créée avec succès');
    } else {
      console.log('❌ Erreur création notification:', await createResponse.text());
    }
    
    // 3. Tester le marquage comme lu
    console.log('3. Test du marquage comme lu...');
    const notifications = data.notifications || [];
    if (notifications.length > 0) {
      const firstNotification = notifications[0];
      const readResponse = await fetch(`/api/notifications/${firstNotification.id}/read`, {
        method: 'PATCH'
      });
      
      if (readResponse.ok) {
        console.log('✅ Notification marquée comme lue');
      } else {
        console.log('❌ Erreur marquage comme lu:', await readResponse.text());
      }
    }
    
    console.log('🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testNotificationSystem();
