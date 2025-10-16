import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { formatDate } from "@/lib/formatters";

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "task" | "habit" | "subscription" | "focus" | "trip" | "challenge";
  color: string;
};

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  // Fetch all events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar-events", format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const allEvents: CalendarEvent[] = [];

      // Fetch tasks
      const { data: tasks } = await supabase
        .from("focus_tasks")
        .select("id, title, due_date")
        .gte("due_date", format(start, "yyyy-MM-dd"))
        .lte("due_date", format(end, "yyyy-MM-dd"));

      tasks?.forEach(task => {
        if (task.due_date) {
          allEvents.push({
            id: task.id,
            title: task.title,
            date: new Date(task.due_date),
            type: "task",
            color: "bg-blue-500"
          });
        }
      });

      // Fetch habits (check-ins)
      const { data: habits } = await supabase
        .from("habit_check_ins")
        .select("id, habit_id, checked_in_at, habits(name)")
        .gte("checked_in_at", start.toISOString())
        .lte("checked_in_at", end.toISOString());

      habits?.forEach(checkin => {
        allEvents.push({
          id: checkin.id,
          title: (checkin.habits as any)?.name || "Habit",
          date: new Date(checkin.checked_in_at),
          type: "habit",
          color: "bg-green-500"
        });
      });

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id, name, next_renewal_date")
        .gte("next_renewal_date", format(start, "yyyy-MM-dd"))
        .lte("next_renewal_date", format(end, "yyyy-MM-dd"))
        .eq("is_active", true);

      subscriptions?.forEach(sub => {
        allEvents.push({
          id: sub.id,
          title: sub.name,
          date: new Date(sub.next_renewal_date),
          type: "subscription",
          color: "bg-red-500"
        });
      });

      // Fetch focus sessions
      const { data: sessions } = await supabase
        .from("focus_sessions")
        .select("id, start_time")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

      sessions?.forEach(session => {
        allEvents.push({
          id: session.id,
          title: "Focus Session",
          date: new Date(session.start_time),
          type: "focus",
          color: "bg-purple-500"
        });
      });

      // Fetch trips
      const { data: trips } = await supabase
        .from("trips")
        .select("id, name, start_date, end_date")
        .or(`start_date.gte.${format(start, "yyyy-MM-dd")},end_date.lte.${format(end, "yyyy-MM-dd")}`);

      trips?.forEach(trip => {
        allEvents.push({
          id: trip.id,
          title: trip.name,
          date: new Date(trip.start_date),
          type: "trip",
          color: "bg-orange-500"
        });
      });

      // Fetch challenges
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, name, start_date, end_date")
        .or(`start_date.gte.${format(start, "yyyy-MM-dd")},end_date.lte.${format(end, "yyyy-MM-dd")}`);

      challenges?.forEach(challenge => {
        allEvents.push({
          id: challenge.id,
          title: challenge.name,
          date: new Date(challenge.start_date),
          type: "challenge",
          color: "bg-yellow-500"
        });
      });

      return allEvents;
    },
  });

  const eventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <>
      <SEO 
        title={`${t('calendar.title')} - Splitz`}
        description={t('calendar.subtitle')}
      />
      
      <div className={`min-h-screen bg-gradient-to-b from-muted/30 via-muted/10 to-background p-4 md:p-6 space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              {t('calendar.title')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {t('calendar.subtitle')}
            </p>
          </div>

          <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <Button variant="outline" size="icon" onClick={isRTL ? nextMonth : prevMonth}>
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <div className="text-lg font-semibold min-w-[140px] text-center">
              {formatDate(currentDate, i18n.language, { year: 'numeric', month: 'long' })}
            </div>
            <Button variant="outline" size="icon" onClick={isRTL ? prevMonth : nextMonth}>
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="month">{t('calendar.month')}</TabsTrigger>
            <TabsTrigger value="week">{t('calendar.week')}</TabsTrigger>
            <TabsTrigger value="day">{t('calendar.day')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Legend */}
        <Card className="p-4 md:p-5 shadow-sm border border-border/40 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-semibold mb-3 tracking-tight">{t('calendar.eventTypes')}</h3>
          <div className={`flex flex-wrap gap-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
              <span className="font-medium">{t('calendar.tasks')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
              <span className="font-medium">{t('calendar.habits')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <span className="font-medium">{t('calendar.subscriptions')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />
              <span className="font-medium">{t('calendar.focus')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
              <span className="font-medium">{t('calendar.trips')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
              <span className="font-medium">{t('calendar.challenges')}</span>
            </div>
          </div>
        </Card>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentDate}
              onMonthChange={setCurrentDate}
              className="w-full"
              modifiers={{
                hasEvents: (date) => eventsForDate(date).length > 0
              }}
              modifiersClassNames={{
                hasEvents: "font-bold"
              }}
            />
          </Card>

          {/* Selected Date Events */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              {selectedDate ? formatDate(selectedDate, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }) : t('calendar.selectDate')}
            </h3>
            <div className="space-y-2">
              {selectedDate && eventsForDate(selectedDate).length === 0 && (
                <p className="text-sm text-muted-foreground">{t('calendar.noEvents')}</p>
              )}
              {selectedDate && eventsForDate(selectedDate).map(event => (
                <div key={event.id} className={`flex items-center gap-2 p-2 rounded-lg bg-accent/10 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <div className={`w-3 h-3 rounded-full ${event.color}`} />
                  <span className="text-sm">{event.title}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}