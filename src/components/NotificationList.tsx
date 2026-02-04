import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';
import { formatRelativeTime } from '@/lib/formatters';

const translateNotificationTitle = (title: string, type: string, t: any): string => {
  // Try exact title match first (for titles like "Added to Subscription")
  const exactKey = `notificationTitles.${title}`;
  const exactTranslated = t(exactKey, { defaultValue: '' });
  if (exactTranslated && exactTranslated !== exactKey && exactTranslated !== '') {
    return exactTranslated;
  }
  
  // Try type-based translation (for types like "subscription", "habit")
  const typeKey = `notificationTitles.${type}`;
  const typeTranslated = t(typeKey, { defaultValue: '' });
  if (typeTranslated && typeTranslated !== typeKey && typeTranslated !== '') {
    return typeTranslated;
  }
  
  // Return original title if no translation found
  return title;
};

const parseNotificationMessage = (message: string, type: string, t: any): string => {
  // Helper: match both straight and curly quotes
  const quotePattern = '[""]';
  
  // "You were added to "X" - Your share: Y"
  const addedToSubMatch = message.match(new RegExp(`You were added to ${quotePattern}([^""]+)${quotePattern} - Your share: (.+)`));
  if (addedToSubMatch) {
    return t('notificationMessages.addedToSubscription', {
      name: addedToSubMatch[1].trim(),
      amount: addedToSubMatch[2].trim()
    });
  }
  
  // "X sent you a friend request"
  const friendRequestMatch = message.match(/(.+) sent you a friend request/);
  if (friendRequestMatch) {
    return t('notificationMessages.friendRequest', {
      name: friendRequestMatch[1].trim()
    });
  }
  
  // "Payment approved for "X""
  const paymentApprovedMatch = message.match(new RegExp(`Payment approved for ${quotePattern}([^""]+)${quotePattern}`));
  if (paymentApprovedMatch) {
    return t('notificationMessages.paymentStatus', {
      name: paymentApprovedMatch[1].trim()
    });
  }
  
  // "X submitted payment for "Y""
  const paymentSubmittedMatch = message.match(new RegExp(`(.+) submitted payment for ${quotePattern}([^""]+)${quotePattern}`));
  if (paymentSubmittedMatch) {
    return t('notificationMessages.paymentSubmitted', {
      name: paymentSubmittedMatch[1].trim(),
      subscription: paymentSubmittedMatch[2].trim()
    });
  }
  
  // "Payment needs review for "X""
  const paymentReviewMatch = message.match(new RegExp(`Payment needs review for ${quotePattern}([^""]+)${quotePattern}`));
  if (paymentReviewMatch) {
    return t('notificationMessages.paymentReview', {
      name: paymentReviewMatch[1].trim()
    });
  }
  
  // "Your streak was saved! You have X freezes remaining."
  const streakFreezeMatch = message.match(/Your streak was saved! You have (\d+) freezes? remaining\./);
  if (streakFreezeMatch) {
    return t('notificationMessages.streakFreeze', {
      count: streakFreezeMatch[1].trim()
    });
  }

  // "🎉 Freeze Earned!" pattern
  const freezeEarnedMatch = message.match(/You earned a Streak Freeze for reaching (\d+) days!/);
  if (freezeEarnedMatch) {
    return t('notificationMessages.freezeEarned', {
      count: freezeEarnedMatch[1].trim(),
      defaultValue: message
    });
  }

  // "X added you to "Y"" for trips
  const addedToTripMatch = message.match(new RegExp(`(.+) added you to ${quotePattern}([^""]+)${quotePattern}`));
  if (addedToTripMatch) {
    return t('notificationMessages.addedToTrip', {
      name: addedToTripMatch[1].trim(),
      trip: addedToTripMatch[2].trim(),
      defaultValue: message
    });
  }

  // "X assigned you "Y" in Z" for trip tasks
  const taskAssignedMatch = message.match(new RegExp(`(.+) assigned you ${quotePattern}([^""]+)${quotePattern} in (.+)`));
  if (taskAssignedMatch) {
    return t('notificationMessages.taskAssigned', {
      name: taskAssignedMatch[1].trim(),
      task: taskAssignedMatch[2].trim(),
      trip: taskAssignedMatch[3].trim(),
      defaultValue: message
    });
  }

  // "X joined "Y"" for challenges
  const joinedChallengeMatch = message.match(new RegExp(`(.+) joined ${quotePattern}([^""]+)${quotePattern}`));
  if (joinedChallengeMatch) {
    return t('notificationMessages.joinedChallenge', {
      name: joinedChallengeMatch[1].trim(),
      challenge: joinedChallengeMatch[2].trim(),
      defaultValue: message
    });
  }

  // "X added "Y" (SAR Z) in W" for expenses
  const newExpenseMatch = message.match(new RegExp(`(.+) added ${quotePattern}([^""]+)${quotePattern} \\((.+?)\\) in (.+)`));
  if (newExpenseMatch) {
    return t('notificationMessages.newExpense', {
      name: newExpenseMatch[1].trim(),
      expense: newExpenseMatch[2].trim(),
      amount: newExpenseMatch[3].trim(),
      group: newExpenseMatch[4].trim(),
      defaultValue: message
    });
  }

  // "X renews in Y days (Z)" for subscription reminders
  const renewsMatch = message.match(/(.+) renews in (\d+) days? \((.+)\)/);
  if (renewsMatch) {
    return t('notificationMessages.subscriptionRenews', {
      name: renewsMatch[1].trim(),
      days: renewsMatch[2].trim(),
      amount: renewsMatch[3].trim(),
      defaultValue: message
    });
  }

  // "X price changed from Y to Z" for price changes
  const priceChangeMatch = message.match(/(.+) price changed from (.+) to (.+)/);
  if (priceChangeMatch) {
    return t('notificationMessages.priceChange', {
      name: priceChangeMatch[1].trim(),
      oldPrice: priceChangeMatch[2].trim(),
      newPrice: priceChangeMatch[3].trim(),
      defaultValue: message
    });
  }

  // "You reached level X! Keep going!" for level up
  const levelUpMatch = message.match(/You reached level (\d+)!/);
  if (levelUpMatch) {
    return t('notificationMessages.levelUp', {
      level: levelUpMatch[1].trim(),
      defaultValue: message
    });
  }

  // "Someone reached X% in "Y"" for challenge milestones
  const challengeMilestoneMatch = message.match(new RegExp(`Someone reached (\\d+)% in ${quotePattern}([^""]+)${quotePattern}`));
  if (challengeMilestoneMatch) {
    return t('notificationMessages.challengeMilestone', {
      progress: challengeMilestoneMatch[1].trim(),
      challenge: challengeMilestoneMatch[2].trim(),
      defaultValue: message
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
  const { t, i18n } = useTranslation();
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
                  {formatRelativeTime(new Date(notification.created_at), i18n.language)}
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
