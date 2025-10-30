import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserSearchSelectorProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
  multiSelect?: boolean;
  excludeUserIds?: string[];
  showFriendsTab?: boolean;
  placeholder?: string;
}

export function UserSearchSelector({
  selectedUsers,
  onSelectionChange,
  multiSelect = true,
  excludeUserIds = [],
  showFriendsTab = true,
  placeholder = "Search by @username",
}: UserSearchSelectorProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search users by username
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["search-users", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      
      const { data, error } = await supabase.rpc("search_users_by_username", {
        search_term: debouncedSearch.startsWith("@") 
          ? debouncedSearch.slice(1) 
          : debouncedSearch,
      });

      if (error) throw error;
      
      // Filter out excluded users
      return (data as UserProfile[]).filter(
        (user) => !excludeUserIds.includes(user.id)
      );
    },
    enabled: debouncedSearch.length >= 2,
  });

  // Fetch friends
  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: ["friends-for-selector"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: friendships, error: friendshipsError } = await supabase
        .from("friendships")
        .select("friend_id, user_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendshipsError) throw friendshipsError;

      const friendIds = friendships.map((f) =>
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      if (friendIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", friendIds);

      if (profilesError) throw profilesError;

      // Filter out excluded users
      return (profiles as UserProfile[]).filter(
        (user) => !excludeUserIds.includes(user.id)
      );
    },
    enabled: showFriendsTab,
  });

  const toggleUser = (userId: string) => {
    if (multiSelect) {
      if (selectedUsers.includes(userId)) {
        onSelectionChange(selectedUsers.filter((id) => id !== userId));
      } else {
        onSelectionChange([...selectedUsers, userId]);
      }
    } else {
      onSelectionChange([userId]);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderUserList = (users: UserProfile[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!users || users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t("No users found")}</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => toggleUser(user.id)}
            >
              <Checkbox
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={() => toggleUser(user.id)}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.full_name || "Unknown"}</p>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Tabs defaultValue="search" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search">
          <Search className="h-4 w-4 mr-2" />
          {t("Search Username")}
        </TabsTrigger>
        {showFriendsTab && (
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            {t("Your Friends")}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="search" className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm.length >= 2 ? (
          renderUserList(searchResults, isSearching)
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("subscriptions.typeToSearch")}</p>
          </div>
        )}
      </TabsContent>

      {showFriendsTab && (
        <TabsContent value="friends" className="space-y-4">
          {renderUserList(friends, isLoadingFriends)}
        </TabsContent>
      )}

      {multiSelect && selectedUsers.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          {selectedUsers.length} {t("user(s) selected")}
        </div>
      )}
    </Tabs>
  );
}
