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

    const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "ta") {
      router.push("/dashboard");
      return;
    }

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

  if (loading) return <div className="container" style={{ textAlign: "center", paddingTop: "40px" }}>Loading...</div>;

  const totalSubmissions = questionStats.reduce((sum, q) => sum + q.submission_count, 0);
  const totalCorrect = questionStats.reduce((sum, q) => sum + q.correct_count, 0);
  const avgClassScore = totalSubmissions > 0 ? Math.round((totalCorrect / totalSubmissions) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>
          <span className="logo-mark">HW</span>
          Analytics
        </h1>
        <Link href="/dashboard" className="btn btn-ghost-navy" style={{ padding: "8px 16px", fontSize: "14px" }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="container">
        {/* Summary Stats */}
        <div className="stats-grid" style={{ marginBottom: "40px" }}>
          <div className="stat-card">
            <div className="stat-number">{studentStats.length}</div>
            <div className="stat-label">Active Students</div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              currently enrolled
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-number">{questionStats.length}</div>
            <div className="stat-label">Questions Created</div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              across all chapters
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-number">{totalSubmissions}</div>
            <div className="stat-label">Total Submissions</div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              {totalCorrect} correct ({avgClassScore}%)
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-number">{avgClassScore}%</div>
            <div className="stat-label">Class Average</div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              across all submissions
            </p>
          </div>
        </div>

        {/* Question Performance */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ marginBottom: "20px" }}>Question Performance</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Chapter</th>
                  <th>Pts</th>
                  <th>Submissions</th>
                  <th>Correct</th>
                  <th>Success Rate</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {questionStats.map(q => {
                  const successRate = q.submission_count > 0 ? Math.round((q.correct_count / q.submission_count) * 100) : 0;
                  return (
                    <tr key={q.id}>
                      <td><strong>{q.title}</strong></td>
                      <td>{q.chapter}</td>
                      <td>{q.points}</td>
                      <td>{q.submission_count}</td>
                      <td style={{ color: q.correct_count > 0 ? "var(--green)" : "var(--text-muted)" }}>{q.correct_count}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px" }}>
                            <div style={{
                              width: `${successRate}%`,
                              height: "100%",
                              backgroundColor: successRate >= 70 ? "var(--green)" : successRate >= 50 ? "#ffc107" : "var(--red)",
                              borderRadius: "2px",
                              transition: "width 200ms ease"
                            }} />
                          </div>
                          <span style={{ fontSize: "12px", minWidth: "30px" }}>{successRate}%</span>
                        </div>
                      </td>
                      <td><strong>{q.avg_score}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Performance */}
        <div>
          <h2 style={{ marginBottom: "20px" }}>Student Performance</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Student Email</th>
                  <th>Submissions</th>
                  <th>Correct</th>
                  <th>Success Rate</th>
                  <th>Total Score</th>
                  <th>Chapters Completed</th>
                </tr>
              </thead>
              <tbody>
                {studentStats.map(s => {
                  const successRate = s.submission_count > 0 ? Math.round((s.correct_count / s.submission_count) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.email}</strong></td>
                      <td>{s.submission_count}</td>
                      <td style={{ color: s.correct_count > 0 ? "var(--green)" : "var(--text-muted)" }}>{s.correct_count}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px" }}>
                            <div style={{
                              width: `${successRate}%`,
                              height: "100%",
                              backgroundColor: successRate >= 70 ? "var(--green)" : successRate >= 50 ? "#ffc107" : "var(--red)",
                              borderRadius: "2px",
                              transition: "width 200ms ease"
                            }} />
                          </div>
                          <span style={{ fontSize: "12px", minWidth: "30px" }}>{successRate}%</span>
                        </div>
                      </td>
                      <td><strong>{s.total_score}</strong></td>
                      <td>{s.chapters_completed} / 12</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
