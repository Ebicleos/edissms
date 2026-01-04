import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const SMSRequestSchema = z.object({
  to: z.string()
    .min(10, "Phone number too short")
    .max(15, "Phone number too long")
    .regex(/^[\d+\-\s()]+$/, "Invalid phone number format"),
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(640, "Message exceeds SMS limit (640 characters)"),
  type: z.enum(['payment_confirmation', 'subscription_reminder', 'subscription_expired', 'welcome'], {
    errorMap: () => ({ message: "Invalid SMS type" })
  }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TERMII_API_KEY = Deno.env.get('TERMII_API_KEY');
    if (!TERMII_API_KEY) {
      console.warn('TERMII_API_KEY not configured, skipping SMS');
      return new Response(
        JSON.stringify({ success: false, message: 'SMS service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = SMSRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input', 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, message, type } = validationResult.data;

    // Format phone number for Nigerian numbers
    let formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '234' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('234')) {
      formattedPhone = '234' + formattedPhone;
    }

    console.log(`Sending ${type} SMS to ${formattedPhone}`);

    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        from: 'EduManage',
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: TERMII_API_KEY,
      }),
    });

    const result = await response.json();
    console.log('Termii response:', result);

    if (response.ok && result.message_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: result.message_id,
          message: 'SMS sent successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(result.message || 'Failed to send SMS');
    }
  } catch (error) {
    console.error('SMS Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
