"use client";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QuestionStats {
  id: string;
  title: string;
  chapter: number;
  points: number;
  submission_count: number;
  correct_count: number;
  avg_score: number;
}

interface StudentStats {
  id: string;
  email: string;
  total_score: number;
  submission_count: number;
  correct_count: number;
  chapters_completed: number;
}

export default function Analytics() {
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Verify TA
    const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "ta") {
      router.push("/dashboard");
      return;
    }

    // Get questions with stats
    const { data: questions } = await supabase.from("questions_public").select("*");
    const { data: allSubs } = await supabase.from("submissions").select("*");

    if (questions && allSubs) {
      const qStats: QuestionStats[] = questions.map(q => {
        const qSubs = allSubs.filter(s => s.question_id === q.id);
        const correctCount = qSubs.filter(s => s.is_correct === true).length;
        const avgScore = qSubs.length > 0 ? qSubs.reduce((sum, s) => sum + (s.score || 0), 0) / qSubs.length : 0;

        return {
          id: q.id,
          title: q.title,
          chapter: q.chapter,
          points: q.points || 1,
          submission_count: qSubs.length,
          correct_count: correctCount,
          avg_score: Math.round(avgScore * 100) / 100,
        };
      });
      setQuestionStats(qStats);

      // Get student stats
      const { data: students } = await supabase.from("users").select("*").eq("role", "student");
      if (students) {
        const sStats: StudentStats[] = students.map(st => {
          const sSubs = allSubs.filter(s => s.user_id === st.id);
          const chapters = new Set(questions
            .filter(q => sSubs.some(s => s.question_id === q.id && s.is_correct === true))
            .map(q => q.chapter));

          return {
            id: st.id,
            email: st.email,
            total_score: sSubs.reduce((sum, s) => sum + (s.score || 0), 0),
            submission_count: sSubs.length,
            correct_count: sSubs.filter(s => s.is_correct === true).length,
            chapters_completed: chapters.size,
          };
        });
        setStudentStats(sStats);
      }
    }

    setLoading(false);
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/dashboard" style={{ color: "#1e3a5f", textDecoration: "none" }}>← Back to Dashboard</Link>
      </div>

      <h1 style={{ fontFamily: "serif", color: "#1e3a5f" }}>Analytics</h1>

      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#1e3a5f", marginBottom: "15px" }}>Question Performance</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ccc" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Question</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Ch</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Pts</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Submissions</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Correct</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {questionStats.map(q => (
              <tr key={q.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{q.title}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{q.chapter}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{q.points}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{q.submission_count}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{q.correct_count}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{q.avg_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 style={{ color: "#1e3a5f", marginBottom: "15px" }}>Student Performance</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ccc" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Submissions</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Correct</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Total Score</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Chapters Done</th>
            </tr>
          </thead>
          <tbody>
            {studentStats.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{s.email}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{s.submission_count}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{s.correct_count}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{s.total_score}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{s.chapters_completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
