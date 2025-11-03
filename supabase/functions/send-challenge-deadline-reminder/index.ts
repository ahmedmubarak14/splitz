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

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get challenges ending tomorrow
    const { data: challenges, error: challengeError } = await supabase
      .from('challenges')
      .select('id, name, creator_id')
      .eq('end_date', tomorrowStr);

    if (challengeError) throw challengeError;

    for (const challenge of challenges || []) {
      // Get all participants
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('challenge_id', challenge.id);

      if (participantsError) throw participantsError;

      // Check notification preferences for each participant
      for (const participant of participants || []) {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('challenge_updates')
          .eq('user_id', participant.user_id)
          .single();

        if (prefs?.challenge_updates) {
          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: participant.user_id,
              type: 'challenge_deadline',
              title: 'Challenge Deadline',
              message: `The challenge "${challenge.name}" ends tomorrow! Time for a final push!`,
              resource_id: challenge.id
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: challenges?.length || 0 }),
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
