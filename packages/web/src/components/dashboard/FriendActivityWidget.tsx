import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardWidgetCard } from "./DashboardWidgetCard";
import { Users, Trophy, Target, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface FriendActivity {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

export function FriendActivityWidget() {
  const { t } = useTranslation();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: friendActivities, isLoading } = useQuery({
    queryKey: ["friend-activities", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      // Get friend IDs
      const { data: friendships } = await supabase
        .from("friendships")
        .select("friend_id, user_id")
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)
        .eq("status", "accepted");

      const friendIds = friendships?.map((f) =>
        f.user_id === currentUser.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) return [];

      // Get recent activities from friends
      const { data: activities } = await supabase
        .from("user_activity")
        .select(`
          id,
          user_id,
          activity_type,
          activity_data,
          created_at
        `)
        .in("user_id", friendIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!activities) return [];

      // Get user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", friendIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return activities.map((activity) => ({
        ...activity,
        full_name: profileMap.get(activity.user_id)?.full_name || "",
        avatar_url: profileMap.get(activity.user_id)?.avatar_url || null,
      })) as FriendActivity[];
    },
    enabled: !!currentUser,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "achievement_unlocked":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "challenge_completed":
        return <Target className="h-4 w-4 text-green-500" />;
      case "habit_streak":
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return <Users className="h-4 w-4 text-primary" />;
    }
  };

  const getActivityDescription = (activity: FriendActivity) => {
    const { activity_type, activity_data } = activity;

    switch (activity_type) {
      case "achievement_unlocked":
        return `unlocked "${activity_data.achievement_name}"`;
      case "challenge_completed":
        return `completed "${activity_data.challenge_name}"`;
      case "habit_streak":
        return `reached ${activity_data.streak_count} day streak`;
      case "level_up":
        return `reached level ${activity_data.new_level}`;
      default:
        return "had some activity";
    }
  };

  if (isLoading) {
    return (
      <DashboardWidgetCard title={t("gamification.social.friendActivity")} icon={Users}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </DashboardWidgetCard>
    );
  }

  if (!friendActivities || friendActivities.length === 0) {
    return (
      <DashboardWidgetCard title={t("gamification.social.friendActivity")} icon={Users}>
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("gamification.social.noActivity")}</p>
        </div>
      </DashboardWidgetCard>
    );
  }

  return (
    <DashboardWidgetCard title={t("gamification.social.friendActivity")} icon={Users}>
      <div className="space-y-3">
        {friendActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src={activity.avatar_url || undefined} />
              <AvatarFallback>
                {activity.full_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {getActivityIcon(activity.activity_type)}
                <p className="text-sm">
                  <span className="font-medium">{activity.full_name}</span>{" "}
                  {getActivityDescription(activity)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashboardWidgetCard>
  );
}
