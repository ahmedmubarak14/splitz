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
import { toast } from "sonner";

interface CreateSharedHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const HABIT_ICONS = ["⭐", "🏃", "📚", "💪", "🧘", "💧", "🥗", "😴", "🎯", "✍️"];
const CATEGORIES = [
  { value: "health", label: "Health & Fitness" },
  { value: "productivity", label: "Productivity" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "learning", label: "Learning" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
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
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a habit name");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the habit
      const { data: habit, error: habitError } = await supabase
        .from("shared_habits")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          icon,
          category,
          visibility,
          target_days: parseInt(targetDays),
          created_by: user.id,
        })
        .select()
        .single();

      if (habitError) throw habitError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from("shared_habit_participants")
        .insert({
          habit_id: habit.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Shared Habit</DialogTitle>
          <DialogDescription>
            Start a new habit and invite friends to join you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Icon</Label>
            <div className="flex gap-2 mt-2">
              {HABIT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl p-2 rounded-lg border transition-all ${
                    icon === emoji
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Habit Name</Label>
            <Input
              placeholder="e.g., Daily Exercise"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="What does this habit involve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
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

            <div>
              <Label>Target Days</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (invite only)</SelectItem>
                <SelectItem value="friends_only">Friends Only</SelectItem>
                <SelectItem value="public">Public (anyone can join)</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              {creating ? "Creating..." : "Create Habit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
