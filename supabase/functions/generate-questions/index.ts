import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateQuestionsRequest {
  subject: string;
  topic: string;
  classLevel: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, topic, classLevel, difficulty, count } = await req.json() as GenerateQuestionsRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Validate inputs
    if (!subject || !topic || !classLevel || !difficulty || !count) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: subject, topic, classLevel, difficulty, count" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (count < 1 || count > 20) {
      return new Response(
        JSON.stringify({ error: "Question count must be between 1 and 20" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert educational content creator specializing in creating high-quality multiple-choice questions for students. Generate questions that are clear, educational, and appropriate for the specified class level and difficulty.

Guidelines:
- Questions should test understanding, not just memorization
- All options should be plausible
- Avoid obvious wrong answers
- Use clear, concise language appropriate for the class level
- For "easy" difficulty: straightforward recall and basic application
- For "medium" difficulty: requires understanding and application
- For "hard" difficulty: requires analysis, synthesis, or complex problem-solving`;

    const userPrompt = `Generate ${count} multiple-choice questions about "${topic}" for the subject "${subject}" at the ${classLevel} level. Difficulty: ${difficulty}.

Each question must have exactly 4 options (A, B, C, D) with one correct answer.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Generate multiple-choice questions with options and correct answers",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { 
                          type: "string",
                          description: "The question text"
                        },
                        option_a: { 
                          type: "string",
                          description: "Option A text"
                        },
                        option_b: { 
                          type: "string",
                          description: "Option B text"
                        },
                        option_c: { 
                          type: "string",
                          description: "Option C text"
                        },
                        option_d: { 
                          type: "string",
                          description: "Option D text"
                        },
                        correct_option: { 
                          type: "string",
                          enum: ["A", "B", "C", "D"],
                          description: "The correct answer (A, B, C, or D)"
                        },
                        marks: {
                          type: "number",
                          description: "Points for this question (default 1)"
                        }
                      },
                      required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact your administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate questions. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_questions") {
      console.error("Unexpected response format:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const questions = JSON.parse(toolCall.function.arguments);
    
    // Add default marks if not provided
    const processedQuestions = questions.questions.map((q: any) => ({
      ...q,
      marks: q.marks || 1,
    }));

    return new Response(
      JSON.stringify({ questions: processedQuestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
