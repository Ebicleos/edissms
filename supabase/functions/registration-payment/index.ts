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

// Input validation schema for initializing payment
const InitPaymentSchema = z.object({
  school_data: z.object({
    name: z.string().min(3),
    code: z.string().min(3).max(10),
    email: z.string().email(),
    phone: z.string().min(10),
    address: z.string().min(5),
    initials: z.string().max(4).optional(),
    logo_url: z.string().optional(),
  }),
  admin_data: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  plan_type: z.enum(['termly', 'yearly']),
  callback_url: z.string().url().optional(),
});

// Schema for verifying payment
const VerifyPaymentSchema = z.object({
  reference: z.string().min(1),
});

const PLAN_PRICES = {
  termly: 50000,
  yearly: 120000,
};

const PLAN_DURATION_MONTHS = {
  termly: 4,
  yearly: 12,
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'initialize';
    const body = await req.json();

    if (action === 'initialize') {
      // Initialize payment for new school registration
      const validationResult = InitPaymentSchema.safeParse(body);

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

      const { school_data, admin_data, plan_type, callback_url } = validationResult.data;
      const amount = PLAN_PRICES[plan_type];
      const reference = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log('Initializing registration payment:', { 
        school: school_data.name, 
        plan_type, 
        amount, 
        reference 
      });

      // Initialize Paystack payment
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: admin_data.email,
          amount: amount * 100, // Paystack expects amount in kobo
          reference,
          callback_url: callback_url || `${Deno.env.get('SUPABASE_URL')}/`,
          metadata: {
            type: 'school_registration',
            school_data: JSON.stringify(school_data),
            admin_data: JSON.stringify({ name: admin_data.name, email: admin_data.email }),
            plan_type,
          },
        }),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackData.status) {
        console.error('Paystack error:', paystackData);
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

      console.log('Paystack payment initialized successfully:', paystackData.data.reference);

      return new Response(
        JSON.stringify({
          success: true,
          authorization_url: paystackData.data.authorization_url,
          reference: paystackData.data.reference,
          access_code: paystackData.data.access_code,
          amount,
          plan_type,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'verify') {
      // Verify payment and complete registration
      const validationResult = VerifyPaymentSchema.safeParse(body);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid reference' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { reference } = validationResult.data;

      console.log('Verifying payment:', reference);

      // Verify with Paystack
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.status || verifyData.data.status !== 'success') {
        console.error('Payment verification failed:', verifyData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment not successful', 
            status: verifyData.data?.status || 'unknown' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metadata = verifyData.data.metadata;
      const schoolData = JSON.parse(metadata.school_data);
      const adminData = JSON.parse(metadata.admin_data);
      const planType = metadata.plan_type as 'termly' | 'yearly';
      const amountPaid = verifyData.data.amount / 100;

      console.log('Payment verified successfully, creating school:', schoolData.name);

      // Create Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Create the auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminData.email,
        email_confirm: true,
        user_metadata: {
          full_name: adminData.name,
        },
      });

      if (authError) {
        console.error('Auth user creation failed:', authError);
        throw new Error(`Failed to create user: ${authError.message}`);
      }

      // Create the school
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .insert({
          name: schoolData.name,
          code: schoolData.code.toUpperCase(),
          email: schoolData.email,
          phone: schoolData.phone,
          address: schoolData.address,
          initials: schoolData.initials,
          logo_url: schoolData.logo_url,
          created_by: authData.user.id,
        })
        .select()
        .single();

      if (schoolError) {
        console.error('School creation failed:', schoolError);
        throw new Error(`Failed to create school: ${schoolError.message}`);
      }

      // Create subscription (active, not trial)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + PLAN_DURATION_MONTHS[planType]);

      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          school_id: school.id,
          plan_type: planType,
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          amount: amountPaid,
          payment_reference: reference,
        });

      if (subError) {
        console.error('Subscription creation failed:', subError);
        throw new Error(`Failed to create subscription: ${subError.message}`);
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: adminData.name,
          email: adminData.email,
          school_id: school.id,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
      }

      // Add admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ 
          user_id: authData.user.id, 
          role: 'admin',
          school_id: school.id,
        });

      if (roleError) {
        console.error('Role assignment failed:', roleError);
      }

      // Create school settings
      const { error: settingsError } = await supabaseAdmin
        .from('school_settings')
        .insert({
          school_id: school.id,
          school_name: schoolData.name,
          school_initials: schoolData.initials,
          email: schoolData.email,
          phone: schoolData.phone,
          address: schoolData.address,
          logo_url: schoolData.logo_url,
        });

      if (settingsError) {
        console.error('School settings creation failed:', settingsError);
      }

      console.log('School registration completed successfully:', school.id);

      return new Response(
        JSON.stringify({
          success: true,
          school_id: school.id,
          school_name: school.name,
          admin_email: adminData.email,
          plan_type: planType,
          amount_paid: amountPaid,
          reference,
          subscription_end: endDate.toISOString().split('T')[0],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Registration payment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
