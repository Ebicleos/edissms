import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Dynamic CORS based on origin
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'https://lovable.dev',
    'https://preview--pylfykpcqugkqsnssfsa.lovable.app',
  ].filter(Boolean);
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  if (requestOrigin?.includes('localhost') || requestOrigin?.includes('127.0.0.1')) {
    return requestOrigin;
  }
  if (requestOrigin?.endsWith('.lovable.app')) {
    return requestOrigin;
  }
  return allowedOrigins[0] || '*';
};

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req.headers.get('origin')),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

// Validation schema
const ValidationRequestSchema = z.object({
  provider: z.string().default('paystack'),
  public_key: z.string().min(1, 'Public key is required'),
  secret_key: z.string().optional(),
  school_id: z.string().uuid('Invalid school ID'),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = ValidationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ valid: false, message: validationResult.error.errors[0]?.message || 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { provider, public_key, secret_key, school_id } = validationResult.data;

    // Verify user has access to this school (admin or superadmin)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'superadmin'])
      .single();

    if (!userRole) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get secret key - use provided or fetch from secure table
    let effectiveSecretKey = secret_key;
    
    if (!effectiveSecretKey) {
      // Get secret from secure table using service role
      const { data: secretData } = await supabase
        .rpc('get_school_payment_secret', { p_school_id: school_id });

      if (secretData && secretData.length > 0) {
        effectiveSecretKey = secretData[0].secret_key;
      }
    }

    if (!effectiveSecretKey) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Secret key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating Paystack credentials for school:', school_id);

    // Validate Paystack credentials by making a test API call
    if (provider === 'paystack') {
      // Validate public key format
      if (!public_key.startsWith('pk_test_') && !public_key.startsWith('pk_live_')) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Invalid public key format. Must start with pk_test_ or pk_live_' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate secret key format
      if (!effectiveSecretKey.startsWith('sk_test_') && !effectiveSecretKey.startsWith('sk_live_')) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Invalid secret key format. Must start with sk_test_ or sk_live_' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Test the secret key by fetching bank list (simple read-only operation)
      const response = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${effectiveSecretKey}`,
        },
      });

      const data = await response.json();

      if (data.status === true) {
        console.log('Paystack credentials validated successfully');
        return new Response(
          JSON.stringify({ valid: true, message: 'Credentials are valid' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('Paystack validation failed:', data.message);
        return new Response(
          JSON.stringify({ valid: false, message: data.message || 'Invalid Paystack credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ valid: false, message: 'Unsupported payment provider' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating payment gateway:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, message: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});