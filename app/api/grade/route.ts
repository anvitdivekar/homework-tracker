import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { submission_id, is_correct, score, grader_note } = await req.json();
    if (!submission_id) {
      return NextResponse.json({ error: "Missing submission_id" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is TA
    const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "ta") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update submission
    const { data, error } = await supabase
      .from("submissions")
      .update({
        is_correct,
        score,
        grader_note,
        graded_at: new Date().toISOString(),
      })
      .eq("id", submission_id)
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
