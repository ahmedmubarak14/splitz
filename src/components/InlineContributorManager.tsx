import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Mail, UserPlus } from "lucide-react";
import { UserSearchSelector } from "./UserSearchSelector";
import { SubscriptionSplitTypeSelector } from "./SubscriptionSplitTypeSelector";
import type { SplitType, MemberSplit } from "./SubscriptionSplitTypeSelector";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";

interface InlineContributorManagerProps {
  totalAmount: number;
  currency: string;
  onContributorsChange: (data: {
    userIds: string[];
    emails: string[];
    splitType: SplitType;
    memberSplits: MemberSplit[];
  }) => void;
}

export function InlineContributorManager({
  totalAmount,
  currency,
  onContributorsChange,
}: InlineContributorManagerProps) {
  const { t, i18n } = useTranslation();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user-contributor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  // Get profiles for selected users
  const { data: selectedProfiles = [] } = useQuery({
    queryKey: ["selected-user-profiles", selectedUserIds],
    queryFn: async () => {
      if (selectedUserIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", selectedUserIds);
      
      if (error) throw error;
      return data;
    },
    enabled: selectedUserIds.length > 0,
  });

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return;
    }
    
    if (emails.includes(trimmedEmail)) return;
    
    setEmails([...emails, trimmedEmail]);
    setEmailInput("");
    updateContributors([...emails, trimmedEmail], selectedUserIds, splitType, memberSplits);
  };

  const handleRemoveEmail = (email: string) => {
    const newEmails = emails.filter((e) => e !== email);
    setEmails(newEmails);
    updateContributors(newEmails, selectedUserIds, splitType, memberSplits);
  };

  const handleUserSelectionChange = (userIds: string[]) => {
    setSelectedUserIds(userIds);
    updateContributors(emails, userIds, splitType, memberSplits);
  };

  const handleSplitsChange = (splits: MemberSplit[], newSplitType: SplitType) => {
    setMemberSplits(splits);
    setSplitType(newSplitType);
    updateContributors(emails, selectedUserIds, newSplitType, splits);
  };

  const updateContributors = (
    currentEmails: string[],
    currentUserIds: string[],
    currentSplitType: SplitType,
    currentSplits: MemberSplit[]
  ) => {
    onContributorsChange({
      userIds: currentUserIds,
      emails: currentEmails,
      splitType: currentSplitType,
      memberSplits: currentSplits,
    });
  };

  // Build members list for split selector (current user + selected users + emails)
  const allMembers = [
    ...(currentUser ? [{ user_id: currentUser.id, full_name: `${currentUser.full_name} (You)` }] : []),
    ...selectedProfiles.map(p => ({ user_id: p.id, full_name: p.full_name || "Unknown" })),
    ...emails.map((email, idx) => ({ user_id: `email_${idx}`, full_name: email })),
  ];

  const totalContributors = selectedUserIds.length + emails.length + 1; // +1 for owner

  return (
    <div className="space-y-6">
      {/* Add Contributors Section */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t("subscriptions.addContributors")}</h3>
        </div>

        {/* User Search */}
        <div className="space-y-2">
          <Label>{t("subscriptions.searchByUsername")}</Label>
          <UserSearchSelector
            selectedUsers={selectedUserIds}
            onSelectionChange={handleUserSelectionChange}
            multiSelect={true}
            excludeUserIds={currentUser ? [currentUser.id] : []}
            showFriendsTab={true}
            placeholder="Search @username"
          />
        </div>

        {/* Email Invite */}
        <div className="space-y-2">
          <Label>{t("subscriptions.inviteByEmail")}</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
            />
            <Button type="button" onClick={handleAddEmail} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              {t("common.add")}
            </Button>
          </div>
        </div>

        {/* Selected Contributors Summary */}
        {(selectedUserIds.length > 0 || emails.length > 0) && (
          <div className="space-y-2">
            <Label>{t("subscriptions.selectedContributors")} ({totalContributors})</Label>
            <div className="flex flex-wrap gap-2">
              {/* Current user badge */}
              <Badge variant="secondary" className="gap-1">
                👤 {currentUser?.full_name} (You)
              </Badge>
              
              {/* Selected users */}
              {selectedProfiles.map((user) => (
                <Badge key={user.id} variant="secondary" className="gap-1">
                  👤 {user.full_name}
                  <button
                    type="button"
                    onClick={() => handleUserSelectionChange(selectedUserIds.filter(id => id !== user.id))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {/* Email invites */}
              {emails.map((email) => (
                <Badge key={email} variant="outline" className="gap-1">
                  ✉️ {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Split Configuration */}
      {allMembers.length > 0 && (
        <Card className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">{t("subscriptions.splitConfiguration")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("subscriptions.totalAmount")}: <span className="font-semibold">{formatCurrency(totalAmount, currency, i18n.language)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {t("subscriptions.contributors")}: {totalContributors} {t("subscriptions.people")}
            </p>
          </div>

          <SubscriptionSplitTypeSelector
            totalAmount={totalAmount}
            currency={currency}
            members={allMembers}
            onSplitsChange={handleSplitsChange}
            initialSplitType={splitType}
          />
        </Card>
      )}
    </div>
  );
}
