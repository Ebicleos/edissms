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

// Input validation schema
const PaymentRequestSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  amount: z.number().min(1, "Amount must be positive").max(100000000, "Amount exceeds maximum"),
  reference: z.string().min(1, "Reference is required").max(255, "Reference too long"),
  metadata: z.object({
    fee_payment_id: z.string().uuid("Invalid fee payment ID").optional(),
    student_id: z.string().uuid("Invalid student ID").optional(),
    student_name: z.string().max(255, "Student name too long").optional(),
    callback_url: z.string().url("Invalid callback URL").max(2000, "URL too long").optional(),
    school_id: z.string().uuid("Invalid school ID").optional(),
    type: z.string().optional(),
  }).optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = PaymentRequestSchema.safeParse(body);

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

    const { email, amount, reference, metadata } = validationResult.data;
    
    console.log('Initializing Paystack payment for user:', user.id, { email, amount, reference });

    // Authorization check: user can only pay for themselves OR must be admin
    if (metadata?.student_id && metadata.student_id !== user.id) {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        console.error('User not authorized to initiate payment for another student');
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden: Cannot initiate payment for another student' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine which Paystack key to use
    let paystackSecretKey: string | undefined;
    let schoolId = metadata?.school_id;

    // For fee payments, get the school's payment gateway settings
    if (metadata?.type === 'fee_payment' || metadata?.fee_payment_id) {
      // If no school_id in metadata, get it from the student
      if (!schoolId && metadata?.student_id) {
        const { data: studentData } = await supabase
          .from('students')
          .select('school_id')
          .eq('id', metadata.student_id)
          .single();
        
        schoolId = studentData?.school_id;
      }

      // If still no school_id, try to get from user's profile
      if (!schoolId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        schoolId = profileData?.school_id;
      }

      if (schoolId) {
        // Get school's payment gateway settings from schools table (non-secret data)
        const { data: schoolData } = await supabase
          .from('schools')
          .select('payment_gateway_enabled, name')
          .eq('id', schoolId)
          .single();

        if (!schoolData?.payment_gateway_enabled) {
          console.error('School payment gateway not enabled');
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Payment gateway not configured. Please contact your school administrator.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get secret key from secure table using service role (never exposed to clients)
        const { data: secretData } = await supabase
          .rpc('get_school_payment_secret', { p_school_id: schoolId });

        if (secretData && secretData.length > 0 && secretData[0].secret_key) {
          paystackSecretKey = secretData[0].secret_key;
          console.log('Using school-specific Paystack key for:', schoolData.name);
        }
      }
    }

    // Fall back to platform key (for non-fee payments or if school key not available)
    if (!paystackSecretKey) {
      paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    }

    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    // Amount should be in kobo (multiply by 100)
    const amountInKobo = Math.round(amount * 100);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: metadata?.callback_url || undefined,
        metadata: {
          fee_payment_id: metadata?.fee_payment_id,
          student_id: metadata?.student_id,
          student_name: metadata?.student_name,
          school_id: schoolId,
          type: metadata?.type || 'fee_payment',
          initiated_by: user.id,
        },
      }),
    });

    const data = await response.json();
    console.log('Paystack response:', data);

    if (!data.status) {
      throw new Error(data.message || 'Failed to initialize payment');
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error initializing payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});