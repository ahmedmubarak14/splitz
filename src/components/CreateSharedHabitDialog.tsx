import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendSelector } from "./FriendSelector";
import { UserSearchSelector } from "./UserSearchSelector";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { toast } from "sonner";

interface CreateSharedHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CATEGORIES = [
  { value: "health", label: "Health & Fitness" },
  { value: "productivity", label: "Productivity" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "learning", label: "Learning" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

const TARGET_DAYS_PRESETS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "custom", label: "Custom" },
];

export function CreateSharedHabitDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSharedHabitDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [category, setCategory] = useState("other");
  const [visibility, setVisibility] = useState("friends_only");
  const [targetDays, setTargetDays] = useState("30");
  const [customDays, setCustomDays] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a habit name");
      return;
    }

    const finalTargetDays = targetDays === "custom" ? parseInt(customDays) : parseInt(targetDays);
    
    if (!finalTargetDays || finalTargetDays < 1 || finalTargetDays > 365) {
      toast.error("Please enter a valid number of days (1-365)");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's name for notifications
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Create the habit
      const { data: habit, error: habitError } = await (supabase as any)
        .from("shared_habits")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          icon,
          category,
          visibility,
          target_days: finalTargetDays,
          created_by: user.id,
        })
        .select()
        .single();

      if (habitError) throw habitError;

      // Add creator as participant
      const { error: participantError } = await (supabase as any)
        .from("shared_habit_participants")
        .insert({
          habit_id: habit.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      // Add selected friends as participants
      if (selectedFriends.length > 0) {
        const friendParticipants = selectedFriends.map(friendId => ({
          habit_id: habit.id,
          user_id: friendId,
        }));
        
        await (supabase as any)
          .from("shared_habit_participants")
          .insert(friendParticipants);
        
        // Send notifications to invited friends
        for (const friendId of selectedFriends) {
          await supabase.rpc('create_notification', {
            p_user_id: friendId,
            p_title: 'New Habit Invitation',
            p_message: `${profile?.full_name || 'Someone'} invited you to join "${habit.name}"`,
            p_type: 'habit',
            p_resource_id: habit.id,
          });
        }
      }

      toast.success("Shared habit created!");
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating habit:", error);
      toast.error("Failed to create habit");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("⭐");
    setCategory("other");
    setVisibility("friends_only");
    setTargetDays("30");
    setCustomDays("");
    setSelectedFriends([]);
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setIcon(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shared Habit</DialogTitle>
          <DialogDescription>
            Start a new habit and invite friends to join you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Emoji Selection */}
          <div>
            <Label>Choose Icon</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-6xl">{icon}</div>
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change Icon
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-none shadow-lg">
                  <EmojiPicker onEmojiClick={handleEmojiClick} width={350} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Habit Name */}
          <div>
            <Label htmlFor="habit-name">Habit Name *</Label>
            <Input
              id="habit-name"
              placeholder="e.g., Morning Meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What does this habit involve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
              className="mt-2"
            />
          </div>

          {/* Target Days */}
          <div>
            <Label htmlFor="target-days">Target Days</Label>
            <Select value={targetDays} onValueChange={setTargetDays}>
              <SelectTrigger id="target-days" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_DAYS_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetDays === "custom" && (
              <Input
                type="number"
                min="1"
                max="365"
                placeholder="Enter number of days"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger id="visibility" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (invite only)</SelectItem>
                <SelectItem value="friends_only">Friends Only</SelectItem>
                <SelectItem value="public">Public (anyone can join)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invite Participants */}
          <div>
            <Label>Invite Participants (optional)</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Search for users by @username or invite friends
            </p>
            <UserSearchSelector
              selectedUsers={selectedFriends}
              onSelectionChange={setSelectedFriends}
              multiSelect={true}
              showFriendsTab={true}
              placeholder="Search by @username"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="flex-1"
            >
              {creating ? "Creating..." : selectedFriends.length > 0 ? "Create & Invite" : "Create Habit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
