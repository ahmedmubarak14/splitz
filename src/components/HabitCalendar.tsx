import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface HabitCalendarProps {
  habitId: string;
  habitName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HabitCalendar = ({ habitId, habitName, open, onOpenChange }: HabitCalendarProps) => {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [checkInDates, setCheckInDates] = useState<Date[]>([]);
  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    total: 0,
    completionRate: 0
  });

  useEffect(() => {
    if (open) {
      fetchCheckIns();
    }
  }, [open, habitId, selectedMonth]);

  const fetchCheckIns = async () => {
    try {
      const { data, error } = await supabase
        .from('habit_check_ins')
        .select('checked_in_at')
        .eq('habit_id', habitId)
        .order('checked_in_at', { ascending: false });

      if (error) throw error;

      const dates = (data || []).map(item => new Date(item.checked_in_at));
      setCheckInDates(dates);

      // Calculate stats
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthCount = dates.filter(d => d >= thisMonthStart).length;
      const lastMonthCount = dates.filter(d => d >= lastMonthStart && d <= lastMonthEnd).length;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      setStats({
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        total: dates.length,
        completionRate: Math.round((thisMonthCount / daysInMonth) * 100)
      });
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      toast.error(t('habits.calendar.loadFailed'));
    }
  };

  const isCheckedIn = (date: Date) => {
    return checkInDates.some(checkDate => 
      checkDate.getDate() === date.getDate() &&
      checkDate.getMonth() === date.getMonth() &&
      checkDate.getFullYear() === date.getFullYear()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-secondary flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{habitName}</DialogTitle>
              <p className="text-sm text-muted-foreground">Check-in calendar and statistics</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">This Month</div>
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Last Month</div>
                <div className="text-2xl font-bold">{stats.lastMonth}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Completion</div>
                <div className="text-2xl font-bold text-primary">{stats.completionRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Check-in History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                modifiers={{
                  checkedIn: checkInDates,
                }}
                modifiersStyles={{
                  checkedIn: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    fontWeight: 'bold',
                    borderRadius: '0.5rem'
                  }
                }}
                className="pointer-events-auto"
              />
            </CardContent>
          </Card>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HabitCalendar;
