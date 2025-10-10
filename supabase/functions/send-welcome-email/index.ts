import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { securityHeaders, sanitizeInput, sanitizeEmail } from "../_shared/security.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

interface WelcomeEmailRequest {
  recipientEmail: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: securityHeaders });
  }

  try {
    const rawData = await req.json();
    const recipientEmail = sanitizeEmail(rawData.recipientEmail || "");
    const userName = sanitizeInput(rawData.userName || "User");

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...securityHeaders },
        }
      );
    }

    console.log("Sending welcome email to:", recipientEmail);

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
            .feature {
              margin: 20px 0;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #667eea;
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
            <h1 style="margin: 0; font-size: 32px;">Welcome to Splitz! 🎉</h1>
            <p style="margin-top: 10px; opacity: 0.9; font-size: 18px;">Get ready to level up your productivity!</p>
          </div>
          
          <div class="content">
            <h2 style="color: #667eea; margin-top: 0;">Hi ${userName}! 👋</h2>
            
            <p style="font-size: 16px;">
              We're thrilled to have you on board! Splitz is your all-in-one platform for:
            </p>
            
            <div class="feature">
              <strong style="color: #667eea;">📊 Habit Tracking</strong>
              <p style="margin: 5px 0 0 0;">Build and maintain daily habits with streak tracking and progress visualization.</p>
            </div>
            
            <div class="feature">
              <strong style="color: #667eea;">🏆 Group Challenges</strong>
              <p style="margin: 5px 0 0 0;">Compete with friends in time-based or goal-based challenges.</p>
            </div>
            
            <div class="feature">
              <strong style="color: #667eea;">💰 Expense Splitting</strong>
              <p style="margin: 5px 0 0 0;">Share costs fairly with automatic split calculations and settlement tracking.</p>
            </div>
            
            <div class="feature">
              <strong style="color: #667eea;">🎯 Focus Timer</strong>
              <p style="margin: 5px 0 0 0;">Stay productive with Pomodoro technique and task management.</p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Ready to get started?
            </p>
            
            <div style="text-align: center;">
              <a href="https://splitz.live/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <div class="footer">
              <p><strong>Need help?</strong> Check out our <a href="https://splitz.live" style="color: #667eea;">help center</a> or reply to this email.</p>
              <p style="margin-top: 10px;">Happy tracking! 🚀</p>
              <p style="margin-top: 20px; color: #999;">The Splitz Team</p>
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
        from: 'Splitz <welcome@splitz.live>',
        to: [recipientEmail],
        subject: `Welcome to Splitz, ${userName}! 🎉`,
        html: emailHtml,
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Resend API error:', apiRes.status, errText);
      throw new Error(`Resend API error ${apiRes.status}: ${errText}`);
    }

    const data = await apiRes.json();
    console.log('Welcome email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
