import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

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

    // Get users inactive for 3+ days
    const { data: users, error: usersError } = await supabase.rpc(
      "get_inactive_users",
      { days_inactive: 3 }
    );

    if (usersError) throw usersError;

    console.log(`Found ${users?.length || 0} users for Day 3 re-engagement`);

    const results = [];
    
    for (const user of users || []) {
      // Check if email already sent in last 7 days
      const { data: recentEmail } = await supabase
        .from("email_log")
        .select("id")
        .eq("user_id", user.user_id)
        .eq("email_type", "day3_reengagement")
        .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (recentEmail) {
        console.log(`Recent email already sent to ${user.email}`);
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
              .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .stats { display: flex; gap: 20px; margin: 20px 0; }
              .stat { flex: 1; text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; }
              .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
              .stat-label { color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>We Miss You! 💔</h1>
              </div>
              <div class="content">
                <p>Hi ${user.full_name || "there"},</p>
                
                <p>We noticed you haven't been back to Splitz in a few days. We'd love to see you again!</p>
                
                <div class="stats">
                  <div class="stat">
                    <div class="stat-number">127</div>
                    <div class="stat-label">Active users today</div>
                  </div>
                  <div class="stat">
                    <div class="stat-number">1,430</div>
                    <div class="stat-label">Habits completed this week</div>
                  </div>
                </div>
                
                <p><strong>Your account is waiting for you:</strong></p>
                <ul>
                  <li>Start tracking habits in 30 seconds</li>
                  <li>Join active challenges with the community</li>
                  <li>Split expenses easily with friends</li>
                  <li>Focus better with our Pomodoro timer</li>
                </ul>
                
                <center>
                  <a href="${supabaseUrl.replace("supabase.co", "lovableproject.com")}/dashboard" class="cta-button">
                    Come Back to Splitz
                  </a>
                </center>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  If you're having trouble or have feedback, just reply to this email. We're listening!
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                  Don't want these emails? <a href="${supabaseUrl.replace("supabase.co", "lovableproject.com")}/profile">Update your preferences</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Splitz <noreply@splitz.live>",
          to: [user.email],
          subject: "We miss you at Splitz! 💜",
          html,
        });

        if (emailError) throw emailError;

        // Log email sent
        await supabase.from("email_log").insert({
          user_id: user.user_id,
          email_type: "day3_reengagement",
        });

        results.push({ email: user.email, status: "sent" });
        console.log(`Day 3 re-engagement sent to ${user.email}`);
      } catch (error) {
        console.error(`Failed to send to ${user.email}:`, error);
        results.push({ email: user.email, status: "failed", error: error.message });
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
    console.error("Error in send-day3-reengagement:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
