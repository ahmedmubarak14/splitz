import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get users with habit reminders enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, reminder_time')
      .eq('habit_reminders', true);

    if (prefError) throw prefError;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (const pref of preferences || []) {
      const [hours, minutes] = pref.reminder_time.split(':').map(Number);
      
      // Check if current time matches reminder time (within 1 hour window)
      if (Math.abs(currentHour - hours) <= 1 && Math.abs(currentMinute - minutes) <= 30) {
        // Get user's incomplete habits for today
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('id, name')
          .eq('user_id', pref.user_id);

        if (habitsError) throw habitsError;

        // Check which habits haven't been checked in today
        const today = now.toISOString().split('T')[0];
        const { data: checkIns } = await supabase
          .from('habit_check_ins')
          .select('habit_id')
          .eq('user_id', pref.user_id)
          .gte('checked_in_at', `${today}T00:00:00Z`);

        const checkedInHabitIds = new Set(checkIns?.map(c => c.habit_id) || []);
        const pendingHabits = habits?.filter(h => !checkedInHabitIds.has(h.id)) || [];

        if (pendingHabits.length > 0) {
          // Create notification
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: pref.user_id,
              type: 'habit_reminder',
              title: 'Habit Reminder',
              message: `You have ${pendingHabits.length} habit${pendingHabits.length > 1 ? 's' : ''} to complete today!`,
              resource_id: null
            });

          if (notifError) console.error('Failed to create notification:', notifError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: preferences?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
