import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/lib/rtl-utils";
import { formatDate } from "@/lib/formatters";
import { TripTemplateSelector } from "./TripTemplateSelector";

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTripDialog = ({ open, onOpenChange }: CreateTripDialogProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    description: "",
    start_date: new Date(),
    end_date: new Date(),
  });

  const { data: template } = useQuery({
    queryKey: ["trip-template", selectedTemplate],
    queryFn: async () => {
      if (!selectedTemplate) return null;
      const { data, error } = await supabase
        .from("trip_templates")
        .select("*")
        .eq("id", selectedTemplate)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTemplate,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    const { data: trip, error } = await supabase
      .from("trips")
      .insert([{
        name: formData.name,
        destination: formData.destination,
        description: formData.description,
        start_date: format(formData.start_date, "yyyy-MM-dd"),
        end_date: format(formData.end_date, "yyyy-MM-dd"),
        created_by: user.id,
      }])
      .select()
      .single();

    if (error) {
      toast.error(t('errors.genericError'));
      return;
    }

    // Apply template if selected
    if (template && trip) {
      // Add packing items
      const packingItems = template.default_packing_items as any[];
      if (packingItems?.length > 0) {
        await supabase.from("packing_lists").insert(
          packingItems.map((item: any) => ({
            trip_id: trip.id,
            item_name: item.name,
            category: item.category,
            added_by: user.id,
          }))
        );
      }

      // Add tasks
      const tasks = template.default_tasks as any[];
      if (tasks?.length > 0) {
        await supabase.from("trip_tasks").insert(
          tasks.map((task: any) => ({
            trip_id: trip.id,
            title: task.title,
            priority: task.priority || "medium",
            status: "todo",
            created_by: user.id,
          }))
        );
      }
    }

    toast.success(t('toast.tripCreated'));
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    onOpenChange(false);
    setFormData({
      name: "",
      destination: "",
      description: "",
      start_date: new Date(),
      end_date: new Date(),
    });
    setSelectedTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('trips.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TripTemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />

          <div className="border-t pt-4">
            <div>
              <Label htmlFor="name">{t('trips.tripName')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('trips.tripNamePlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="destination">{t('trips.destination')}</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder={t('trips.destinationPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="description">{t('trips.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('trips.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('trips.startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {formatDate(formData.start_date, i18n.language)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>{t('trips.endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {formatDate(formData.end_date, i18n.language)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => date && setFormData({ ...formData, end_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">{t('trips.create')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};