import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Share2, Mail, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FriendSelector } from "@/components/FriendSelector";
import { UserSearchSelector } from "./UserSearchSelector";

interface InviteTripMemberDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteTripMemberDialog = ({ tripId, open, onOpenChange }: InviteTripMemberDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

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

  const sendEmailInviteMutation = useMutation({
    mutationFn: async (recipientEmail: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get trip details
      const { data: trip } = await supabase
        .from("trips")
        .select("name")
        .eq("id", tripId)
        .single();

      // Get sender name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Generate invite code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Save invitation
      await supabase
        .from("invitations")
        .insert({
          invite_code: code,
          invite_type: "trip",
          resource_id: tripId,
          created_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      const inviteUrl = `${window.location.origin}/join/${code}`;

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-trip-invite", {
        body: {
          recipientEmail,
          inviteLink: inviteUrl,
          tripName: trip?.name || "Trip",
          senderName: profile?.full_name || "Someone",
        },
      });

      if (error) {
        // Return details for fallback handling
        return { error, code, tripName: trip?.name || "Trip", recipientEmail };
      }

      return { code, tripName: trip?.name || "Trip", recipientEmail };
    },
    onSuccess: async (result) => {
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      
      // Always surface the link section
      if (result?.code) setInviteCode(result.code);
      
      if (result?.error) {
        const inviteUrl = `${window.location.origin}/join/${result.code}`;

        // Try to copy silently
        try { await navigator.clipboard.writeText(inviteUrl); } catch {}

        // Mailto fallback, mirroring subscriptions logic
        const subject = `You're invited to join ${result.tripName}!`;
        const body = `${t('trips.inviteText')}\n\n${inviteUrl}`;
        window.location.href = `mailto:${encodeURIComponent(result.recipientEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        toast.info(t('trips.inviteFallback'));
      } else {
        toast.success(t('trips.inviteSent'));
      }
    },
    onError: () => {
      toast.error(t('errors.sendFailed'));
    },
  });

  const addUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      for (const userId of userIds) {
        const { error } = await (supabase as any)
          .from("trip_members")
          .insert({
            trip_id: tripId,
            user_id: userId,
          });
        
        if (error && !error.message.includes("duplicate")) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      setSelectedFriends([]);
      setSelectedUserIds([]);
      queryClient.invalidateQueries({ queryKey: ["trip-members"] });
      toast.success(t("Member(s) added to trip"));
    },
    onError: () => {
      toast.error(t("Failed to add members"));
    },
  });

  const handleGenerateInvite = () => {
    createInviteMutation.mutate();
  };

  const handleSendEmail = () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    sendEmailInviteMutation.mutate(email);
  };

  const handleAddFriends = () => {
    if (selectedFriends.length === 0) {
      toast.error(t("Please select at least one friend"));
      return;
    }
    addUsersMutation.mutate(selectedFriends);
  };

  const handleAddUsers = () => {
    if (selectedUserIds.length === 0) {
      toast.error(t("Please select at least one user"));
      return;
    }
    addUsersMutation.mutate(selectedUserIds);
  };

  const inviteUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : "";

  const handleCopy = async () => {
    if (inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success(t('trips.linkCopied'));
      } catch (error) {
        console.error('Copy failed:', error);
        toast.error('Failed to copy link');
      }
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
        
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Users className="h-4 w-4 mr-2" />
              {t("Search Users")}
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="h-4 w-4 mr-2" />
              {t("Friends")}
            </TabsTrigger>
            <TabsTrigger value="invite">
              <Mail className="h-4 w-4 mr-2" />
              {t("Invite")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            <UserSearchSelector
              selectedUsers={selectedUserIds}
              onSelectionChange={setSelectedUserIds}
              multiSelect={true}
              showFriendsTab={false}
              placeholder={t("Search by @username")}
            />
            <Button
              onClick={handleAddUsers}
              disabled={selectedUserIds.length === 0 || addUsersMutation.isPending}
              className="w-full"
            >
              {addUsersMutation.isPending
                ? t("Adding...")
                : t(`Add ${selectedUserIds.length} User(s)`)}
            </Button>
          </TabsContent>

          <TabsContent value="friends" className="space-y-4 mt-4">
            <FriendSelector
              selectedFriends={selectedFriends}
              onSelectionChange={setSelectedFriends}
              multiSelect={true}
            />
            <Button
              onClick={handleAddFriends}
              disabled={selectedFriends.length === 0 || addUsersMutation.isPending}
              className="w-full"
            >
              {addUsersMutation.isPending
                ? t("Adding...")
                : t(`Add ${selectedFriends.length} Friend(s)`)}
            </Button>
          </TabsContent>

          <TabsContent value="invite" className="space-y-6 mt-4">
            {/* Email Invitation */}
            <div className="space-y-3">
              <Label htmlFor="email">{t('trips.inviteByEmail')}</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder={t('trips.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button 
                  onClick={handleSendEmail} 
                  disabled={sendEmailInviteMutation.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sendEmailInviteMutation.isPending ? t('common.sending') : t('trips.sendInvite')}
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('trips.orDivider')}
                </span>
              </div>
            </div>

            {/* Link Invitation */}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};