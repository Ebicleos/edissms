import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Webhooks are server-to-server only - no CORS headers needed
// This endpoint should only accept requests from Paystack's servers

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
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature - REQUIRED for security
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response('Unauthorized: Missing signature', { status: 401 });
    }

    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized: Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event);

    if (event.event === 'charge.success') {
      const { reference, amount, metadata, customer } = event.data;
      
      console.log('Processing successful payment:', { reference, amount, metadata });

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const feePaymentId = metadata?.fee_payment_id;
      const amountPaid = amount / 100; // Convert from kobo to naira

      if (feePaymentId) {
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

        console.log('Payment processed successfully:', { feePaymentId, amountPaid, newStatus });

        // Send SMS and email notifications (non-blocking)
        try {
          // Get student details for notifications (only needed fields)
          const { data: studentData } = await supabase
            .from('students')
            .select('full_name, phone_contact, email, school_id')
            .eq('id', feePayment.student_id)
            .single();

          if (studentData) {
            // Get school details
            const { data: schoolData } = await supabase
              .from('schools')
              .select('name, phone, email')
              .eq('id', studentData.school_id)
              .single();

            // Send SMS to student/guardian
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

            // Send email notification
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