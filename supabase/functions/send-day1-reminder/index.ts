import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

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

    // Get users who signed up ~24 hours ago and haven't received this email
    const { data: users, error: usersError } = await supabase.rpc(
      "get_inactive_users",
      { days_inactive: 1 }
    );

    if (usersError) throw usersError;

    console.log(`Found ${users?.length || 0} users for Day 1 reminder`);

    const results = [];
    
    for (const user of users || []) {
      // Check if email already sent
      const { data: emailLog } = await supabase
        .from("email_log")
        .select("id")
        .eq("user_id", user.user_id)
        .eq("email_type", "day1_reminder")
        .single();

      if (emailLog) {
        console.log(`Email already sent to ${user.email}`);
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
              .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
              .feature-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>👋 Welcome to Splitz!</h1>
              </div>
              <div class="content">
                <p>Hi ${user.full_name || "there"},</p>
                
                <p>We noticed you joined Splitz yesterday – welcome aboard! 🎉</p>
                
                <p>We wanted to check in and see how you're doing. Have you had a chance to explore yet?</p>
                
                <div class="features">
                  <h3>Quick Start Ideas:</h3>
                  <div class="feature-item">Track your first habit (takes 30 seconds)</div>
                  <div class="feature-item">Start a 5-minute focus session</div>
                  <div class="feature-item">Split an expense with friends</div>
                  <div class="feature-item">Join a challenge</div>
                </div>
                
                <p>Most users find their favorite feature within the first few minutes. What will yours be?</p>
                
                <center>
                  <a href="${supabaseUrl.replace("supabase.co", "lovableproject.com")}/dashboard" class="cta-button">
                    Open Splitz Now
                  </a>
                </center>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  Need help getting started? Just reply to this email – we're here to help!
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
          subject: "👋 Ready to explore Splitz?",
          html,
        });

        if (emailError) throw emailError;

        // Log email sent
        await supabase.from("email_log").insert({
          user_id: user.user_id,
          email_type: "day1_reminder",
        });

        results.push({ email: user.email, status: "sent" });
        console.log(`Day 1 reminder sent to ${user.email}`);
      } catch (err) {
        console.error(`Failed to send to ${user.email}:`, err);
        const message = err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
        results.push({ email: user.email, status: "failed", error: message });
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
    console.error("Error in send-day1-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
