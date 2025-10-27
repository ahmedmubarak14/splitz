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

    // Get all active users (who have done something in last 14 days)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .not("email", "is", null);

    if (profilesError) throw profilesError;

    console.log(`Processing weekly summary for ${profiles?.length || 0} users`);

    const results = [];
    
    for (const profile of profiles || []) {
      // Get user's weekly summary
      const { data: summary, error: summaryError } = await supabase.rpc(
        "get_user_weekly_summary",
        { p_user_id: profile.id }
      );

      if (summaryError) {
        console.error(`Error getting summary for ${profile.email}:`, summaryError);
        continue;
      }

      // Skip if user has no activity this week
      if (!summary || (
        summary.habits_completed === 0 &&
        summary.focus_minutes === 0 &&
        summary.challenges_progress === 0 &&
        summary.expenses_added === 0
      )) {
        console.log(`No activity for ${profile.email}, skipping`);
        continue;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
              .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
              .stat-number { font-size: 36px; font-weight: bold; color: #667eea; margin: 10px 0; }
              .stat-label { color: #666; font-size: 14px; }
              .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .achievement { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Your Week in Review</h1>
                <p style="margin: 0; opacity: 0.9;">Here's what you accomplished this week</p>
              </div>
              <div class="content">
                <p>Hi ${profile.full_name || "there"},</p>
                
                <p>Great week! Here's a quick recap of your productivity on Splitz:</p>
                
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-label">✅ Habits</div>
                    <div class="stat-number">${summary.habits_completed}</div>
                    <div class="stat-label">completed</div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-label">⏱️ Focus Time</div>
                    <div class="stat-number">${Math.floor(summary.focus_minutes / 60)}h ${summary.focus_minutes % 60}m</div>
                    <div class="stat-label">deep work</div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-label">🏆 Challenges</div>
                    <div class="stat-number">${summary.challenges_progress}</div>
                    <div class="stat-label">in progress</div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-label">💰 Expenses</div>
                    <div class="stat-number">${summary.expenses_added}</div>
                    <div class="stat-label">tracked</div>
                  </div>
                </div>
                
                ${summary.habits_completed >= 7 ? `
                  <div class="achievement">
                    <strong>🎉 Achievement Unlocked!</strong><br/>
                    You completed at least one habit every day this week. Keep the streak going!
                  </div>
                ` : ''}
                
                <p><strong>Next Week Goals:</strong></p>
                <ul>
                  <li>Try increasing your focus sessions by 25%</li>
                  <li>Invite a friend to join a challenge</li>
                  <li>Maintain your habit streaks</li>
                </ul>
                
                <center>
                  <a href="${supabaseUrl.replace("supabase.co", "lovableproject.com")}/dashboard" class="cta-button">
                    Start This Week Strong
                  </a>
                </center>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  Keep up the great work! See you next Sunday for another recap.
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
          subject: `📊 Your Weekly Summary: ${summary.habits_completed} habits, ${Math.floor(summary.focus_minutes / 60)}h focused`,
          html,
        });

        if (emailError) throw emailError;

        // Log email sent
        await supabase.from("email_log").insert({
          user_id: profile.id,
          email_type: "weekly_summary",
        });

        results.push({ email: profile.email, status: "sent" });
        console.log(`Weekly summary sent to ${profile.email}`);
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
    console.error("Error in send-weekly-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
