import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  to: string;
  message: string;
  recipient_type?: string;
  class_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, message, recipient_type, class_id }: WhatsAppRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get phone numbers based on recipient type
    let phoneNumbers: string[] = [];

    if (recipient_type === 'class' && class_id) {
      // Get students in the class and their parent phone numbers
      const { data: students } = await supabase
        .from('students')
        .select('phone_contact')
        .eq('class_id', class_id)
        .not('phone_contact', 'is', null);

      phoneNumbers = students?.map(s => s.phone_contact).filter(Boolean) || [];
    } else if (recipient_type === 'all' || recipient_type === 'students') {
      const { data: students } = await supabase
        .from('students')
        .select('phone_contact')
        .not('phone_contact', 'is', null);

      phoneNumbers = students?.map(s => s.phone_contact).filter(Boolean) || [];
    } else if (recipient_type === 'teachers') {
      const { data: teachers } = await supabase
        .from('teachers')
        .select('phone')
        .not('phone', 'is', null);

      phoneNumbers = teachers?.map(t => t.phone).filter(Boolean) || [];
    } else if (to) {
      phoneNumbers = [to];
    }

    // Note: WhatsApp Business API integration requires:
    // 1. Meta Business Account
    // 2. WhatsApp Business API access
    // 3. Approved message templates for bulk messaging
    
    // For now, we'll log the intent and return a success response
    // In production, you would integrate with:
    // - Meta Cloud API (graph.facebook.com)
    // - Twilio WhatsApp API
    // - Other WhatsApp Business Solution Providers

    console.log(`WhatsApp message request:`, {
      recipientCount: phoneNumbers.length,
      messageLength: message.length,
      recipientType: recipient_type,
      classId: class_id,
    });

    // Store the message in the database
    const { error: insertError } = await supabase.from('messages').insert({
      type: 'whatsapp',
      content: message,
      recipients_type: recipient_type || 'individual',
      class_id: class_id || null,
      sent_by: user.id,
      status: 'queued', // In production, would be 'sent' after API call
    });

    if (insertError) {
      console.error('Error storing message:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp message queued',
        recipientCount: phoneNumbers.length,
        note: 'WhatsApp Business API integration required for actual delivery. Message has been stored.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-whatsapp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
