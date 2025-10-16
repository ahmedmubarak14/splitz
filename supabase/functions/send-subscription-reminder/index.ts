import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  contributorId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { contributorId }: ReminderRequest = await req.json();

    // Fetch contributor details
    const { data: contributor, error: contributorError } = await supabase
      .from("subscription_contributors")
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email
        ),
        subscriptions:subscription_id (
          id,
          name,
          amount,
          currency,
          next_renewal_date
        )
      `)
      .eq("id", contributorId)
      .single();

    if (contributorError || !contributor) {
      throw new Error("Contributor not found");
    }

    const profile = contributor.profiles as any;
    const subscription = contributor.subscriptions as any;

    if (!profile.email) {
      throw new Error("Contributor email not found");
    }

    // Send reminder email using Resend REST API
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY secret");
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder</h2>
        <p>Hi ${profile.full_name},</p>
        <p>This is a friendly reminder about your contribution to <strong>${subscription.name}</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Your Share:</strong> ${subscription.currency} ${contributor.contribution_amount}</p>
          <p style="margin: 5px 0;"><strong>Next Renewal:</strong> ${new Date(subscription.next_renewal_date).toLocaleDateString()}</p>
        </div>
        
        <p>Please ensure your payment is settled before the renewal date.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated reminder from Splitz. If you've already paid, please disregard this message.
        </p>
      </div>
    `;

    const apiRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Splitz <onboarding@resend.dev>',
        to: [profile.email],
        subject: `Payment Reminder: ${subscription.name}`,
        html: emailHtml,
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Resend API error:', apiRes.status, errText);
      throw new Error(`Resend API error ${apiRes.status}`);
    }

    const emailResponse = await apiRes.json();
    console.log("Reminder email sent:", emailResponse.id);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending reminder:", error);
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