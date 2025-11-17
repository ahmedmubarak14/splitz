import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { CheckCircle2, UserPlus, MessageSquare, Receipt, ListTodo } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";

interface TripActivityFeedProps {
  tripId: string;
}

export const TripActivityFeed = ({ tripId }: TripActivityFeedProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["trip-activity", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_activity")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase.rpc(
        'get_public_profiles',
        { _user_ids: userIds }
      );

      return data.map(activity => ({
        ...activity,
        user: profiles?.find((p: any) => p.id === activity.user_id)
      }));
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <ListTodo className="h-4 w-4 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'member_joined':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'expense_added':
        return <Receipt className="h-4 w-4 text-orange-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-pink-500" />;
      default:
        return <ListTodo className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityMessage = (activity: any) => {
    const userName = activity.user?.full_name || t('trips.unknownUser');
    
    switch (activity.activity_type) {
      case 'task_created':
        return t('trips.activity.taskCreated', { 
          user: userName, 
          task: activity.activity_data?.task_title 
        });
      case 'task_completed':
        return t('trips.activity.taskCompleted', { 
          user: userName, 
          task: activity.activity_data?.task_title 
        });
      case 'member_joined':
        return t('trips.activity.memberJoined', { user: userName });
      case 'expense_added':
        return t('trips.activity.expenseAdded', { user: userName });
      case 'comment_added':
        return t('trips.activity.commentAdded', { user: userName });
      default:
        return t('trips.activity.genericActivity', { user: userName });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t('trips.activity.noActivity')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity: any) => (
        <Card key={activity.id} className="p-3">
          <div className={`flex gap-3 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user?.avatar_url} />
                <AvatarFallback>{activity.user?.full_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                {getActivityIcon(activity.activity_type)}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm">{getActivityMessage(activity)}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
