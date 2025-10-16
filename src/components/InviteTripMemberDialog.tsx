import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface InviteTripMemberDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteTripMemberDialog = ({ tripId, open, onOpenChange }: InviteTripMemberDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState("");

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          invite_code: code,
          invite_type: "trip",
          resource_id: tripId,
          created_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setInviteCode(data.invite_code);
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success(t('trips.inviteCreated'));
    },
    onError: () => {
      toast.error(t('errors.createFailed'));
    },
  });

  const handleGenerateInvite = () => {
    createInviteMutation.mutate();
  };

  const inviteUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : "";

  const handleCopy = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('trips.linkCopied'));
    }
  };

  const handleShare = async () => {
    if (inviteUrl && navigator.share) {
      try {
        await navigator.share({
          title: t('trips.inviteTitle'),
          text: t('trips.inviteText'),
          url: inviteUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('trips.inviteMember')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!inviteCode ? (
            <Button onClick={handleGenerateInvite} disabled={createInviteMutation.isPending} className="w-full">
              {createInviteMutation.isPending ? t('common.generating') : t('trips.generateInviteLink')}
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{t('trips.inviteLink')}</Label>
                <div className="flex gap-2">
                  <Input value={inviteUrl} readOnly />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {navigator.share && (
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('trips.inviteExpires')}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
