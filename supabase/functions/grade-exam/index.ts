import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const GradeRequestSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID format"),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = GradeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { submission_id } = validationResult.data;

    console.log(`Grading submission ${submission_id} for user ${user.id}`);

    // Verify this submission belongs to the requesting user
    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .select('id, student_id, exam_id, is_submitted')
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      console.error('Submission not found:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (submission.student_id !== user.id) {
      console.error('User does not own this submission');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (submission.is_submitted) {
      console.log('Submission already graded');
      return new Response(
        JSON.stringify({ error: 'Submission already graded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all student answers for this submission
    const { data: studentAnswers, error: answersError } = await supabase
      .from('student_answers')
      .select('id, question_id, selected_option')
      .eq('submission_id', submission_id);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch answers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all questions for this exam with correct answers
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, correct_option, marks')
      .eq('exam_id', submission.exam_id);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a map for quick lookup
    const questionMap = new Map(questions?.map(q => [q.id, q]) || []);

    // Calculate score and update is_correct for each answer
    let totalScore = 0;
    let totalMarks = 0;

    for (const answer of studentAnswers || []) {
      const question = questionMap.get(answer.question_id);
      if (!question) continue;

      totalMarks += question.marks || 1;
      const isCorrect = answer.selected_option === question.correct_option;
      
      if (isCorrect) {
        totalScore += question.marks || 1;
      }

      // Update is_correct field
      await supabase
        .from('student_answers')
        .update({ is_correct: isCorrect })
        .eq('id', answer.id);
    }

    // Update the submission with final score
    const { error: updateError } = await supabase
      .from('exam_submissions')
      .update({
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        score: totalScore,
        total_marks: totalMarks,
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Graded submission ${submission_id}: ${totalScore}/${totalMarks}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: totalScore, 
        total_marks: totalMarks 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in grade-exam function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
