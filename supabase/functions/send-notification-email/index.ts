import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  userId: string;
  title: string;
  message: string;
  type: string;
  resourceId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, message, type, resourceId }: NotificationEmailRequest = await req.json();

    console.log("Sending notification email:", { userId, title, type });

    // Get user email and preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email notifications are enabled
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('email_notifications')
      .eq('user_id', userId)
      .single();

    if (!preferences?.email_notifications) {
      console.log("Email notifications disabled for user:", userId);
      return new Response(
        JSON.stringify({ message: "Email notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct email HTML
    const emoji = getEmojiForType(type);
    const actionUrl = resourceId ? `https://splitz.live/${getPathForType(type, resourceId)}` : "https://splitz.live/dashboard";

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .emoji {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content {
              padding: 30px 20px;
            }
            .notification-title {
              font-size: 20px;
              font-weight: 600;
              color: #1a1a1a;
              margin: 0 0 10px 0;
            }
            .notification-message {
              font-size: 16px;
              color: #666;
              margin: 0 0 20px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 8px;
              font-weight: 600;
              margin-top: 10px;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              color: #999;
              font-size: 14px;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">${emoji}</div>
              <h1>Splitz</h1>
            </div>
            <div class="content">
              <h2 class="notification-title">${title}</h2>
              <p class="notification-message">${message}</p>
              <a href="${actionUrl}" class="button">View in App</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you have email notifications enabled.</p>
              <p><a href="https://splitz.live/profile">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Splitz <noreply@splitz.live>",
        to: [profile.email],
        subject: `${emoji} ${title}`,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log("Email sent successfully:", resendData);

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function getEmojiForType(type: string): string {
  const emojiMap: Record<string, string> = {
    habit: "🎯",
    challenge: "🏆",
    expense: "💰",
    subscription: "📱",
    trip: "✈️",
    friendship: "👥",
  };
  return emojiMap[type] || "🔔";
}

function getPathForType(type: string, resourceId: string): string {
  const pathMap: Record<string, string> = {
    habit: `habits`,
    challenge: `challenges`,
    expense: `expenses`,
    subscription: `subscriptions`,
    trip: `trips/${resourceId}`,
    friendship: `friends`,
  };
  return pathMap[type] || "dashboard";
}

serve(handler);
