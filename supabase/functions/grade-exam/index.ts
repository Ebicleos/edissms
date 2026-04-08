import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'https://lovable.dev',
    'https://preview--pylfykpcqugkqsnssfsa.lovable.app',
  ].filter(Boolean);
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  if (requestOrigin?.includes('localhost') || requestOrigin?.includes('127.0.0.1')) return requestOrigin;
  if (requestOrigin?.endsWith('.lovable.app')) return requestOrigin;
  return allowedOrigins[0] || '*';
};

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req.headers.get('origin')),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

const GradeRequestSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID format"),
});

// Normalize term format: "First Term" -> "first", "2nd Term" -> "second", etc.
function normalizeTerm(term: string): string {
  const t = term.toLowerCase().trim();
  if (t.includes('first') || t.includes('1st') || t === '1') return 'first';
  if (t.includes('second') || t.includes('2nd') || t === '2') return 'second';
  if (t.includes('third') || t.includes('3rd') || t === '3') return 'third';
  return t.replace(/\s*term\s*/i, '').trim() || t;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const validationResult = GradeRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors.map(e => e.message) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { submission_id } = validationResult.data;
    console.log(`Grading submission ${submission_id} for user ${user.id}`);

    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .select('id, student_id, exam_id, is_submitted')
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      return new Response(JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (submission.student_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (submission.is_submitted) {
      return new Response(JSON.stringify({ error: 'Submission already graded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch answers and questions in parallel
    const [answersResult, questionsResult] = await Promise.all([
      supabase.from('student_answers').select('id, question_id, selected_option').eq('submission_id', submission_id),
      supabase.from('questions').select('id, correct_option, marks').eq('exam_id', submission.exam_id),
    ]);

    if (answersResult.error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch answers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (questionsResult.error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const questionMap = new Map(questionsResult.data?.map(q => [q.id, q]) || []);

    let totalScore = 0;
    let totalMarks = 0;

    for (const answer of answersResult.data || []) {
      const question = questionMap.get(answer.question_id);
      if (!question) continue;
      totalMarks += question.marks || 1;
      const isCorrect = answer.selected_option === question.correct_option;
      if (isCorrect) totalScore += question.marks || 1;
      await supabase.from('student_answers').update({ is_correct: isCorrect }).eq('id', answer.id);
    }

    // Update submission
    const { error: updateError } = await supabase
      .from('exam_submissions')
      .update({ is_submitted: true, submitted_at: new Date().toISOString(), score: totalScore, total_marks: totalMarks })
      .eq('id', submission_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Graded submission ${submission_id}: ${totalScore}/${totalMarks}`);

    // Bridge CBT score to student_grades for report cards
    try {
      const { data: exam } = await supabase
        .from('exams')
        .select('subject, class_id, school_id')
        .eq('id', submission.exam_id)
        .single();

      if (exam?.school_id) {
        const { data: settings } = await supabase
          .from('school_settings')
          .select('term, academic_year')
          .eq('school_id', exam.school_id)
          .single();

        if (settings?.term && settings?.academic_year) {
          const normalizedTerm = normalizeTerm(settings.term);
          // Scale CBT score to /60 (exam portion in Nigerian CA40+Exam60 system)
          const scaledExamScore = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 60) : 0;

          // Check if grade row already exists
          const { data: existing } = await supabase
            .from('student_grades')
            .select('id, ca1_score, ca2_score, ca3_score')
            .eq('student_id', submission.student_id)
            .eq('subject_name', exam.subject)
            .eq('class_id', exam.class_id)
            .eq('term', normalizedTerm)
            .eq('academic_year', settings.academic_year)
            .maybeSingle();

          if (existing) {
            const ca1 = existing.ca1_score || 0;
            const ca2 = existing.ca2_score || 0;
            const ca3 = existing.ca3_score || 0;
            const newTotal = ca1 + ca2 + ca3 + scaledExamScore;
            await supabase
              .from('student_grades')
              .update({ exam_score: scaledExamScore, total_score: newTotal })
              .eq('id', existing.id);
            console.log(`Updated student_grades ${existing.id} with exam_score=${scaledExamScore}`);
          } else {
            await supabase
              .from('student_grades')
              .insert({
                student_id: submission.student_id,
                subject_name: exam.subject,
                class_id: exam.class_id,
                term: normalizedTerm,
                academic_year: settings.academic_year,
                exam_score: scaledExamScore,
                total_score: scaledExamScore,
                ca1_score: 0,
                ca2_score: 0,
                ca3_score: 0,
              });
            console.log(`Inserted new student_grades row for ${exam.subject} with exam_score=${scaledExamScore}`);
          }
        }
      }
    } catch (bridgeError) {
      console.error('Non-fatal: Failed to bridge CBT score to student_grades:', bridgeError);
    }

    return new Response(
      JSON.stringify({ success: true, score: totalScore, total_marks: totalMarks }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in grade-exam function:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
