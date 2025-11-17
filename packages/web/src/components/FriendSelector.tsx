import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface FriendSelectorProps {
  selectedFriends: string[];
  onSelectionChange: (friendIds: string[]) => void;
  multiSelect?: boolean;
}

export function FriendSelector({
  selectedFriends,
  onSelectionChange,
  multiSelect = true,
}: FriendSelectorProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get accepted friendships
      const { data: friendshipsData, error } = await (supabase as any)
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) throw error;

      // Get friend IDs
      const friendIds = new Set<string>();
      friendshipsData?.forEach((f: any) => {
        if (f.user_id === user.id) friendIds.add(f.friend_id);
        else friendIds.add(f.user_id);
      });

      if (friendIds.size === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", Array.from(friendIds));

      if (profilesError) throw profilesError;

      setFriends(profilesData || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFriend = (friendId: string) => {
    if (multiSelect) {
      if (selectedFriends.includes(friendId)) {
        onSelectionChange(selectedFriends.filter((id) => id !== friendId));
      } else {
        onSelectionChange([...selectedFriends, friendId]);
      }
    } else {
      onSelectionChange([friendId]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No friends yet. Add friends to invite them!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => toggleFriend(friend.id)}
            >
              <Checkbox
                checked={selectedFriends.includes(friend.id)}
                onCheckedChange={() => toggleFriend(friend.id)}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={friend.avatar_url} />
                <AvatarFallback>{getInitials(friend.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{friend.full_name}</div>
                {friend.username && (
                  <div className="text-sm text-muted-foreground">
                    @{friend.username}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {multiSelect && selectedFriends.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedFriends.length} friend{selectedFriends.length !== 1 ? "s" : ""}{" "}
          selected
        </div>
      )}
    </div>
  );
}
