"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';
import { 
  Bell, 
  CheckCircle, 
  Package, 
  ShoppingCart, 
  Clock,
  ArrowLeft,
  Trash2,
  Eye
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'order_received' | 'order_delivered' | 'order_cancelled';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  order_id?: string;
  product_title?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/notifications');
      return;
    }

    if (user) {
      loadNotifications();
    }
  }, [user, loading]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/notifications');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('Erreur chargement notifications:', response.status);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les notifications',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        variant: 'destructive'
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        toast({
          title: 'Succès',
          description: 'Toutes les notifications ont été marquées comme lues',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer toutes les notifications comme lues',
        variant: 'destructive'
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        toast({
          title: 'Succès',
          description: 'Notification supprimée',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la notification',
        variant: 'destructive'
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_received':
        return <ShoppingCart className="w-5 h-5 text-blue-400" />;
      case 'order_delivered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'order_cancelled':
        return <Package className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_received':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'order_delivered':
        return 'border-green-500/30 bg-green-500/10';
      case 'order_cancelled':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  if (loading || loadingNotifications) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7101]"></div>
          <p className="text-gray-400 text-sm">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
              <Bell className="w-8 h-8" />
              <span>Notifications</span>
            </h1>
            <p className="text-gray-400 mt-2">
              {unreadCount > 0 
                ? `${unreadCount} notification(s) non lue(s)`
                : 'Aucune notification non lue'
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-16 h-16 text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune notification</h3>
            <p className="text-gray-400 text-center">
              Vous n'avez pas encore de notifications. Elles apparaîtront ici quand vous recevrez des mises à jour sur vos commandes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`bg-zinc-800/50 border-zinc-700 transition-all duration-200 hover:bg-zinc-800/70 ${
                !notification.read ? 'ring-2 ring-[#FF7101]/50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${notification.read ? 'text-gray-400' : 'text-gray-300'}`}>
                          {notification.message}
                        </p>
                        {notification.product_title && (
                          <p className="text-xs text-gray-500 mt-2">
                            Produit: {notification.product_title}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-3">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <Badge variant="outline" className="border-[#FF7101] text-[#FF7101] text-xs">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="outline"
                            size="sm"
                            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-300 hover:bg-red-700/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
