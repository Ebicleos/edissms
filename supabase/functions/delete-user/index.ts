import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Create client with user's token to verify they're authorized
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Get current user
    const { data: { user: currentUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if current user is admin or superadmin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .single();

    if (!roleData || !['admin', 'superadmin'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, email } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info before deletion for audit log
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const userEmail = email || userProfile?.email;

    // Delete related data from all tables before deleting the auth user
    // This ensures clean deletion even if CASCADE is not set on all foreign keys

    // Delete from teachers table - by user_id first
    await supabaseAdmin
      .from('teachers')
      .delete()
      .eq('user_id', userId);

    // Also delete from teachers table by email match (for orphaned records without user_id)
    if (userEmail) {
      console.log(`Cleaning up teacher records for email: ${userEmail}`);
      await supabaseAdmin
        .from('teachers')
        .delete()
        .eq('email', userEmail);
    }

    // Delete from teacher_classes if exists
    await supabaseAdmin
      .from('teacher_classes')
      .delete()
      .eq('teacher_id', userId);

    // Also try to delete teacher_classes by teacher_record_id (if teacher was linked via record)
    const { data: teacherRecords } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('email', userEmail || '');
    
    if (teacherRecords && teacherRecords.length > 0) {
      for (const record of teacherRecords) {
        await supabaseAdmin
          .from('teacher_classes')
          .delete()
          .eq('teacher_record_id', record.id);
      }
    }

    // Delete from students table if exists (linked by user_id)
    await supabaseAdmin
      .from('students')
      .delete()
      .eq('user_id', userId);

    // Delete from student_classes if exists
    await supabaseAdmin
      .from('student_classes')
      .delete()
      .eq('student_id', userId);

    // Delete notification reads
    await supabaseAdmin
      .from('notification_reads')
      .delete()
      .eq('user_id', userId);

    // Delete user role
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Delete the auth user (will cascade to any remaining references)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      action: 'delete_user',
      entity_type: 'user',
      entity_id: userId,
      user_id: currentUser.id,
      old_data: {
        full_name: userProfile?.full_name,
        email: userProfile?.email,
        role: userRole?.role,
      },
    });

    console.log(`User ${userId} deleted by ${currentUser.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
