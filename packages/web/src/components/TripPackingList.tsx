import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { EnhancedEmptyState } from "@/components/EnhancedEmptyState";

interface TripPackingListProps {
  tripId: string;
}

const PACKING_CATEGORIES = ["Clothing", "Toiletries", "Electronics", "Documents", "Accessories", "Food", "Safety", "Entertainment", "Footwear"];

export function TripPackingList({ tripId }: TripPackingListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Clothing");

  const { data: items, isLoading } = useQuery({
    queryKey: ["packing-list", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packing_lists")
        .select("*")
        .eq("trip_id", tripId)
        .order("category", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("packing_lists").insert({
        trip_id: tripId,
        item_name: newItem,
        category: selectedCategory,
        added_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing-list", tripId] });
      setNewItem("");
      toast.success(t("trips.packing.itemAdded"));
    },
    onError: () => {
      toast.error(t("errors.somethingWentWrong"));
    },
  });

  const togglePackedMutation = useMutation({
    mutationFn: async ({ id, isPacked }: { id: string; isPacked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("packing_lists")
        .update({
          is_packed: !isPacked,
          packed_by: !isPacked ? user?.id : null,
          packed_at: !isPacked ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing-list", tripId] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("packing_lists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing-list", tripId] });
      toast.success(t("trips.packing.itemDeleted"));
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">{t("common.loading")}</div>;
  }

  const groupedItems = items?.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const packedCount = items?.filter(i => i.is_packed).length || 0;
  const totalCount = items?.length || 0;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      {totalCount > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("trips.packing.progress")}</span>
            <span className="text-sm text-muted-foreground">
              {packedCount}/{totalCount} {t("trips.packing.packed")}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>
      )}

      {/* Add Item */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder={t("trips.packing.addItem")}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newItem.trim()) {
                addItemMutation.mutate();
              }
            }}
            className="flex-1"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-md border bg-background"
          >
            {PACKING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Button
            onClick={() => addItemMutation.mutate()}
            disabled={!newItem.trim() || addItemMutation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Items List */}
      {!items || items.length === 0 ? (
        <EnhancedEmptyState
          icon={Package}
          title={t("trips.packing.emptyTitle")}
          description={t("trips.packing.emptyDescription")}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems || {}).map(([category, categoryItems]) => (
            <Card key={category} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {categoryItems.filter(i => i.is_packed).length}/{categoryItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.is_packed}
                      onCheckedChange={() =>
                        togglePackedMutation.mutate({
                          id: item.id,
                          isPacked: item.is_packed,
                        })
                      }
                    />
                    <span
                      className={`flex-1 ${
                        item.is_packed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {item.item_name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
