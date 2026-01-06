import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS based on origin - prevents CSRF attacks
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'https://lovable.dev',
  ].filter(Boolean);
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Allow localhost for development
  if (requestOrigin?.includes('localhost') || requestOrigin?.includes('127.0.0.1')) {
    return requestOrigin;
  }
  // Allow lovable.app subdomains (preview environments)
  if (requestOrigin?.endsWith('.lovable.app')) {
    return requestOrigin;
  }
  return allowedOrigins[0] || '';
};

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req.headers.get('origin')),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

interface UpdateSecretsRequest {
  school_id: string;
  secret_key?: string;
  webhook_secret?: string;
  public_key?: string;
  provider?: string;
  enabled?: boolean;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const body: UpdateSecretsRequest = await req.json();
    const { school_id, secret_key, webhook_secret, public_key, provider, enabled } = body;

    // Validate required fields
    if (!school_id) {
      return new Response(
        JSON.stringify({ error: 'school_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has admin or superadmin role for this school
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .in('role', ['admin', 'superadmin']);

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission for this school
    const isSuperadmin = roleData?.some(r => r.role === 'superadmin');
    const isSchoolAdmin = roleData?.some(r => r.role === 'admin' && r.school_id === school_id);

    if (!isSuperadmin && !isSchoolAdmin) {
      console.error('User lacks permission for school:', school_id);
      return new Response(
        JSON.stringify({ error: 'You do not have permission to manage this school\'s payment settings' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized for school:', school_id);

    // Update schools table for non-secret data
    if (public_key !== undefined || provider !== undefined || enabled !== undefined) {
      const schoolUpdate: Record<string, unknown> = {};
      if (public_key !== undefined) schoolUpdate.payment_gateway_public_key = public_key;
      if (provider !== undefined) schoolUpdate.payment_gateway_provider = provider;
      if (enabled !== undefined) schoolUpdate.payment_gateway_enabled = enabled;

      const { error: schoolError } = await supabaseAdmin
        .from('schools')
        .update(schoolUpdate)
        .eq('id', school_id);

      if (schoolError) {
        console.error('School update error:', schoolError);
        return new Response(
          JSON.stringify({ error: 'Failed to update school settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update secrets if provided
    if (secret_key || webhook_secret) {
      // Check if record exists
      const { data: existingSecret, error: checkError } = await supabaseAdmin
        .from('school_payment_secrets')
        .select('id')
        .eq('school_id', school_id)
        .maybeSingle();

      if (checkError) {
        console.error('Check existing secret error:', checkError);
        return new Response(
          JSON.stringify({ error: 'Failed to check existing secrets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingSecret) {
        // Update existing record
        const updateData: Record<string, string | null> = {};
        
        if (secret_key) {
          updateData.secret_key_encrypted = secret_key;
          updateData.key_last_four = secret_key.slice(-4);
        }
        if (webhook_secret) {
          updateData.webhook_secret_encrypted = webhook_secret;
          updateData.webhook_last_four = webhook_secret.slice(-4);
        }

        const { error: updateError } = await supabaseAdmin
          .from('school_payment_secrets')
          .update(updateData)
          .eq('school_id', school_id);

        if (updateError) {
          console.error('Update secret error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update payment secrets' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabaseAdmin
          .from('school_payment_secrets')
          .insert({
            school_id,
            secret_key_encrypted: secret_key || null,
            key_last_four: secret_key ? secret_key.slice(-4) : null,
            webhook_secret_encrypted: webhook_secret || null,
            webhook_last_four: webhook_secret ? webhook_secret.slice(-4) : null,
          });

        if (insertError) {
          console.error('Insert secret error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save payment secrets' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('Secrets updated successfully for school:', school_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        key_last_four: secret_key ? secret_key.slice(-4) : undefined 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
