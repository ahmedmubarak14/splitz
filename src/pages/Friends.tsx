import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, UserPlus, Search, Link2, Check, X, Clock } from "lucide-react";
import { AddFriendDialog } from "@/components/AddFriendDialog";
import { SEO } from "@/components/SEO";

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  status: string;
  created_at: string;
  accepted_at?: string;
}

export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingSent, setPendingSent] = useState<Friend[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAuth();
    fetchFriends();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch friendships where user is involved
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          accepted_at
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Get all unique user IDs
      const userIds = new Set<string>();
      friendshipsData?.forEach(f => {
        userIds.add(f.user_id);
        userIds.add(f.friend_id);
      });
      userIds.delete(user.id);

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", Array.from(userIds));

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Categorize friendships
      const accepted: Friend[] = [];
      const sentPending: Friend[] = [];
      const receivedPending: Friend[] = [];

      friendshipsData?.forEach(f => {
        const otherUserId = f.user_id === user.id ? f.friend_id : f.user_id;
        const profile = profilesMap.get(otherUserId);
        
        if (!profile) return;

        const friend: Friend = {
          id: f.id,
          username: profile.username || "",
          full_name: profile.full_name || "Unknown User",
          avatar_url: profile.avatar_url || "",
          status: f.status,
          created_at: f.created_at,
          accepted_at: f.accepted_at
        };

        if (f.status === "accepted") {
          accepted.push(friend);
        } else if (f.status === "pending") {
          if (f.user_id === user.id) {
            sentPending.push(friend);
          } else {
            receivedPending.push(friend);
          }
        }
      });

      setFriends(accepted);
      setPendingSent(sentPending);
      setPendingReceived(receivedPending);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", friendshipId);

      if (error) throw error;

      toast.success("Friend request accepted!");
      fetchFriends();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const declineFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast.success("Friend request declined");
      fetchFriends();
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast.success("Friend removed");
      fetchFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <SEO 
        title="Friends - Splitz"
        description="Manage your friends and connections"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Friends
              </h1>
              <p className="text-muted-foreground mt-1">
                Connect with friends and share experiences
              </p>
            </div>
            <Button onClick={() => setAddFriendOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Requests ({pendingReceived.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({pendingSent.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredFriends.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start adding friends to share habits and challenges!
                  </p>
                  <Button onClick={() => setAddFriendOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Friend
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredFriends.map((friend) => (
                    <Card key={friend.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friend.avatar_url} />
                            <AvatarFallback>{getInitials(friend.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{friend.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{friend.username}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFriend(friend.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingReceived.length === 0 ? (
                <Card className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    You don't have any friend requests at the moment
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingReceived.map((friend) => (
                    <Card key={friend.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friend.avatar_url} />
                            <AvatarFallback>{getInitials(friend.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{friend.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{friend.username}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptFriendRequest(friend.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineFriendRequest(friend.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {pendingSent.length === 0 ? (
                <Card className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    You haven't sent any friend requests
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingSent.map((friend) => (
                    <Card key={friend.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friend.avatar_url} />
                            <AvatarFallback>{getInitials(friend.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{friend.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{friend.username}
                            </div>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => declineFriendRequest(friend.id)}
                        >
                          Cancel
                        </Button>
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

      <AddFriendDialog
        open={addFriendOpen}
        onOpenChange={setAddFriendOpen}
        onFriendAdded={fetchFriends}
      />
    </>
  );
}
