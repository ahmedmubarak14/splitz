import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { EnhancedEmptyState } from "@/components/EnhancedEmptyState";

interface TripItineraryProps {
  tripId: string;
  startDate: string;
  endDate: string;
}

export function TripItinerary({ tripId, startDate, endDate }: TripItineraryProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    activityType: "activity",
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["itinerary", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedDate) throw new Error("Missing data");

      const { error } = await supabase.from("itinerary_items").insert({
        trip_id: tripId,
        day_date: format(selectedDate, "yyyy-MM-dd"),
        title: formData.title,
        description: formData.description || null,
        location: formData.location || null,
        start_time: formData.startTime || null,
        end_time: formData.endTime || null,
        activity_type: formData.activityType,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        activityType: "activity",
      });
      setSelectedDate(undefined);
      toast.success(t("trips.itinerary.itemAdded"));
    },
    onError: () => {
      toast.error(t("errors.somethingWentWrong"));
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("itinerary_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
      toast.success(t("trips.itinerary.itemDeleted"));
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">{t("common.loading")}</div>;
  }

  const groupedItems = items?.reduce((acc, item) => {
    const date = item.day_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("trips.itinerary.addActivity")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("trips.itinerary.addActivity")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("trips.itinerary.date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : t("trips.itinerary.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < parseISO(startDate) || date > parseISO(endDate)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>{t("trips.itinerary.activityTitle")}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("trips.itinerary.titlePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("trips.itinerary.startTime")}</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("trips.itinerary.endTime")}</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>{t("trips.itinerary.location")}</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t("trips.itinerary.locationPlaceholder")}
              />
            </div>

            <div>
              <Label>{t("trips.itinerary.description")}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("trips.itinerary.descriptionPlaceholder")}
              />
            </div>

            <Button
              onClick={() => addItemMutation.mutate()}
              disabled={!formData.title || !selectedDate || addItemMutation.isPending}
              className="w-full"
            >
              {t("common.add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!items || items.length === 0 ? (
        <EnhancedEmptyState
          icon={CalendarIcon}
          title={t("trips.itinerary.emptyTitle")}
          description={t("trips.itinerary.emptyDescription")}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems || {}).map(([date, dayItems]) => (
            <Card key={date} className="p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{format(parseISO(date), "EEEE, MMMM d")}</h3>
              </div>
              <div className="space-y-3">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{item.title}</h4>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {item.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {item.start_time}
                                {item.end_time && ` - ${item.end_time}`}
                              </span>
                            </div>
                          )}
                          {item.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{item.location}</span>
                            </div>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
