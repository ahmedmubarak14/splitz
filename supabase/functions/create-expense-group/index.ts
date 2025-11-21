import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { securityHeaders, sanitizeInput, sanitizeEmail, checkRateLimit, validateOrigin } from "../_shared/security.ts";

interface CreateGroupRequest {
  groupName: string;
  emails?: string[];
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
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    const rawData = await req.json();
    const groupName = sanitizeInput(rawData.groupName || "");
    const emails = (rawData.emails || []).map(sanitizeEmail).filter(Boolean);

    if (!groupName || groupName.length === 0) {
      return new Response(JSON.stringify({ error: "Group name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    if (emails.length > 50) {
      return new Response(JSON.stringify({ error: "Maximum 50 emails allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("Missing Supabase envs");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Identify caller
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error("getUser error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    const user = userData.user;

    // Rate limiting: 10 groups per hour
    const rateLimit = await checkRateLimit(
      user.id,
      { action: "create-expense-group", maxRequests: 10, windowMinutes: 60 },
      SUPABASE_URL,
      SERVICE_ROLE
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

    // Create group (bypass RLS using service role)
    const { data: group, error: groupError } = await supabase
      .from("expense_groups")
      .insert({ name: groupName, created_by: user.id })
      .select()
      .single();

    if (groupError) {
      console.error("Insert expense_groups error", groupError);
      return new Response(JSON.stringify({ error: groupError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...securityHeaders },
      });
    }

    // Add creator as a member
    const { error: creatorError } = await supabase
      .from("expense_group_members")
      .insert({ group_id: group.id, user_id: user.id });

    if (creatorError) {
      console.error("Insert creator membership error", creatorError);
    }

    let addedCount = 0;
    let invitationsCreated = 0;
    let emailsSent = 0;

    if (emails.length > 0) {
      // Existing users by email
      const { data: foundProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", emails);

      if (profilesError) {
        console.error("Fetch profiles error", profilesError);
      }

      const foundEmailSet = new Set((foundProfiles || []).map((p: any) => (p.email || "").toLowerCase()));
      const notFoundEmails = emails.filter((e: string) => !foundEmailSet.has(e.toLowerCase()));

      const membersToInsert = (foundProfiles || [])
        .filter((p: any) => p.id !== user.id)
        .map((p: any) => ({ group_id: group.id, user_id: p.id }));

      if (membersToInsert.length > 0) {
        const { error: membersError } = await supabase
          .from("expense_group_members")
          .insert(membersToInsert);
        if (!membersError) addedCount = membersToInsert.length;
        else console.error("Insert members error", membersError);
      }

      // Create invitations + try sending email (non-blocking)
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      for (const email of notFoundEmails) {
        try {
          const inviteCode = `expense_${Math.random().toString(36).substring(2, 15)}`;
          const { error: inviteError } = await supabase
            .from("invitations")
            .insert({
              invite_code: inviteCode,
              invite_type: "expense",
              resource_id: group.id,
              created_by: user.id,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
          if (inviteError) throw inviteError;
          invitationsCreated++;

          if (resendApiKey) {
            const inviteLink = `${new URL(req.url).origin}/join/${inviteCode}`;
            const inviterName = user.user_metadata?.full_name || "A friend";
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "Splitz <noreply@splitz.live>",
                to: [email],
                subject: `${inviterName} invited you to split expenses`,
                html: `
                  <h2>${inviterName} invited you to join an expense group</h2>
                  <p>Click the link below to join and start splitting expenses:</p>
                  <p><a href="${inviteLink}">${inviteLink}</a></p>
                  <p>This invite expires in 30 days.</p>
                `,
              }),
            });
            if (emailRes.ok) emailsSent++;
            else {
              const errTxt = await emailRes.text();
              console.warn("Resend email failed", errTxt);
            }
          }
        } catch (e) {
          console.error(`Failed processing invite for ${email}`, e);
        }
      }
    }

    return new Response(
      JSON.stringify({ group, addedCount, invitationsCreated, emailsSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error: any) {
    console.error("create-expense-group error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  }
};

serve(handler);
