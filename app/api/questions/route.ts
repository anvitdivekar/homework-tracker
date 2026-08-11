import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendNewQuestionEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { chapter, title, prompt, correct_answer, explanation, type, options, due_at, points } = await req.json();

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify TA role
    const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "ta") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert question
    const { data, error } = await supabase
      .from("questions")
      .insert([
        {
          chapter,
          title,
          prompt,
          correct_answer,
          explanation,
          type: type || "text",
          options,
          due_at,
          points: points || 1,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email to all students
    const { data: students } = await supabase.from("users").select("email").eq("role", "student");
    if (students && students.length > 0) {
      const emails = students.map(s => s.email);
      await sendNewQuestionEmail(emails, title, chapter);
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, title, prompt, correct_answer, explanation, type, options, due_at, points } = await req.json();

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify TA role
    const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "ta") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("questions")
      .update({
        title,
        prompt,
        correct_answer,
        explanation,
        type,
        options,
        due_at,
        points,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing question id" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify TA role
    const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "ta") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("questions").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
