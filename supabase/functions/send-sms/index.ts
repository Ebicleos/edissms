import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  type: 'payment_confirmation' | 'subscription_reminder' | 'subscription_expired' | 'welcome';
}

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

    const { to, message, type }: SMSRequest = await req.json();

    if (!to || !message) {
      throw new Error('Missing required fields: to, message');
    }

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
