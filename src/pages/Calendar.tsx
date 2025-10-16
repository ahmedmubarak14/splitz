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

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "task" | "habit" | "subscription" | "focus" | "trip" | "challenge";
  color: string;
};

export default function CalendarPage() {
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
        title="Calendar - Splitz"
        description="View all your tasks, habits, subscriptions, and events in one place"
      />
      
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              All your activities in one place
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Legend */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Habits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Subscriptions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Focus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Trips</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Challenges</span>
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
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
            </h3>
            <div className="space-y-2">
              {selectedDate && eventsForDate(selectedDate).length === 0 && (
                <p className="text-sm text-muted-foreground">No events on this day</p>
              )}
              {selectedDate && eventsForDate(selectedDate).map(event => (
                <div key={event.id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/10">
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