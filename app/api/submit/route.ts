import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question_id, answer, image_url } = await req.json();
    if (!question_id || !answer) {
      return NextResponse.json({ error: "Missing question_id or answer" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch question + check due date
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", question_id)
      .single();

    if (qError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (question.due_at && new Date() > new Date(question.due_at)) {
      return NextResponse.json({ error: "Question is past due" }, { status: 403 });
    }

    // Check attempt count
    if (question.max_attempts) {
      const { data: submission } = await supabase
        .from("submissions")
        .select("attempt_count")
        .eq("user_id", user.id)
        .eq("question_id", question_id)
        .single();

      if (submission && submission.attempt_count >= question.max_attempts) {
        return NextResponse.json({ error: "Max attempts reached" }, { status: 403 });
      }
    }

    // Grade the answer
    let is_correct = false;
    let score = 0;

    if (question.type === "text") {
      is_correct = answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
      score = is_correct ? (question.points || 1) : 0;
    } else if (question.type === "fill_blank") {
      is_correct = answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
      score = is_correct ? (question.points || 1) : 0;
    } else if (question.type === "multiple_choice") {
      is_correct = answer === question.correct_answer;
      score = is_correct ? (question.points || 1) : 0;
    } else if (question.type === "image") {
      // TA must manually grade image submissions
      is_correct = null;
      score = null;
    }

    // Upsert submission
    const { data: submission, error: sError } = await supabase
      .from("submissions")
      .upsert(
        {
          user_id: user.id,
          question_id,
          answer,
          image_url: question.type === "image" ? image_url : null,
          is_correct,
          score,
          attempt_count: ((await supabase
            .from("submissions")
            .select("attempt_count")
            .eq("user_id", user.id)
            .eq("question_id", question_id)
            .single()).data?.attempt_count || 0) + 1,
          submitted_at: new Date().toISOString(),
          graded_at: is_correct !== null ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,question_id" }
      )
      .select()
      .single();

    if (sError) {
      return NextResponse.json({ error: sError.message }, { status: 500 });
    }

    return NextResponse.json({
      is_correct,
      score,
      explanation: question.explanation,
      message: is_correct ? "Correct!" : is_correct === false ? "Incorrect" : "Submitted for manual grading",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
