import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, Mail, Link2, UserPlus, Copy, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFriendAdded: () => void;
}

interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

export function AddFriendDialog({ open, onOpenChange, onFriendAdded }: AddFriendDialogProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Auto-search as user types with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.rpc("search_users_by_username", {
        search_term: searchTerm.toLowerCase(),
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error(t('toasts.friends.searchFailed'));
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if friendship already exists
      const { data: existing, error: checkError } = await supabase
        .from("friendships")
        .select("id, status, user_id, friend_id")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        if (existing.status === "accepted") {
          toast.error(t('toasts.friends.alreadyFriends'));
          return;
        }
        // Remove existing pending request (either direction) to allow resending
        const { error: deleteError } = await supabase
          .from("friendships")
          .delete()
          .eq("id", existing.id);
        if (deleteError) throw deleteError;
      }

      const { error } = await supabase.from("friendships").insert({
        user_id: user.id,
        friend_id: friendId,
        status: "pending",
      });

      if (error) throw error;

      toast.success(t('toasts.friends.requestSent'));
      setSearchTerm("");
      setSearchResults([]);
      onFriendAdded();
      await new Promise(resolve => setTimeout(resolve, 300));
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error(t('toasts.friends.requestFailed'));
    }
  };

  const generateInviteLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("friend_invites")
        .insert({
          sender_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/join-friend/${data.invite_code}`;
      setInviteLink(link);
      toast.success(t('toasts.friends.inviteGenerated'));
    } catch (error) {
      console.error("Error generating invite link:", error);
      toast.error(t('toasts.friends.generateFailed'));
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    toast.success(t('toasts.friends.linkCopied'));
    setTimeout(() => setLinkCopied(false), 2000);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('friends.addFriend')}</DialogTitle>
          <DialogDescription>
            {t('friends.connectByUsername')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="username" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="username">
              <Search className="h-4 w-4 mr-2" />
              {t('friends.username')}
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link2 className="h-4 w-4 mr-2" />
              {t('friends.inviteLink')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="username" className="space-y-4 mt-4">
            <div className="relative">
              <Input
                placeholder={t('friends.searchByUsername')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      {t('friends.add')}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !searching && (
              <div className="text-center py-8 text-muted-foreground">
                {t('friends.noUsersFound', { searchTerm })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t('friends.generateShareableLink')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('friends.anyoneCanSendRequest')}
              </p>
            </div>

            {!inviteLink ? (
              <Button onClick={generateInviteLink} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                {t('friends.generateInviteLink')}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly />
                  <Button onClick={copyInviteLink} variant="outline">
                    {linkCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('friends.linkExpiresInDays')}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
