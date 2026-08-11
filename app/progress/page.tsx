"use client";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProgressData {
  total_questions: number;
  submitted_count: number;
  correct_count: number;
  total_score: number;
  total_possible: number;
  by_chapter: Array<{
    chapter: number;
    submitted: number;
    correct: number;
    score: number;
    possible: number;
  }>;
}

export default function Progress() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Get questions
    const { data: questions } = await supabase.from("questions_public").select("*");
    if (!questions) {
      setLoading(false);
      return;
    }

    // Get user submissions
    const { data: submissions } = await supabase.from("submissions").select("*").eq("user_id", user.id);
    if (!submissions) {
      setLoading(false);
      return;
    }

    const subMap = new Map(submissions.map(s => [s.question_id, s]));
    const by_chapter: ProgressData["by_chapter"] = [];

    let total_submitted = 0;
    let total_correct = 0;
    let total_score = 0;
    let total_possible = 0;

    for (let ch = 1; ch <= 12; ch++) {
      const chQuestions = questions.filter(q => q.chapter === ch);
      if (chQuestions.length === 0) continue;

      let ch_submitted = 0;
      let ch_correct = 0;
      let ch_score = 0;
      let ch_possible = 0;

      chQuestions.forEach(q => {
        ch_possible += q.points || 1;
        const sub = subMap.get(q.id);
        if (sub) {
          ch_submitted++;
          if (sub.is_correct) ch_correct++;
          if (sub.score !== null) ch_score += sub.score;
        }
      });

      by_chapter.push({ chapter: ch, submitted: ch_submitted, correct: ch_correct, score: ch_score, possible: ch_possible });
      total_submitted += ch_submitted;
      total_correct += ch_correct;
      total_score += ch_score;
      total_possible += ch_possible;
    }

    setProgress({
      total_questions: questions.length,
      submitted_count: total_submitted,
      correct_count: total_correct,
      total_score,
      total_possible,
      by_chapter,
    });
    setLoading(false);
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  if (!progress) return <div style={{ padding: "20px" }}>No data</div>;

  const completionPct = Math.round((progress.submitted_count / progress.total_questions) * 100);
  const scorePct = progress.total_possible > 0 ? Math.round((progress.total_score / progress.total_possible) * 100) : 0;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/dashboard" style={{ color: "#1e3a5f", textDecoration: "none" }}>← Back to Dashboard</Link>
      </div>

      <h1 style={{ fontFamily: "serif", color: "#1e3a5f" }}>Progress</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ padding: "15px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#1e3a5f" }}>Completion</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2d5016" }}>{completionPct}%</div>
          <div style={{ fontSize: "14px", color: "#666" }}>{progress.submitted_count} / {progress.total_questions} submitted</div>
        </div>

        <div style={{ padding: "15px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#1e3a5f" }}>Score</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2d5016" }}>{scorePct}%</div>
          <div style={{ fontSize: "14px", color: "#666" }}>{progress.total_score} / {progress.total_possible} points</div>
        </div>
      </div>

      <h2 style={{ color: "#1e3a5f", marginBottom: "15px" }}>By Chapter</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ccc" }}>
            <th style={{ padding: "10px", textAlign: "left" }}>Chapter</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Submitted</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Correct</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {progress.by_chapter.map(ch => (
            <tr key={ch.chapter} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px" }}>Chapter {ch.chapter}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{ch.submitted} / {(progress.total_questions / 12)}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{ch.correct}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{ch.score} / {ch.possible}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
