import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with activity in last 30 days
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .not("email", "is", null);

    if (profilesError) throw profilesError;

    console.log(`Processing monthly recap for ${profiles?.length || 0} users`);

    const results = [];
    
    for (const profile of profiles || []) {
      // Get monthly stats
      const { data: habits } = await supabase
        .from("habit_check_ins")
        .select("id")
        .eq("user_id", profile.id)
        .gte("checked_in_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: focusSessions } = await supabase
        .from("focus_sessions")
        .select("duration_minutes")
        .eq("user_id", profile.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: challenges } = await supabase
        .from("challenge_participants")
        .select("id, progress")
        .eq("user_id", profile.id)
        .gte("joined_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: expenses } = await supabase
        .from("expenses")
        .select("total_amount")
        .eq("user_id", profile.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const habitCount = habits?.length || 0;
      const focusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const challengeCount = challenges?.length || 0;
      const expenseCount = expenses?.length || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.total_amount || 0), 0) || 0;

      // Skip if no activity
      if (habitCount === 0 && focusMinutes === 0 && challengeCount === 0 && expenseCount === 0) {
        console.log(`No monthly activity for ${profile.email}, skipping`);
        continue;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .highlight { background: linear-gradient(120deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; }
              .highlight-number { font-size: 48px; font-weight: bold; margin: 10px 0; }
              .stats-row { display: flex; gap: 15px; margin: 20px 0; }
              .mini-stat { flex: 1; background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
              .mini-stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
              .achievement-badge { display: inline-block; background: #ffc107; color: #000; padding: 8px 15px; border-radius: 20px; margin: 5px; font-size: 14px; }
              .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎊 Your Month in Review</h1>
                <p style="margin: 0; opacity: 0.9; font-size: 18px;">Look how much you've accomplished!</p>
              </div>
              <div class="content">
                <p>Hi ${profile.full_name || "there"},</p>
                
                <p>Another month down! Let's celebrate your wins:</p>
                
                <div class="highlight">
                  <div style="font-size: 18px; opacity: 0.9;">Total Productivity</div>
                  <div class="highlight-number">${habitCount + challengeCount + expenseCount}</div>
                  <div>Actions Completed</div>
                </div>
                
                <div class="stats-row">
                  <div class="mini-stat">
                    <div>✅ Habits</div>
                    <div class="mini-stat-number">${habitCount}</div>
                  </div>
                  <div class="mini-stat">
                    <div>⏱️ Focus</div>
                    <div class="mini-stat-number">${Math.floor(focusMinutes / 60)}h</div>
                  </div>
                  <div class="mini-stat">
                    <div>🏆 Challenges</div>
                    <div class="mini-stat-number">${challengeCount}</div>
                  </div>
                </div>
                
                ${expenseCount > 0 ? `
                  <p style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    💰 You tracked <strong>${expenseCount} expenses</strong> worth <strong>SAR ${totalExpenses.toFixed(2)}</strong> this month
                  </p>
                ` : ''}
                
                <p><strong>🏅 Your Achievements:</strong></p>
                <div style="margin: 15px 0;">
                  ${habitCount >= 30 ? '<span class="achievement-badge">🔥 Habit Master</span>' : ''}
                  ${focusMinutes >= 600 ? '<span class="achievement-badge">🧠 Deep Thinker</span>' : ''}
                  ${challengeCount >= 3 ? '<span class="achievement-badge">💪 Challenge Seeker</span>' : ''}
                  ${habitCount >= 20 ? '<span class="achievement-badge">⭐ Consistent Performer</span>' : ''}
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                  <li>Set new monthly goals</li>
                  <li>Try a feature you haven't used yet</li>
                  <li>Invite friends to join challenges</li>
                  <li>Beat your personal records</li>
                </ul>
                
                <center>
                  <a href="${supabaseUrl.replace("supabase.co", "lovableproject.com")}/dashboard" class="cta-button">
                    Start Your Best Month Yet
                  </a>
                </center>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  Thank you for being part of the Splitz community! Here's to an even better month ahead. 🚀
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Splitz <noreply@splitz.live>",
          to: [profile.email],
          subject: `🎊 Your Month in Review: ${habitCount} habits completed!`,
          html,
        });

        if (emailError) throw emailError;

        // Log email sent
        await supabase.from("email_log").insert({
          user_id: profile.id,
          email_type: "monthly_recap",
        });

        results.push({ email: profile.email, status: "sent" });
        console.log(`Monthly recap sent to ${profile.email}`);
      } catch (error) {
        console.error(`Failed to send to ${profile.email}:`, error);
        results.push({ email: profile.email, status: "failed", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.filter(r => r.status === "sent").length,
        failed: results.filter(r => r.status === "failed").length,
        results 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("Error in send-monthly-recap:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
