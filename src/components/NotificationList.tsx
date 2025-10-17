import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';

const translateNotificationTitle = (title: string, type: string, t: any): string => {
  // Try exact title match first
  const titleKey = `notificationTitles.${title}`;
  const translated = t(titleKey);
  if (translated !== titleKey) {
    return translated;
  }
  
  // Fallback to type-based translation
  const typeKey = `notificationTitles.${type}`;
  const typeTranslated = t(typeKey);
  if (typeTranslated !== typeKey) {
    return typeTranslated;
  }
  
  // Return original if no translation found
  return title;
};

const parseNotificationMessage = (message: string, type: string, t: any): string => {
  // Helper: match both straight and curly quotes
  const quotePattern = '[""]';
  
  // "You were added to "X" - Your share: Y"
  const addedToSubMatch = message.match(new RegExp(`You were added to ${quotePattern}([^""]+)${quotePattern} - Your share: (.+)`));
  if (addedToSubMatch) {
    return t('notificationMessages.addedToSubscription', {
      name: addedToSubMatch[1],
      amount: addedToSubMatch[2]
    });
  }
  
  // "X sent you a friend request"
  const friendRequestMatch = message.match(/(.+) sent you a friend request/);
  if (friendRequestMatch) {
    return t('notificationMessages.friendRequest', {
      name: friendRequestMatch[1]
    });
  }
  
  // "Payment approved for "X""
  const paymentStatusMatch = message.match(new RegExp(`Payment approved for ${quotePattern}([^""]+)${quotePattern}`));
  if (paymentStatusMatch) {
    return t('notificationMessages.paymentStatus', {
      name: paymentStatusMatch[1]
    });
  }
  
  // "X submitted payment for "Y""
  const paymentSubmittedMatch = message.match(new RegExp(`(.+) submitted payment for ${quotePattern}([^""]+)${quotePattern}`));
  if (paymentSubmittedMatch) {
    return t('notificationMessages.paymentSubmitted', {
      name: paymentSubmittedMatch[1],
      subscription: paymentSubmittedMatch[2]
    });
  }
  
  // "Payment needs review for "X""
  const paymentReviewMatch = message.match(new RegExp(`Payment needs review for ${quotePattern}([^""]+)${quotePattern}`));
  if (paymentReviewMatch) {
    return t('notificationMessages.paymentReview', {
      name: paymentReviewMatch[1]
    });
  }
  
  // "Your streak was saved! You have X freezes remaining."
  const streakFreezeMatch = message.match(/Your streak was saved! You have (\d+) freezes? remaining\./);
  if (streakFreezeMatch) {
    return t('notificationMessages.streakFreeze', {
      count: streakFreezeMatch[1]
    });
  }
  
  // Fallback: return original message
  return message;
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  resource_id?: string;
}

interface NotificationListProps {
  onRead?: () => void;
}

export function NotificationList({ onRead }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      onRead?.();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      onRead?.();
      toast.success(t('notificationList.deleted'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('notificationList.deleteFailed'));
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    if (notification.resource_id) {
      switch (notification.type) {
        case 'habit':
          navigate('/habits');
          break;
        case 'challenge':
          navigate('/challenges');
          break;
        case 'expense':
          navigate('/expenses');
          break;
        case 'subscription':
          navigate('/subscriptions');
          break;
        case 'trip':
          navigate(`/trips/${notification.resource_id}`);
          break;
        case 'friendship':
          navigate('/friends');
          break;
      }
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground" dir={isRTL ? 'rtl' : 'ltr'}>{t('notificationList.loading')}</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('notificationList.noNotifications')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)] mt-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.is_read ? 'bg-background' : 'bg-accent/50'
            } hover:bg-accent/70 transition-colors cursor-pointer`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{translateNotificationTitle(notification.title, notification.type, t)}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {parseNotificationMessage(notification.message, notification.type, t)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="flex gap-1">
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
