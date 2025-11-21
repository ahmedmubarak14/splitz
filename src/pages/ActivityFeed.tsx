import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { 
  CheckCircle, 
  Target, 
  DollarSign, 
  Clock,
  TrendingUp,
  Users,
  Flame
} from "lucide-react";
import { SEO } from "@/components/SEO";

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "habit_checkin": return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "challenge_joined": return <Target className="h-5 w-5 text-purple-500" />;
    case "expense_added": return <DollarSign className="h-5 w-5 text-blue-500" />;
    case "focus_completed": return <Clock className="h-5 w-5 text-orange-500" />;
    case "streak_milestone": return <Flame className="h-5 w-5 text-red-500" />;
    default: return <TrendingUp className="h-5 w-5 text-primary" />;
  }
};

const getActivityMessage = (activity: Activity, t: any) => {
  const { activity_type, activity_data } = activity;
  
  switch (activity_type) {
    case "habit_checkin":
      return `checked in to habit "${activity_data.habit_name}"`;
    case "challenge_joined":
      return `joined challenge "${activity_data.challenge_name}"`;
    case "expense_added":
      return `added expense "${activity_data.expense_name}"`;
    case "focus_completed":
      return `completed ${activity_data.duration} minute focus session`;
    case "streak_milestone":
      return `reached ${activity_data.streak} day streak! 🔥`;
    default:
      return "was active";
  }
};

export default function ActivityFeed() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's friends
      const { data: friendships } = await supabase
        .from("friendships")
        .select("friend_id, user_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      // Include user's own activities
      const userIds = [user.id, ...friendIds];

      // Get recent activities
      const { data: activityData, error } = await supabase
        .from("user_activity")
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get profiles for these users
      if (activityData && activityData.length > 0) {
        const activityUserIds = [...new Set(activityData.map(a => a.user_id))];
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", activityUserIds);

        // Map profiles to activities
        const activitiesWithProfiles = activityData.map(activity => ({
          ...activity,
          profiles: profileData?.find(p => p.id === activity.user_id)
        }));

        setActivities(activitiesWithProfiles as Activity[]);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={t('activityFeed.title')}
        description={t('activityFeed.subtitle')}
      />
      
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('activityFeed.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('activityFeed.subtitle')}
            </p>
          </div>
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>

        <Card>
          <ScrollArea className="h-[600px] p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('activityFeed.noActivityYet')}</h3>
                <p className="text-muted-foreground">
                  {t('activityFeed.noActivityDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={activity.profiles?.avatar_url} />
                      <AvatarFallback>
                        {activity.profiles?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getActivityIcon(activity.activity_type)}
                        <span className="font-semibold">
                          {activity.profiles?.full_name || "User"}
                        </span>
                        <span className="text-muted-foreground">
                          {getActivityMessage(activity, t)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { 
                            addSuffix: true 
                          })}
                        </span>
                        
                        {activity.activity_data?.is_milestone && (
                          <Badge variant="secondary" className="text-xs">
                            {t('activityFeed.milestone')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </>
  );
}
