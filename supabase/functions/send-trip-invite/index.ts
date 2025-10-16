import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { validateOrigin } from "../_shared/security.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TripInviteRequest {
  recipientEmail: string;
  inviteLink: string;
  tripName: string;
  senderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate origin
    if (!validateOrigin(req)) {
      return new Response(JSON.stringify({ error: "Invalid origin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      recipientEmail,
      inviteLink,
      tripName,
      senderName,
    }: TripInviteRequest = await req.json();

    // Validate inputs
    if (!recipientEmail || !inviteLink || !tripName || !senderName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize inputs
    const cleanEmail = recipientEmail.trim().toLowerCase();
    const cleanTripName = tripName.trim().substring(0, 200);
    const cleanSenderName = senderName.trim().substring(0, 100);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use the same sender as subscriptions (can be overridden by RESEND_FROM)
    const fromEmail = Deno.env.get('RESEND_FROM') || 'Splitz <noreply@splitz.live>';

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: `${cleanSenderName} invited you to ${cleanTripName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Trip Invitation</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🌍 You're Invited!</h1>
              </div>
              
              <div style="background: #f9fafb; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  <strong>${cleanSenderName}</strong> has invited you to join the trip:
                </p>
                
                <h2 style="color: #667eea; font-size: 24px; margin: 20px 0;">
                  ${cleanTripName}
                </h2>
                
                <p style="font-size: 16px; margin: 30px 0;">
                  Join your friends to plan this adventure together on Splitz!
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Join Trip
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">${inviteLink}</a>
                </p>
              </div>
              
              <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
                <p>This invitation expires in 7 days.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </body>
          </html>
        `,
        text: `
${cleanSenderName} invited you to join "${cleanTripName}"

Join your friends to plan this adventure together on Splitz!

Click here to join: ${inviteLink}

This invitation expires in 7 days.
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      
      // Check if it's a domain verification issue
      if (emailResponse.status === 403 && errorData.message?.includes('domain')) {
        return new Response(
          JSON.stringify({ 
            error: 'RESEND_DOMAIN_NOT_VERIFIED',
            message: errorData.message 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`Failed to send email: ${emailResponse.statusText}`);
    }

    const emailData = await emailResponse.json();
    console.log("Trip invitation email sent:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-trip-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
