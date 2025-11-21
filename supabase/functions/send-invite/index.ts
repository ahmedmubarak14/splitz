import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { securityHeaders, sanitizeInput, sanitizeEmail, checkRateLimit, validateOrigin } from "../_shared/security.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

interface InviteEmailRequest {
  recipientEmail: string;
  inviteLink: string;
  resourceType: string;
  resourceName: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: securityHeaders });
  }

  // Validate origin (CSRF protection)
  if (!validateOrigin(req)) {
    return new Response(JSON.stringify({ error: "Invalid origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    // Rate limiting: 20 invites per hour
    const rateLimit = await checkRateLimit(
      user.id,
      { action: "send-invite", maxRequests: 20, windowMinutes: 60 },
      supabaseUrl,
      supabaseKey
    );

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...securityHeaders },
        }
      );
    }

    // Parse and sanitize inputs
    const rawData = await req.json();
    const recipientEmail = sanitizeEmail(rawData.recipientEmail || "");
    const inviteLink = sanitizeInput(rawData.inviteLink || "");
    const resourceType = sanitizeInput(rawData.resourceType || "");
    const resourceName = sanitizeInput(rawData.resourceName || "");
    const inviterName = sanitizeInput(rawData.inviterName || "User");

    if (!recipientEmail || !inviteLink || !resourceType || !resourceName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...securityHeaders },
        }
      );
    }

    console.log("Sending invite email to:", recipientEmail);
    console.log("Resource type:", resourceType, "| Resource name:", resourceName);
    console.log("Inviter:", inviterName);

    // Plain text version for better deliverability
    const emailText = `
You're Invited to Splitz!

${inviterName} has invited you to join their ${resourceType}: ${resourceName}

Click here to accept: ${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `.trim();

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
            <h1 style="margin: 0; font-size: 28px;">You're Invited to Splitz!</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Join ${inviterName}'s ${resourceType}</p>
          </div>
          
          <div class="content">
            <h2 style="color: #667eea; margin-top: 0;">${resourceName}</h2>
            <p style="font-size: 16px;">
              <strong>${inviterName}</strong> has invited you to join their ${resourceType} on Splitz - 
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

    // Send using Resend REST API
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Missing RESEND_API_KEY secret");
    }

    console.log("Calling Resend API...");

    const apiRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Splitz <noreply@splitz.live>', // Using Resend's test domain (works without verification)
        to: [recipientEmail],
        subject: `${inviterName} invited you to join "${resourceName}" on Splitz`,
        html: emailHtml,
        text: emailText,
        tags: [
          { name: 'category', value: 'invitation' },
          { name: 'resource_type', value: resourceType }
        ]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Resend API error:', apiRes.status, errText);
      console.error('Response headers:', Object.fromEntries(apiRes.headers.entries()));
      
      // Parse Resend error for better messages
      try {
        const errJson = JSON.parse(errText);
        throw new Error(`Resend: ${errJson.message || errText}`);
      } catch {
        throw new Error(`Resend API error ${apiRes.status}: ${errText}`);
      }
    }

    const data = await apiRes.json();
    console.log('Email sent successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      }
    );
  }
};

serve(handler);
