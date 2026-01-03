import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
