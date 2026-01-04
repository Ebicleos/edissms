import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const EmailRequestSchema = z.object({
  to: z.string().email("Invalid email address").max(255, "Email too long"),
  type: z.enum(['payment_confirmation', 'subscription_reminder', 'subscription_expired', 'welcome', 'subscription_activated'], {
    errorMap: () => ({ message: "Invalid email type" })
  }),
  data: z.object({
    name: z.string().max(255).optional(),
    amount: z.number().min(0).max(100000000).optional(),
    reference: z.string().max(255).optional(),
    schoolName: z.string().max(255).optional(),
    planType: z.string().max(100).optional(),
    expiryDate: z.string().max(100).optional(),
    daysRemaining: z.number().min(0).max(365).optional(),
  }).optional().default({}),
});

const getEmailContent = (type: string, data: z.infer<typeof EmailRequestSchema>['data']) => {
  switch (type) {
    case 'payment_confirmation':
      return {
        subject: `Payment Confirmation - ₦${data?.amount?.toLocaleString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Payment Confirmed</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Dear ${data?.name || 'Valued Customer'},</p>
              <p>Your payment of <strong>₦${data?.amount?.toLocaleString()}</strong> has been successfully processed.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Transaction Reference:</strong> ${data?.reference}</p>
              </div>
              <p>Thank you for your payment!</p>
              <p style="color: #666; font-size: 14px;">- EduManage Team</p>
            </div>
          </div>
        `,
      };
    case 'subscription_activated':
      return {
        subject: `Subscription Activated - ${data?.planType} Plan`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Subscription Activated!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Dear ${data?.name || 'Admin'},</p>
              <p>Your <strong>${data?.planType}</strong> subscription for <strong>${data?.schoolName}</strong> has been activated.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Plan:</strong> ${data?.planType}</p>
                <p><strong>Amount:</strong> ₦${data?.amount?.toLocaleString()}</p>
                <p style="margin: 0;"><strong>Valid Until:</strong> ${data?.expiryDate}</p>
              </div>
              <p>Enjoy full access to all EduManage features!</p>
              <p style="color: #666; font-size: 14px;">- EduManage Team</p>
            </div>
          </div>
        `,
      };
    case 'subscription_reminder':
      return {
        subject: `Subscription Expiring in ${data?.daysRemaining} Days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Subscription Expiring Soon</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Dear ${data?.name || 'Admin'},</p>
              <p>Your subscription for <strong>${data?.schoolName}</strong> will expire in <strong>${data?.daysRemaining} days</strong>.</p>
              <p>Renew now to continue enjoying uninterrupted access to all features.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/admin/subscription" 
                   style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Renew Subscription
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">- EduManage Team</p>
            </div>
          </div>
        `,
      };
    case 'subscription_expired':
      return {
        subject: 'Subscription Expired - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Subscription Expired</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Dear ${data?.name || 'Admin'},</p>
              <p>Your subscription for <strong>${data?.schoolName}</strong> has expired.</p>
              <p>Please renew immediately to restore access to all features.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/admin/subscription" 
                   style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Renew Now
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">- EduManage Team</p>
            </div>
          </div>
        `,
      };
    case 'welcome':
      return {
        subject: `Welcome to EduManage - ${data?.schoolName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to EduManage!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p>Dear ${data?.name || 'Admin'},</p>
              <p>Welcome to EduManage! Your school <strong>${data?.schoolName}</strong> has been successfully registered.</p>
              <p>You have a <strong>30-day free trial</strong> to explore all features.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/auth" 
                   style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Login to Dashboard
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">- EduManage Team</p>
            </div>
          </div>
        `,
      };
    default:
      return {
        subject: 'EduManage Notification',
        html: `<p>You have a new notification from EduManage.</p>`,
      };
  }
};

serve(async (req) => {
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

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = EmailRequestSchema.safeParse(body);

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

    const { to, type, data } = validationResult.data;
    const { subject, html } = getEmailContent(type, data);
    console.log(`Sending ${type} email to ${to} by user ${user.id}`);

    // Use Resend API directly via fetch
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EduManage <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    const result = await emailResponse.json();
    console.log('Email sent:', result);

    if (emailResponse.ok) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully', id: result.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(result.message || 'Failed to send email');
    }
  } catch (error) {
    console.error('Email Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
