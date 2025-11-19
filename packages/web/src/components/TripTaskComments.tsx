import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";

interface TripTaskCommentsProps {
  taskId: string;
}

export const TripTaskComments = ({ taskId }: TripTaskCommentsProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["trip-task-comments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.rpc(
        'get_public_profiles',
        { _user_ids: userIds }
      );

      return data.map(comment => ({
        ...comment,
        user: profiles?.find((p: any) => p.id === comment.user_id)
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("trip_task_comments")
        .insert({ task_id: taskId, user_id: user.id, comment: text });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-task-comments"] });
      setComment("");
      toast.success(t('trips.comments.commentAdded'));
    },
    onError: () => {
      toast.error(t('errors.createFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("trip_task_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-task-comments"] });
      toast.success(t('trips.comments.commentDeleted'));
    },
    onError: () => {
      toast.error(t('errors.deleteFailed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      createMutation.mutate(comment.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 text-sm font-medium ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
        <MessageSquare className="h-4 w-4" />
        <span>{t('trips.comments.title')}</span>
        {comments && comments.length > 0 && (
          <span className="text-muted-foreground">({comments.length})</span>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('common.loading')}</p>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <Card key={comment.id} className="p-3">
              <div className={`flex gap-3 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatar_url} />
                  <AvatarFallback>{comment.user?.full_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className={`flex items-center justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <span className="text-sm font-medium">{comment.user?.full_name}</span>
                    <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {comment.user_id === (supabase.auth.getUser().then(r => r.data.user?.id)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteMutation.mutate(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.comment}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('trips.comments.noComments')}
          </p>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('trips.comments.addComment')}
          rows={2}
          className="resize-none"
        />
        <div className={`flex justify-end ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <Button type="submit" size="sm" disabled={!comment.trim() || createMutation.isPending}>
            <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('trips.comments.post')}
          </Button>
        </div>
      </form>
    </div>
  );
};
