import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Trophy,
  Flame,
  MessageCircle,
  Users,
  Target,
  Calendar,
  Send,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { FriendSelector } from "./FriendSelector";

interface SharedHabitDetailsDialogProps {
  habitId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface Participant {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  username: string;
  streak_count: number;
  best_streak: number;
  last_completed_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  comment: string;
  created_at: string;
}

export function SharedHabitDetailsDialog({
  habitId,
  open,
  onOpenChange,
  onUpdate,
}: SharedHabitDetailsDialogProps) {
  const [habit, setHabit] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, habitId]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchHabit(),
        fetchParticipants(),
        fetchComments(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabit = async () => {
    const { data, error } = await (supabase as any)
      .from("shared_habits")
      .select("*")
      .eq("id", habitId)
      .single();

    if (error) throw error;
    setHabit(data);
  };

  const fetchParticipants = async () => {
    const { data, error } = await (supabase as any)
      .from("shared_habit_participants")
      .select(`
        *,
        profiles(id, full_name, avatar_url, username)
      `)
      .eq("habit_id", habitId)
      .order("streak_count", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.profiles.full_name || "Unknown",
      avatar_url: p.profiles.avatar_url || "",
      username: p.profiles.username || "",
      streak_count: p.streak_count || 0,
      best_streak: p.best_streak || 0,
      last_completed_at: p.last_completed_at,
    }));

    setParticipants(formatted);
  };

  const fetchComments = async () => {
    const { data, error } = await (supabase as any)
      .from("shared_habit_comments")
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq("habit_id", habitId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      user_id: c.user_id,
      full_name: c.profiles.full_name || "Unknown",
      avatar_url: c.profiles.avatar_url || "",
      comment: c.comment,
      created_at: c.created_at,
    }));

    setComments(formatted);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from("shared_habit_comments")
        .insert({
          habit_id: habitId,
          user_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleInviteFriends = async () => {
    if (selectedFriends.length === 0) return;

    try {
      for (const friendId of selectedFriends) {
        const { error } = await (supabase as any)
          .from("shared_habit_participants")
          .insert({
            habit_id: habitId,
            user_id: friendId,
          });

        if (error && !error.message.includes("duplicate")) {
          throw error;
        }
      }

      setSelectedFriends([]);
      fetchParticipants();
      toast.success("Friends invited!");
    } catch (error) {
      console.error("Error inviting friends:", error);
      toast.error("Failed to invite friends");
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

  if (loading || !habit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const topPerformer = participants[0];
  const avgStreak =
    participants.length > 0
      ? Math.round(
          participants.reduce((sum, p) => sum + p.streak_count, 0) /
            participants.length
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{habit.icon}</div>
            <div>
              <DialogTitle className="text-2xl">{habit.name}</DialogTitle>
              {habit.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {habit.description}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y">
          <div className="text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{participants.length}</div>
            <div className="text-xs text-muted-foreground">Participants</div>
          </div>
          <div className="text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{avgStreak}</div>
            <div className="text-xs text-muted-foreground">Avg Streak</div>
          </div>
          <div className="text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{habit.target_days}</div>
            <div className="text-xs text-muted-foreground">Day Goal</div>
          </div>
        </div>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-1" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageCircle className="h-4 w-4 mr-1" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="invite">
              <Users className="h-4 w-4 mr-1" />
              Invite
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="text-2xl font-bold text-muted-foreground w-8 text-center">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.avatar_url} />
                      <AvatarFallback>
                        {getInitials(participant.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{participant.full_name}</div>
                      {participant.username && (
                        <div className="text-xs text-muted-foreground">
                          @{participant.username}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-orange-500 font-bold">
                        <Flame className="h-4 w-4" />
                        {participant.streak_count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Best: {participant.best_streak}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Share encouragement or tips..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No comments yet. Be the first!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 p-3 rounded-lg border bg-card"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.avatar_url} />
                          <AvatarFallback>
                            {getInitials(comment.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(comment.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="invite" className="mt-4">
            <div className="space-y-4">
              <FriendSelector
                selectedFriends={selectedFriends}
                onSelectionChange={setSelectedFriends}
                multiSelect={true}
              />
              <Button
                onClick={handleInviteFriends}
                disabled={selectedFriends.length === 0}
                className="w-full"
              >
                Invite {selectedFriends.length} Friend
                {selectedFriends.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
