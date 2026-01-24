import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { securityHeaders } from "../_shared/security.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: securityHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active subscriptions where next_renewal_date is in the past
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overdueSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, name, next_renewal_date, billing_cycle, custom_cycle_days, amount')
      .eq('status', 'active')
      .lte('next_renewal_date', today);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${overdueSubscriptions?.length || 0} overdue subscriptions to update`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const subscription of overdueSubscriptions || []) {
      try {
        // Calculate the new renewal date based on billing cycle
        const currentDate = new Date(subscription.next_renewal_date);
        let nextDate: Date;

        switch (subscription.billing_cycle) {
          case 'weekly':
            // Keep adding weeks until we get a future date
            nextDate = new Date(currentDate);
            while (nextDate <= new Date()) {
              nextDate.setDate(nextDate.getDate() + 7);
            }
            break;
          
          case 'monthly':
            // Keep adding months until we get a future date
            nextDate = new Date(currentDate);
            while (nextDate <= new Date()) {
              nextDate.setMonth(nextDate.getMonth() + 1);
            }
            break;
          
          case 'quarterly':
            nextDate = new Date(currentDate);
            while (nextDate <= new Date()) {
              nextDate.setMonth(nextDate.getMonth() + 3);
            }
            break;
          
          case 'yearly':
            nextDate = new Date(currentDate);
            while (nextDate <= new Date()) {
              nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            break;
          
          case 'custom':
            const days = subscription.custom_cycle_days || 30;
            nextDate = new Date(currentDate);
            while (nextDate <= new Date()) {
              nextDate.setDate(nextDate.getDate() + days);
            }
            break;
          
          default:
            // Default to monthly
            nextDate = new Date(currentDate);
            while (nextDate <= new Date()) {
              nextDate.setMonth(nextDate.getMonth() + 1);
            }
        }

        const nextRenewalDate = nextDate.toISOString().split('T')[0];

        // Update the subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            next_renewal_date: nextRenewalDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          errors.push(`Failed to update ${subscription.name}: ${updateError.message}`);
        } else {
          // Record the automatic payment in subscription_payments
          await supabase
            .from('subscription_payments')
            .insert({
              subscription_id: subscription.id,
              amount: subscription.amount,
              notes: `Auto-recorded payment for ${subscription.billing_cycle} cycle`
            });

          // If shared subscription, reset contributors' payment status for new cycle
          const { error: resetError } = await supabase
            .from('subscription_contributors')
            .update({
              is_settled: false,
              payment_submitted: false,
              paid_at: null,
              approved_at: null,
              submission_at: null
            })
            .eq('subscription_id', subscription.id);

          if (resetError) {
            console.warn(`Failed to reset contributors for ${subscription.name}: ${resetError.message}`);
          }

          updatedCount++;
          console.log(`Updated ${subscription.name}: ${subscription.next_renewal_date} -> ${nextRenewalDate}`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing ${subscription.name}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: overdueSubscriptions?.length || 0,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...securityHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error updating subscription renewals:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...securityHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
