import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardWidgetCard } from "./DashboardWidgetCard";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  rank: number;
  isCurrentUser: boolean;
}

export function LeaderboardWidget() {
  const { t } = useTranslation();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: globalLeaderboard, isLoading: isLoadingGlobal } = useQuery({
    queryKey: ["leaderboard", "global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, xp, level")
        .order("xp", { ascending: false })
        .limit(10);

      if (error) throw error;

      return data?.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.id === currentUser?.id,
      })) as LeaderboardEntry[];
    },
    enabled: !!currentUser,
  });

  const { data: friendsLeaderboard, isLoading: isLoadingFriends } = useQuery({
    queryKey: ["leaderboard", "friends", currentUser?.id],
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

      // Get friend profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, xp, level")
        .in("id", [...friendIds, currentUser.id])
        .order("xp", { ascending: false });

      if (error) throw error;

      return data?.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.id === currentUser.id,
      })) as LeaderboardEntry[];
    },
    enabled: !!currentUser,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm text-muted-foreground">#{rank}</span>;
    }
  };

  const LeaderboardContent = ({ data, isLoading }: { data?: LeaderboardEntry[]; isLoading: boolean }) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("gamification.leaderboard.noData")}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t("gamification.leaderboard.startCompeting")}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              entry.isCurrentUser
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-accent"
            }`}
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(entry.rank)}
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback>
                {entry.full_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  {entry.full_name || t("common.anonymousUser")}
                </p>
                {entry.isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    {t("gamification.leaderboard.you")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("gamification.level")} {entry.level}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary">{entry.xp}</p>
              <p className="text-xs text-muted-foreground">{t("gamification.xp")}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardWidgetCard
      title={t("gamification.leaderboard.title")}
      icon={Trophy}
    >
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">
            {t("gamification.leaderboard.globalRank")}
          </TabsTrigger>
          <TabsTrigger value="friends">
            {t("gamification.leaderboard.friendsRank")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="mt-4">
          <LeaderboardContent data={globalLeaderboard} isLoading={isLoadingGlobal} />
        </TabsContent>
        <TabsContent value="friends" className="mt-4">
          <LeaderboardContent data={friendsLeaderboard} isLoading={isLoadingFriends} />
        </TabsContent>
      </Tabs>
    </DashboardWidgetCard>
  );
}
