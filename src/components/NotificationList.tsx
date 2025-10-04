import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, DollarSign, Check, Trash2, Bell } from 'lucide-react';
import { formatDateTime } from '@/lib/timezone';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  onRead?: () => void;
}

const NotificationList = ({ onRead }: NotificationListProps) => {
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
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      onRead?.();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== id));
      onRead?.();
      toast.success(t('components.notificationList.deleted'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('components.notificationList.deleteFailed'));
    }
  };

  const handleClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    // Navigate to relevant page
    if (notification.resource_id) {
      if (notification.type === 'habit') {
        navigate('/habits');
      } else if (notification.type === 'challenge') {
        navigate('/challenges');
      } else if (notification.type === 'expense') {
        navigate('/expenses');
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'habit':
        return <Target className="w-5 h-5 text-primary" />;
      case 'challenge':
        return <Trophy className="w-5 h-5 text-accent" />;
      case 'expense':
        return <DollarSign className="w-5 h-5 text-secondary" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('components.notificationList.loading')}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{t('components.notificationList.empty')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border" dir={isRTL ? 'rtl' : 'ltr'}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 transition-colors ${
            notification.is_read ? 'bg-background' : 'bg-primary/5'
          }`}
        >
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-shrink-0 mt-1">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => handleClick(notification)}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <h4 className={`font-semibold text-sm mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {notification.title}
                </h4>
                <p className={`text-sm text-muted-foreground line-clamp-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {notification.message}
                </p>
                <p className={`text-xs text-muted-foreground mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {formatDateTime(notification.created_at)}
                </p>
              </button>
            </div>
            <div className={`flex-shrink-0 flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => markAsRead(notification.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteNotification(notification.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
