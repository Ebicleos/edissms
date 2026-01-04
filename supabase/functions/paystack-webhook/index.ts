import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// This is a unified webhook handler for all Paystack payment types
// Routes events based on metadata.type: fee_payment, subscription, school_registration

serve(async (req) => {
  // Webhooks don't need CORS preflight - reject OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const event = JSON.parse(body);

    console.log('Paystack webhook event:', event.event);
    console.log('Payment metadata:', event.data?.metadata);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // deno-lint-ignore no-explicit-any
    const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

    // Determine which secret key to use for verification based on payment type
    const paymentType = event.data?.metadata?.type;
    const schoolId = event.data?.metadata?.school_id;
    
    let paystackSecretKey: string | undefined;

    // For fee payments, try to use school's key first
    if (paymentType === 'fee_payment' && schoolId) {
      const { data: schoolData } = await supabase
        .from('schools')
        .select('payment_gateway_secret_key, payment_gateway_enabled')
        .eq('id', schoolId)
        .single();

      if (schoolData?.payment_gateway_enabled && schoolData?.payment_gateway_secret_key) {
        paystackSecretKey = schoolData.payment_gateway_secret_key;
        console.log('Using school-specific key for webhook verification');
      }
    }

    // Fall back to platform key
    if (!paystackSecretKey) {
      paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      console.log('Using platform key for webhook verification');
    }

    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    // Verify webhook signature - REQUIRED for security
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response('Unauthorized: Missing signature', { status: 401 });
    }

    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      // If school key verification fails, try platform key as fallback
      const platformKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (platformKey && paystackSecretKey !== platformKey) {
        const platformHash = createHmac('sha512', platformKey)
          .update(body)
          .digest('hex');
        
        if (platformHash === signature) {
          console.log('Signature verified with platform key');
        } else {
          console.error('Invalid webhook signature');
          return new Response('Unauthorized: Invalid signature', { status: 401 });
        }
      } else {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized: Invalid signature', { status: 401 });
      }
    }

    if (event.event === 'charge.success') {
      const { reference, amount, metadata, customer } = event.data;
      const amountPaid = amount / 100; // Convert from kobo to naira

      console.log('Processing successful payment:', { reference, amount: amountPaid, type: paymentType });

      // Route based on payment type
      switch (paymentType) {
        case 'fee_payment':
          await handleFeePayment(supabase, { reference, amountPaid, metadata, customer, supabaseUrl, supabaseServiceKey });
          break;
        
        case 'subscription':
          await handleSubscriptionPayment(supabase, { reference, amountPaid, metadata });
          break;
        
        case 'school_registration':
          // Registration payments are verified directly by the client
          console.log('School registration payment received - client will verify');
          break;
        
        default:
          // Default to fee payment for backward compatibility
          if (metadata?.fee_payment_id) {
            await handleFeePayment(supabase, { reference, amountPaid, metadata, customer, supabaseUrl, supabaseServiceKey });
          } else {
            console.log('Unknown payment type, no action taken');
          }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Handle student fee payments
// deno-lint-ignore no-explicit-any
async function handleFeePayment(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  { reference, amountPaid, metadata, customer, supabaseUrl, supabaseServiceKey }: {
    reference: string;
    amountPaid: number;
    // deno-lint-ignore no-explicit-any
    metadata: Record<string, any>;
    customer: { email?: string };
    supabaseUrl: string;
    supabaseServiceKey: string;
  }
) {
  const feePaymentId = metadata?.fee_payment_id as string;

  if (!feePaymentId) {
    console.log('No fee_payment_id in metadata, skipping');
    return;
  }

  // Get current fee payment
  const { data: feePayment, error: fetchError } = await supabase
    .from('fee_payments')
    .select('*')
    .eq('id', feePaymentId)
    .single();

  if (fetchError) {
    console.error('Error fetching fee payment:', fetchError);
    throw fetchError;
  }

  // Calculate new amounts
  const newAmountPaid = Number(feePayment.amount_paid) + amountPaid;
  const newBalance = Number(feePayment.amount_payable) - newAmountPaid;
  const newStatus = newBalance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';

  // Update fee payment
  const { error: updateError } = await supabase
    .from('fee_payments')
    .update({
      amount_paid: newAmountPaid,
      balance: newBalance,
      status: newStatus,
      last_payment_date: new Date().toISOString(),
    })
    .eq('id', feePaymentId);

  if (updateError) {
    console.error('Error updating fee payment:', updateError);
    throw updateError;
  }

  // Record the transaction
  const { error: transactionError } = await supabase
    .from('payment_transactions')
    .insert({
      fee_payment_id: feePaymentId,
      amount: amountPaid,
      payment_method: 'paystack',
      transaction_reference: reference,
      status: 'completed',
    });

  if (transactionError) {
    console.error('Error recording transaction:', transactionError);
  }

  console.log('Fee payment processed successfully:', { feePaymentId, amountPaid, newStatus });

  // Send SMS and email notifications (non-blocking)
  try {
    const { data: studentData } = await supabase
      .from('students')
      .select('full_name, phone_contact, email, school_id')
      .eq('id', feePayment.student_id)
      .single();

    if (studentData) {
      const { data: schoolData } = await supabase
        .from('schools')
        .select('name, phone, email')
        .eq('id', studentData.school_id)
        .single();

      // Send SMS
      if (studentData.phone_contact) {
        await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: studentData.phone_contact,
            message: `Payment of ₦${amountPaid.toLocaleString()} received for ${studentData.full_name}. Ref: ${reference}. Thank you! - ${schoolData?.name || 'EduManage'}`,
            type: 'payment_confirmation',
          }),
        });
      }

      // Send email
      if (studentData.email || customer?.email) {
        await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: studentData.email || customer?.email,
            type: 'payment_confirmation',
            data: {
              name: studentData.full_name,
              amount: amountPaid,
              reference: reference,
            },
          }),
        });
      }
    }
  } catch (notifError) {
    console.warn('Failed to send notifications:', notifError);
  }
}

// Handle subscription payments
async function handleSubscriptionPayment(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  { reference, amountPaid, metadata }: {
    reference: string;
    amountPaid: number;
    // deno-lint-ignore no-explicit-any
    metadata: Record<string, any>;
  }
) {
  const schoolId = metadata?.school_id as string;
  const planType = metadata?.plan_type as string;

  if (!schoolId) {
    console.log('No school_id in subscription metadata');
    return;
  }

  // Calculate subscription end date
  const startDate = new Date();
  const endDate = new Date();
  
  if (planType === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    // Default to termly (4 months)
    endDate.setMonth(endDate.getMonth() + 4);
  }

  // Create new subscription record
  const { error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      school_id: schoolId,
      plan_type: planType || 'termly',
      amount: amountPaid,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      payment_reference: reference,
    });

  if (insertError) {
    console.error('Error creating subscription:', insertError);
    throw insertError;
  }

  // Ensure school is active
  await supabase
    .from('schools')
    .update({ is_active: true })
    .eq('id', schoolId);

  console.log('Subscription payment processed:', { schoolId, planType, endDate });
}
