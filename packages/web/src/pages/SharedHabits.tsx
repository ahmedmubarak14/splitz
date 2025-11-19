import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Users, Plus, Flame, Trophy, MessageCircle, Heart, CheckCircle } from "lucide-react";
import { CreateSharedHabitDialog } from "@/components/CreateSharedHabitDialog";
import { SharedHabitDetailsDialog } from "@/components/SharedHabitDetailsDialog";
import { SEO } from "@/components/SEO";
import { formatRelativeTime } from "@/lib/formatters";
import { useTranslation } from "react-i18next";

interface SharedHabit {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_by: string;
  visibility: string;
  category: string;
  target_days: number;
  participants_count: number;
  my_streak: number;
  checked_in_today: boolean;
}

interface ActivityItem {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string;
  habit_name: string;
  habit_icon: string;
  checked_in_at: string;
  reactions: Array<{ emoji: string; count: number }>;
}

export default function SharedHabits() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<SharedHabit[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      await Promise.all([fetchHabits(), fetchActivityFeed()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all shared habits user is part of
      const { data: habitsData, error } = await (supabase as any)
        .from("shared_habits")
        .select(`
          *,
          shared_habit_participants!inner(
            user_id,
            streak_count,
            last_completed_at
          )
        `)
        .eq("shared_habit_participants.user_id", user.id);

      if (error) throw error;

      // Get participant counts and check-in status for each habit
      const enrichedHabits = await Promise.all(
        (habitsData || []).map(async (habit: any) => {
          const { count } = await (supabase as any)
            .from("shared_habit_participants")
            .select("*", { count: "exact", head: true })
            .eq("habit_id", habit.id);

          const { data: todayCheckin } = await (supabase as any)
            .from("shared_habit_checkins")
            .select("id")
            .eq("habit_id", habit.id)
            .eq("user_id", user.id)
            .gte("checked_in_at", new Date().toISOString().split("T")[0])
            .maybeSingle();

          return {
            id: habit.id,
            name: habit.name,
            description: habit.description,
            icon: habit.icon,
            created_by: habit.created_by,
            visibility: habit.visibility,
            category: habit.category,
            target_days: habit.target_days,
            participants_count: count || 0,
            my_streak: habit.shared_habit_participants[0]?.streak_count || 0,
            checked_in_today: !!todayCheckin,
          };
        })
      );

      setHabits(enrichedHabits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      toast.error("Failed to load shared habits");
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent check-ins from habits user is part of
      const { data, error } = await (supabase as any)
        .from("shared_habit_checkins")
        .select(`
          id,
          user_id,
          checked_in_at,
          shared_habits!inner(
            id,
            name,
            icon,
            shared_habit_participants!inner(user_id)
          ),
          profiles(full_name, avatar_url)
        `)
        .eq("shared_habits.shared_habit_participants.user_id", user.id)
        .order("checked_in_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get reactions for each check-in
      const feed = await Promise.all(
        (data || []).map(async (item: any) => {
          const { data: reactions } = await (supabase as any)
            .from("shared_habit_reactions")
            .select("emoji")
            .eq("checkin_id", item.id);

          const reactionCounts = (reactions || []).reduce((acc: any, r: any) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
          }, {});

          return {
            id: item.id,
            user_id: item.user_id,
            user_name: item.profiles?.full_name || "Unknown",
            avatar_url: item.profiles?.avatar_url || "",
            habit_name: item.shared_habits.name,
            habit_icon: item.shared_habits.icon,
            checked_in_at: item.checked_in_at,
            reactions: Object.entries(reactionCounts).map(([emoji, count]) => ({
              emoji,
              count: count as number,
            })),
          };
        })
      );

      setActivityFeed(feed);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const handleCheckIn = async (habitId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from("shared_habit_checkins")
        .insert({
          habit_id: habitId,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success("🔥 Check-in complete!");
      fetchData();
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error("Failed to check in");
    }
  };

  const handleReaction = async (checkinId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already reacted
      const { data: existing } = await (supabase as any)
        .from("shared_habit_reactions")
        .select("id")
        .eq("checkin_id", checkinId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await (supabase as any)
          .from("shared_habit_reactions")
          .delete()
          .eq("id", existing.id);
      } else {
        // Add reaction
        await (supabase as any)
          .from("shared_habit_reactions")
          .insert({
            checkin_id: checkinId,
            user_id: user.id,
            emoji,
          });
      }

      fetchActivityFeed();
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <SEO 
        title="Shared Habits - Splitz"
        description="Build habits together with friends and stay accountable"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Shared Habits
              </h1>
              <p className="text-muted-foreground mt-1">
                Build better habits together with accountability partners
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Habit
            </Button>
          </div>

          <Tabs defaultValue="habits" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="habits">My Habits ({habits.length})</TabsTrigger>
              <TabsTrigger value="feed">Activity Feed</TabsTrigger>
            </TabsList>

            <TabsContent value="habits" className="space-y-4">
              {habits.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No shared habits yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a habit and invite friends to build together!
                  </p>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Habit
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {habits.map((habit) => (
                    <Card
                      key={habit.id}
                      className="p-6 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => setSelectedHabit(habit.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{habit.icon}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{habit.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {habit.participants_count} participants
                            </div>
                          </div>
                        </div>
                        {habit.checked_in_today ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Done today
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(habit.id);
                            }}
                          >
                            Check In
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">
                              {habit.my_streak} day streak
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Goal: {habit.target_days} days
                          </div>
                        </div>
                        <Progress
                          value={(habit.my_streak / habit.target_days) * 100}
                          className="h-2"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="feed" className="space-y-4">
              {activityFeed.length === 0 ? (
                <Card className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Check-ins from you and your friends will appear here
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activityFeed.map((activity) => (
                    <Card key={activity.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={activity.avatar_url} />
                          <AvatarFallback>
                            {getInitials(activity.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{activity.user_name}</span>
                            <span className="text-muted-foreground">{t('sharedHabits.completed')}</span>
                            <span className="flex items-center gap-1">
                              <span className="text-lg">{activity.habit_icon}</span>
                              <span className="font-medium">{activity.habit_name}</span>
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            {formatRelativeTime(new Date(activity.checked_in_at), i18n.language)}
                          </div>
                          <div className="flex items-center gap-2">
                            {["🔥", "💪", "👏", "❤️", "🎉"].map((emoji) => {
                              const reaction = activity.reactions.find(
                                (r) => r.emoji === emoji
                              );
                              return (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleReaction(activity.id, emoji)}
                                >
                                  {emoji}
                                  {reaction && (
                                    <span className="ml-1 text-xs">
                                      {reaction.count}
                                    </span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Navigation />
      </div>

      <CreateSharedHabitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchData}
      />

      {selectedHabit && (
        <SharedHabitDetailsDialog
          habitId={selectedHabit}
          open={!!selectedHabit}
          onOpenChange={(open) => !open && setSelectedHabit(null)}
          onUpdate={fetchData}
        />
      )}
    </>
  );
}
