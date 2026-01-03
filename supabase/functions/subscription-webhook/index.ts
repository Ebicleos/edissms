import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return signature === expectedSignature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (signature) {
      const isValid = await verifySignature(PAYSTACK_SECRET_KEY, rawBody, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log('Received webhook event:', event.event);

    // Only process successful charges
    if (event.event !== 'charge.success') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { metadata, reference, amount } = event.data;

    // Check if this is a subscription payment
    if (metadata?.type !== 'subscription' || !metadata?.school_id) {
      console.log('Not a subscription payment, ignoring');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing subscription payment:', { school_id: metadata.school_id, plan_type: metadata.plan_type });

    // Use service role client for database updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate new end date based on plan type
    const startDate = new Date();
    const endDate = new Date();
    
    if (metadata.plan_type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Termly = 4 months
      endDate.setMonth(endDate.getMonth() + 4);
    }

    // Update or create subscription
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        school_id: metadata.school_id,
        plan_type: metadata.plan_type,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        amount: amount / 100, // Convert from kobo
        payment_reference: reference,
      }, {
        onConflict: 'school_id',
      });

    if (subError) {
      console.error('Error updating subscription:', subError);
      throw subError;
    }

    console.log('Subscription updated successfully for school:', metadata.school_id);

    // Send SMS and email notifications (non-blocking)
    try {
      // Get school details for notifications
      const { data: schoolData } = await supabaseAdmin
        .from('schools')
        .select('name, email, phone')
        .eq('id', metadata.school_id)
        .single();

      if (schoolData) {
        // Send SMS notification
        if (schoolData.phone) {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              to: schoolData.phone,
              message: `Your ${metadata.plan_type} subscription for ${schoolData.name} has been activated. Thank you for subscribing to EduManage!`,
              type: 'subscription_activated',
            }),
          });
        }

        // Send email notification
        if (schoolData.email) {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              to: schoolData.email,
              type: 'subscription_activated',
              data: {
                schoolName: schoolData.name,
                planType: metadata.plan_type,
                amount: amount / 100,
                expiryDate: endDate.toISOString().split('T')[0],
              },
            }),
          });
        }
      }
    } catch (notifError) {
      console.warn('Failed to send notifications:', notifError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription activated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Subscription webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
