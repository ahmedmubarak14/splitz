import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { securityHeaders, sanitizeInput, sanitizeEmail } from "../_shared/security.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

interface VerificationEmailRequest {
  recipientEmail: string;
  userName: string;
  verificationLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: securityHeaders });
  }

  try {
    const rawData = await req.json();
    const recipientEmail = sanitizeEmail(rawData.recipientEmail || "");
    const userName = sanitizeInput(rawData.userName || "User");
    const verificationLink = sanitizeInput(rawData.verificationLink || "");

    if (!recipientEmail || !verificationLink) {
      return new Response(
        JSON.stringify({ error: "Invalid email address or verification link" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...securityHeaders },
        }
      );
    }

    console.log("Sending verification email to:", recipientEmail);

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
              background: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin: 30px 0;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            .button:hover {
              box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            .info-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
            }
            .footer {
              padding: 20px 30px;
              background: #f8f9fa;
              font-size: 13px;
              color: #666;
              text-align: center;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">✉️</div>
              <h1 style="margin: 0; font-size: 28px;">Verify Your Email</h1>
              <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">One more step to get started!</p>
            </div>
            
            <div class="content">
              <h2 style="color: #667eea; margin-top: 0;">Hi ${userName}! 👋</h2>
              
              <p style="font-size: 16px;">
                Thanks for signing up for Splitz! We're excited to have you on board.
              </p>
              
              <p style="font-size: 16px;">
                To complete your registration and start tracking habits, splitting expenses, and challenging friends, 
                please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify My Email</a>
              </div>
              
              <div class="info-box">
                <p style="margin: 0; font-size: 14px;">
                  <strong>🔒 Security Note:</strong> This link will expire in 24 hours for your security. 
                  If you didn't create an account with Splitz, you can safely ignore this email.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; word-break: break-all; color: #667eea; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${verificationLink}
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Need help?</strong> Visit <a href="https://splitz.live" style="color: #667eea;">splitz.live</a> or reply to this email.</p>
              <p style="margin-top: 10px;">The Splitz Team 🚀</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY secret");
    }

    const apiRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Splitz <noreply@splitz.live>',
        to: [recipientEmail],
        subject: '✉️ Verify your Splitz account',
        html: emailHtml,
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Resend API error:', apiRes.status, errText);
      throw new Error(`Resend API error ${apiRes.status}: ${errText}`);
    }

    const data = await apiRes.json();
    console.log('Verification email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
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
