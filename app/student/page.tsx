"use client";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Question, Submission } from "@/lib/types";

const chapters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function StudentPage() {
  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ is_correct: boolean | null; score: number | null; explanation: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterChapter, setFilterChapter] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!selectedQuestion?.time_limit_sec) return;
    setTimeRemaining(selectedQuestion.time_limit_sec);
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) { clearInterval(timer); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedQuestion]);

  const loadData = async () => {
    const { data } = await supabase.from("questions_public").select("*").order("chapter");
    if (data) setQuestions(data as Question[]);
    const { data: subs } = await supabase.from("submissions").select("*");
    if (subs) {
      const map = new Map<string, Submission>();
      subs.forEach((s: any) => map.set(s.question_id, s));
      setSubmissions(map);
    }
  };

  const submitAnswer = async () => {
    if (!selectedQuestion || !studentAnswer) return;
    setSubmitting(true);
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: selectedQuestion.id, answer: studentAnswer }),
    });
    const data = await res.json();
    setFeedback(data);
    setSubmitting(false);
    loadData();
  };

  const filteredQuestions = filterChapter ? questions.filter(q => q.chapter === filterChapter) : questions;

  return (
    <div>
      <div className="page-header">
        <h1><span className="logo-mark">HW</span> Homework</h1>
        <div className="page-header-nav">
          <Link href="/progress" className="btn btn-ghost-navy" style={{ padding: "8px 16px", fontSize: "14px" }}>Progress</Link>
          <Link href="/instructor" className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "14px" }}>Instructor View →</Link>
        </div>
      </div>

      <div className="container">
        <h2 style={{ marginBottom: "20px" }}>Homework</h2>
        <div className="filter-tabs">
          <button className={`tab ${filterChapter === null ? "active" : ""}`} onClick={() => setFilterChapter(null)}>All Chapters</button>
          {chapters.map(ch => (
            <button key={ch} className={`tab ${filterChapter === ch ? "active" : ""}`} onClick={() => setFilterChapter(ch)}>Ch {ch}</button>
          ))}
        </div>

        <div style={{ display: "grid", gap: "16px", marginBottom: "40px" }}>
          {filteredQuestions.map(q => {
            const submitted = submissions.has(q.id);
            return (
              <div key={q.id} className={`question-card ${submitted ? "submitted" : ""}`}
                onClick={() => { setSelectedQuestion(q); setFeedback(null); setStudentAnswer(""); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="question-title">{q.title}</div>
                    <p style={{ margin: "8px 0 12px 0", color: "var(--text)", fontSize: "14px" }}>{q.prompt}</p>
                    <div className="question-meta">
                      <span className="badge badge-chapter">Ch {q.chapter}</span>
                      <span className={`badge badge-difficulty-${q.difficulty || "medium"}`}>{(q.difficulty || "medium").toUpperCase()}</span>
                      {submitted && <span className="badge badge-submitted">✓ Submitted</span>}
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginLeft: "16px", minWidth: "100px", fontSize: "13px" }}>
                    {submitted ? "Edit" : "Answer"}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredQuestions.length === 0 && <p style={{ color: "var(--text-muted)" }}>No questions yet.</p>}
        </div>
      </div>

      {selectedQuestion && (
        <div className="modal-overlay" onClick={() => setSelectedQuestion(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ marginBottom: "4px" }}>{selectedQuestion.title}</h2>
                <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>Chapter {selectedQuestion.chapter}</p>
              </div>
              {selectedQuestion.time_limit_sec && timeRemaining !== null && (
                <div style={{ color: timeRemaining < 10 ? "var(--red)" : "var(--text-muted)", fontSize: "14px", fontWeight: "600" }}>
                  ⏱ {timeRemaining}s
                </div>
              )}
            </div>
            <div className="modal-content">
              <p style={{ color: "var(--text)", lineHeight: "1.6" }}>{selectedQuestion.prompt}</p>
              {!feedback ? (
                <>
                  {selectedQuestion.type === "text" || selectedQuestion.type === "fill_blank" ? (
                    <textarea value={studentAnswer} onChange={e => setStudentAnswer(e.target.value)} placeholder="Your answer..." style={{ marginBottom: "16px" }} />
                  ) : selectedQuestion.type === "multiple_choice" && selectedQuestion.options ? (
                    <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(selectedQuestion.options as any[]).map((opt, idx) => (
                        <label key={idx} style={{ display: "flex", alignItems: "center", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", backgroundColor: studentAnswer === opt ? "var(--green-light)" : "transparent" }}>
                          <input type="radio" name="mc" value={opt} checked={studentAnswer === opt} onChange={e => setStudentAnswer(e.target.value)} style={{ marginRight: "12px" }} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                  <button onClick={submitAnswer} disabled={submitting || !studentAnswer} className="btn btn-primary" style={{ width: "100%" }}>
                    {submitting ? "Submitting..." : "Submit Answer"}
                  </button>
                </>
              ) : (
                <>
                  <div className="answer-block">
                    <h3>Correct Answer</h3>
                    <div className="answer-text">{selectedQuestion.correct_answer}</div>
                  </div>
                  {(feedback.explanation || selectedQuestion.explanation) && (
                    <div className="explanation-block">
                      <h3>Explanation</h3>
                      <p className="explanation-text">{feedback.explanation || selectedQuestion.explanation}</p>
                    </div>
                  )}
                  {feedback.is_correct !== null && (
                    <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: feedback.is_correct ? "var(--green-light)" : "var(--red-light)", borderLeft: `4px solid ${feedback.is_correct ? "var(--green)" : "var(--red)"}`, marginBottom: "16px" }}>
                      <p style={{ margin: "0", color: feedback.is_correct ? "var(--green)" : "var(--red)", fontWeight: "600" }}>
                        {feedback.is_correct ? "✓ Correct!" : "✗ Incorrect"}
                      </p>
                    </div>
                  )}
                  <button onClick={() => setSelectedQuestion(null)} className="btn btn-ghost" style={{ width: "100%" }}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
