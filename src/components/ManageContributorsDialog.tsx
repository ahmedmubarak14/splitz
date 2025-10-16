import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Bell, Check, X, Link2, Share2, AlertCircle } from "lucide-react";
import { SubscriptionSplitTypeSelector } from "./SubscriptionSplitTypeSelector";
import { InviteDialog } from "./InviteDialog";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SplitType, MemberSplit } from "./SubscriptionSplitTypeSelector";
import { withAuthRecovery } from "@/lib/auth-recovery";

interface ManageContributorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  subscriptionName: string;
  totalAmount: number;
}

const ManageContributorsDialog = ({
  open,
  onOpenChange,
  subscriptionId,
  subscriptionName,
  totalAmount,
}: ManageContributorsDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [stagedSplitType, setStagedSplitType] = useState<SplitType>("equal");
  const [stagedMemberSplits, setStagedMemberSplits] = useState<MemberSplit[]>([]);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => withAuthRecovery(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }, "Failed to get user"),
  });

  // Fetch subscription details
  const { data: subscription } = useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: () => withAuthRecovery(async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single();

      if (error) throw error;
      return data;
    }, "Failed to load subscription"),
  });

  const isOwner = currentUser?.id === subscription?.user_id;

  // Fetch contributors with profiles
  const { data: contributors = [], isLoading: isLoadingContributors } = useQuery({
    queryKey: ["subscription-contributors", subscriptionId],
    queryFn: () => withAuthRecovery(async () => {
      const { data: contribData, error: contribError } = await supabase
        .from("subscription_contributors")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: true });

      if (contribError) throw contribError;

      // Fetch profiles for all contributors
      const userIds = contribData.map((c) => c.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Merge contributor data with profile data
      return contribData.map((contrib) => {
        const profile = profilesData?.find((p) => p.id === contrib.user_id);
        return {
          ...contrib,
          profile: profile || { id: contrib.user_id, full_name: t("common.unknown"), email: "", avatar_url: null },
        };
      });
    }, "Failed to load contributors"),
  });

  // Initialize staged state when subscription or contributors load
  useEffect(() => {
    if (subscription && contributors.length > 0) {
      setStagedSplitType(subscription.split_type || "equal");
      setStagedMemberSplits(
        contributors.map((c) => ({
          user_id: c.user_id,
          name: c.profile?.full_name || t("common.unknown"),
          split_value: c.split_value,
          calculated_amount: c.contribution_amount,
        }))
      );
      setPendingChanges(false);
    }
  }, [subscription, contributors, t]);

  // Add contributor mutation
  const addContributor = useMutation({
    mutationFn: async (email: string) => {
      // Check if user exists
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profiles) {
        throw new Error("user-not-found");
      }

      // Check if already a contributor
      const { data: existing } = await supabase
        .from("subscription_contributors")
        .select("id")
        .eq("subscription_id", subscriptionId)
        .eq("user_id", profiles.id)
        .maybeSingle();

      if (existing) {
        throw new Error("already-contributor");
      }

      // Add contributor
      const { error: insertError } = await supabase
        .from("subscription_contributors")
        .insert({
          subscription_id: subscriptionId,
          user_id: profiles.id,
          contribution_amount: 0,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      setEmail("");
      toast.success(t("subscriptions.contributorAdded"));
    },
    onError: (error: any) => {
      if (error.message === "user-not-found") {
        toast.error(t("subscriptions.userNotFound"), {
          action: {
            label: t("subscriptions.sendInvite"),
            onClick: () => setInviteDialogOpen(true),
          },
        });
      } else if (error.message === "already-contributor") {
        toast.error(t("subscriptions.alreadyContributor"));
      } else {
        toast.error(t("subscriptions.failedToAddContributor"));
      }
    },
  });

  // Remove contributor mutation
  const removeContributor = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from("subscription_contributors")
        .delete()
        .eq("id", contributorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      toast.success(t("subscriptions.contributorRemoved"));
    },
    onError: () => {
      toast.error(t("subscriptions.failedToRemoveContributor"));
    },
  });

  // Save split changes mutation
  const updateSplitType = useMutation({
    mutationFn: async () => {
      // Update subscription split type
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({ split_type: stagedSplitType })
        .eq("id", subscriptionId);

      if (subError) throw subError;

      // Update individual contributor splits
      for (const member of stagedMemberSplits) {
        const { error: memberError } = await supabase
          .from("subscription_contributors")
          .update({
            split_value: member.split_value,
            contribution_amount: member.calculated_amount,
          })
          .eq("subscription_id", subscriptionId)
          .eq("user_id", member.user_id);

        if (memberError) throw memberError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["subscription", subscriptionId] });
      setPendingChanges(false);
      toast.success(t("subscriptions.changesSaved"));
    },
    onError: () => {
      toast.error(t("subscriptions.failedToUpdateSplit"));
    },
  });

  // Submit payment mutation (for contributors)
  const submitPayment = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from("subscription_contributors")
        .update({
          payment_submitted: true,
          submission_at: new Date().toISOString(),
        })
        .eq("id", contributorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      toast.success(t("subscriptions.paymentSubmitted"));
    },
  });

  // Approve payment mutation (for owner)
  const approvePayment = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from("subscription_contributors")
        .update({
          is_settled: true,
          approved_at: new Date().toISOString(),
        })
        .eq("id", contributorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      toast.success(t("subscriptions.paymentApproved"));
    },
  });

  // Reject payment mutation (for owner)
  const rejectPayment = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from("subscription_contributors")
        .update({
          payment_submitted: false,
          submission_at: null,
        })
        .eq("id", contributorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      toast.success(t("subscriptions.paymentRejected"));
    },
  });

  // Mark as paid mutation (for owner self-settlement)
  const markAsPaid = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from("subscription_contributors")
        .update({
          is_settled: true,
          payment_submitted: true,
          approved_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        })
        .eq("id", contributorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      toast.success(t("subscriptions.markedAsPaid"));
    },
  });

  // Send reminder mutation - creates in-app notification
  const sendReminder = useMutation({
    mutationFn: async (contributorId: string) => {
      const contributor = contributors?.find(c => c.id === contributorId);
      if (!contributor) throw new Error("Contributor not found");

      // Check if we need to reset the daily count
      const today = new Date().toISOString().split('T')[0];
      const resetDate = contributor.reminder_count_reset_date 
        ? new Date(contributor.reminder_count_reset_date).toISOString().split('T')[0]
        : null;
      
      let newCount = (contributor.daily_reminder_count || 0) + 1;
      
      // Reset count if it's a new day
      if (resetDate !== today) {
        newCount = 1;
      }
      
      // Check if limit exceeded
      if (newCount > 5 && resetDate === today) {
        throw new Error("Daily reminder limit reached (5 per day)");
      }

      console.log("Sending reminder to contributor:", contributorId, "Count:", newCount);

      // Create in-app notification
      const { error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: contributor.user_id,
        p_title: t("subscriptions.reminderTitle"),
        p_message: `${t("subscriptions.reminderMessage")} "${subscriptionName}" - ${subscription?.currency} ${contributor.contribution_amount}`,
        p_type: 'subscription',
        p_resource_id: subscriptionId
      });

      if (notifError) {
        console.error("Error creating notification:", notifError);
        throw notifError;
      }

      console.log("Notification created successfully");

      // Update with new count and reset date
      const { error } = await supabase
        .from("subscription_contributors")
        .update({
          last_reminder_sent: new Date().toISOString(),
          daily_reminder_count: newCount,
          reminder_count_reset_date: today,
        })
        .eq("id", contributorId);

      if (error) {
        console.error("Error updating reminder data:", error);
        throw error;
      }

      console.log("Updated reminder data successfully");
      
      return { remainingToday: 5 - newCount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-contributors", subscriptionId] });
      toast.success(
        `${t("subscriptions.reminderSent")} (${data.remainingToday} ${t("subscriptions.remainingToday")})`
      );
    },
    onError: (error: any) => {
      console.error("Failed to send reminder:", error);
      if (error.message.includes("Daily reminder limit")) {
        toast.error(t("subscriptions.reminderLimitReached"));
      } else {
        toast.error(t("subscriptions.reminderFailed"));
      }
    },
  });

  const handleSplitsChange = (splits: MemberSplit[], splitType: SplitType) => {
    setStagedMemberSplits(splits);
    setStagedSplitType(splitType);
    setPendingChanges(true);
  };

  const handleSaveChanges = () => {
    updateSplitType.mutate();
  };

  const handleCancelChanges = () => {
    if (subscription && contributors.length > 0) {
      setStagedSplitType(subscription.split_type || "equal");
      setStagedMemberSplits(
        contributors.map((c) => ({
          user_id: c.user_id,
          name: c.profile?.full_name || t("common.unknown"),
          split_value: c.split_value,
          calculated_amount: c.contribution_amount,
        }))
      );
      setPendingChanges(false);
    }
  };

  const totalCovered = stagedMemberSplits.reduce((sum, m) => sum + (m.calculated_amount || 0), 0);
  const remaining = totalAmount - totalCovered;

  const getStatusBadge = (contributor: any) => {
    const isOwnContribution = contributor.user_id === currentUser?.id;

    if (contributor.is_settled) {
      return <Badge className="bg-green-500">{t("subscriptions.statusPaid")}</Badge>;
    }

    if (contributor.payment_submitted) {
      return <Badge variant="secondary">{t("subscriptions.statusAwaitingApproval")}</Badge>;
    }

    if (isOwnContribution && isOwner) {
      return <Badge variant="outline">{t("subscriptions.statusYourContribution")}</Badge>;
    }

    return <Badge variant="secondary">{t("subscriptions.statusPending")}</Badge>;
  };

  const renderActionButtons = (contributor: any) => {
    const isOwnContribution = contributor.user_id === currentUser?.id;

    // Owner's own contribution
    if (isOwnContribution && isOwner && !contributor.is_settled) {
      return (
        <Button
          size="sm"
          onClick={() => markAsPaid.mutate(contributor.id)}
          disabled={markAsPaid.isPending}
        >
          {markAsPaid.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Check className="h-4 w-4 mr-2" />
          {t("subscriptions.markAsPaid")}
        </Button>
      );
    }

    // Contributor's own contribution
    if (isOwnContribution && !isOwner && !contributor.is_settled && !contributor.payment_submitted) {
      return (
        <Button
          size="sm"
          onClick={() => submitPayment.mutate(contributor.id)}
          disabled={submitPayment.isPending}
        >
          {submitPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("subscriptions.settlePayment")}
        </Button>
      );
    }

    // Owner viewing other contributors
    if (isOwner && !isOwnContribution) {
      if (contributor.payment_submitted && !contributor.is_settled) {
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => approvePayment.mutate(contributor.id)}
              disabled={approvePayment.isPending}
            >
              {approvePayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              {t("subscriptions.approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => rejectPayment.mutate(contributor.id)}
              disabled={rejectPayment.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              {t("subscriptions.reject")}
            </Button>
          </div>
        );
      }

      if (!contributor.is_settled) {
        // Calculate daily reminder count
        const today = new Date().toISOString().split('T')[0];
        const resetDate = contributor.reminder_count_reset_date 
          ? new Date(contributor.reminder_count_reset_date).toISOString().split('T')[0]
          : null;
        
        // Reset count if new day
        const currentCount = resetDate === today ? (contributor.daily_reminder_count || 0) : 0;
        
        // Can send if under 5 reminders today
        const canSendReminder = currentCount < 5;
        const remainingReminders = 5 - currentCount;

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => markAsPaid.mutate(contributor.id)}
              disabled={markAsPaid.isPending}
            >
              {markAsPaid.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              {t("subscriptions.markAsPaid")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendReminder.mutate(contributor.id)}
              disabled={!canSendReminder || sendReminder.isPending}
              title={canSendReminder 
                ? `${remainingReminders} reminders remaining today` 
                : "Daily reminder limit reached (5/5)"}
            >
              {sendReminder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Bell className="h-4 w-4 mr-2" />
              {t("subscriptions.sendReminder")} ({currentCount}/5)
            </Button>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("subscriptions.manageContributors")} - {subscriptionName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {pendingChanges && (
              <Alert variant="default" className="bg-yellow-500/10 border-yellow-500">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-yellow-500">{t("subscriptions.unsavedChanges")}</AlertTitle>
                <AlertDescription className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleSaveChanges} disabled={updateSplitType.isPending}>
                    {updateSplitType.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("subscriptions.saveChanges")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelChanges}>
                    {t("subscriptions.discardChanges")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <SubscriptionSplitTypeSelector
                totalAmount={totalAmount}
                currency={subscription?.currency || "SAR"}
                members={contributors.map(c => ({
                  user_id: c.user_id,
                  full_name: c.profile?.full_name || t("common.unknown"),
                }))}
                onSplitsChange={handleSplitsChange}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("subscriptions.total")}:</span>
                <span className="font-semibold">{subscription?.currency} {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("subscriptions.covered")}:</span>
                <span className="font-semibold">{subscription?.currency} {totalCovered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("subscriptions.remaining")}:</span>
                <span className={`font-semibold ${Math.abs(remaining) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                  {subscription?.currency} {remaining.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("subscriptions.addByEmail")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("subscriptions.enterEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
                <Button
                  onClick={() => addContributor.mutate(email)}
                  disabled={!email || addContributor.isPending}
                >
                  {addContributor.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(true)}
                className="w-full"
              >
                {t("subscriptions.orSendInviteLink")}
              </Button>
            </div>

            <div className="space-y-3">
              <Label>{t("subscriptions.currentContributors")}</Label>
              {isLoadingContributors ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {contributors.map((contributor) => (
                    <div
                      key={contributor.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contributor.profile?.avatar_url || ""} />
                          <AvatarFallback>
                            {contributor.profile?.full_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {contributor.profile?.full_name || t("common.unknown")}
                            {contributor.user_id === currentUser?.id && (
                              <span className="text-muted-foreground ml-2">({t("common.you")})</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription?.currency} {contributor.contribution_amount?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                        {getStatusBadge(contributor)}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderActionButtons(contributor)}
                        {isOwner && contributor.user_id !== subscription?.user_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeContributor.mutate(contributor.id)}
                            disabled={removeContributor.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        resourceType="subscription"
        resourceId={subscriptionId}
        resourceName={subscriptionName}
      />
    </>
  );
};

export default ManageContributorsDialog;
