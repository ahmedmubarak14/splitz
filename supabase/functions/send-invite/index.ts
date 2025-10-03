import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  recipientEmail: string;
  inviteLink: string;
  resourceType: string;
  resourceName: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, inviteLink, resourceType, resourceName, inviterName }: InviteEmailRequest = await req.json();

    console.log("Sending invite email to:", recipientEmail);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px;
              border-radius: 12px;
              color: white;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              margin-top: 20px;
              color: #333;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="margin: 0; font-size: 28px;">You're Invited to LinkUp!</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Join ${inviterName}'s ${resourceType}</p>
          </div>
          
          <div class="content">
            <h2 style="color: #667eea; margin-top: 0;">${resourceName}</h2>
            <p style="font-size: 16px;">
              <strong>${inviterName}</strong> has invited you to join their ${resourceType} on LinkUp - 
              the platform for tracking habits, splitting expenses, and competing in challenges with friends!
            </p>
            
            <p style="font-size: 16px;">
              Click the button below to accept the invitation and get started:
            </p>
            
            <div style="text-align: center;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link in your browser:<br>
              <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">${inviteLink}</a>
            </p>
            
            <div class="footer">
              <p>This invitation will expire in 7 days.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "LinkUp <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `${inviterName} invited you to join "${resourceName}" on LinkUp`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
