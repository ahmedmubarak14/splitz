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

    // Get unsettled expense members (older than 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: unsettled, error: unsettledError } = await supabase
      .from('expense_members')
      .select(`
        id,
        user_id,
        amount_owed,
        expense:expenses(
          id,
          name,
          group:expense_groups(name)
        )
      `)
      .eq('is_settled', false)
      .lt('created_at', threeDaysAgo.toISOString());

    if (unsettledError) throw unsettledError;

    for (const member of unsettled || []) {
      // Check notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('expense_alerts')
        .eq('user_id', member.user_id)
        .single();

      if (prefs?.expense_alerts) {
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: member.user_id,
            type: 'expense_settlement',
            title: 'Pending Payment',
            message: `You have an unsettled payment of $${member.amount_owed} for "${member.expense.name}" in ${member.expense.group.name}`,
            resource_id: member.expense.id
          });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: unsettled?.length || 0 }),
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
