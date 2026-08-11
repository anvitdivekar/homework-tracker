"use client";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Question, Submission, User } from "@/lib/types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [chapter, setChapter] = useState(1);
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ is_correct: boolean | null; score: number | null; explanation: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [filterChapter, setFilterChapter] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!selectedQuestion || !selectedQuestion.time_limit_sec) return;

    setTimeRemaining(selectedQuestion.time_limit_sec);
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setSelectedQuestion(null);
          alert("Time limit reached!");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedQuestion]);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/login");
      return;
    }

    const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    if (data) setUser(data);
    else {
      const role = authUser.email === process.env.NEXT_PUBLIC_TA_EMAIL ? "ta" : "student";
      await supabase.from("users").insert([{ id: authUser.id, email: authUser.email, role }]);
      setUser({ id: authUser.id, email: authUser.email ?? "", name: null, role });
    }

    loadQuestions();
  };

  const loadQuestions = async () => {
    const { data } = await supabase.from("questions_public").select("*").order("chapter");
    if (data) setQuestions(data);

    const { data: subs } = await supabase.from("submissions").select("*");
    if (subs) {
      const map = new Map();
      subs.forEach((s: any) => map.set(s.question_id, s));
      setSubmissions(map);
    }
  };

  const createQuestion = async () => {
    if (!title || !prompt || !answer) return;
    const parsed_options = type === "multiple_choice" ? options.split("\n").filter(o => o.trim()) : null;
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapter, title, prompt, correct_answer: answer, explanation, type, options: parsed_options, difficulty }),
    });
    setTitle("");
    setPrompt("");
    setAnswer("");
    setExplanation("");
    setType("text");
    setOptions("");
    setDifficulty("medium");
    loadQuestions();
  };

  const submitAnswer = async () => {
    if (!selectedQuestion || !studentAnswer) return;

    const sub = submissions.get(selectedQuestion.id);
    if (selectedQuestion.max_attempts && sub && (sub.attempt_count ?? 0) >= selectedQuestion.max_attempts) {
      alert(`Max attempts (${selectedQuestion.max_attempts}) reached`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: selectedQuestion.id, answer: studentAnswer }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error}`);
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setFeedback({ is_correct: data.is_correct, score: data.score, explanation: data.explanation });
      setStudentAnswer("");
      loadQuestions();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleExportCSV = async () => {
    const res = await fetch("/api/export/csv");
    if (!res.ok) {
      alert("Failed to export");
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "homework-export.csv";
    a.click();
  };

  const filteredQuestions = filterChapter ? questions.filter(q => q.chapter === filterChapter) : questions;
  const chapters = Array.from({ length: 12 }, (_, i) => i + 1);

  if (!user) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>
          <span className="logo-mark">HW</span>
          Homework Tracker
        </h1>
        <div className="page-header-nav">
          <span style={{ fontSize: "14px" }}>{user.email}</span>
          {user.role !== "ta" && (
            <Link href="/progress" className="btn btn-ghost-navy" style={{ padding: "8px 16px", fontSize: "14px" }}>
              Progress
            </Link>
          )}
          {user.role === "ta" && (
            <>
              <Link href="/analytics" className="btn btn-ghost-navy" style={{ padding: "8px 16px", fontSize: "14px" }}>
                Analytics
              </Link>
              <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "14px" }}>
                Export CSV
              </button>
            </>
          )}
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "14px" }}>
            Logout
          </button>
        </div>
      </div>

      <div className="container">
        {user.role === "ta" ? (
          // TA View
          <div>
            <div style={{ marginBottom: "40px" }}>
              <h2>Create Question</h2>
              <div className="card" style={{ padding: "24px" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Journal Entry Practice"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Chapter</label>
                    <select value={chapter} onChange={(e) => setChapter(parseInt(e.target.value))}>
                      {chapters.map(ch => <option key={ch} value={ch}>Chapter {ch}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Prompt</label>
                  <textarea
                    placeholder="What do you want students to answer?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Correct Answer</label>
                  <textarea
                    placeholder="Debit Cash 1000, Credit Revenue 1000"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Explanation (Optional)</label>
                  <textarea
                    placeholder="Why is this the correct answer?"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Question Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="text">Text Answer</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="fill_blank">Fill in the Blank</option>
                    </select>
                  </div>
                </div>

                {type === "multiple_choice" && (
                  <div className="form-group">
                    <label>Options (one per line)</label>
                    <textarea
                      placeholder="Option A&#10;Option B&#10;Option C"
                      value={options}
                      onChange={(e) => setOptions(e.target.value)}
                    />
                  </div>
                )}

                <button onClick={createQuestion} className="btn btn-primary" style={{ marginTop: "16px" }}>
                  Create Question
                </button>
              </div>
            </div>

            {/* TA Questions List */}
            <div>
              <h2>All Questions ({questions.length})</h2>
              <div style={{ display: "grid", gap: "16px" }}>
                {questions.map((q) => (
                  <div key={q.id} className="question-card" style={{ borderLeftColor: "var(--navy)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <div className="question-title">{q.title}</div>
                        <p style={{ margin: "8px 0", color: "var(--text)", fontSize: "14px" }}>{q.prompt}</p>
                        <div className="question-meta">
                          <span className="badge badge-chapter">Ch {q.chapter}</span>
                          <span className={`badge badge-difficulty-${q.difficulty || 'medium'}`}>{(q.difficulty || 'medium').toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Student View
          <div>
            <h2 style={{ marginBottom: "20px" }}>Homework</h2>

            {/* Chapter Filter */}
            <div className="filter-tabs">
              <button
                className={`tab ${filterChapter === null ? 'active' : ''}`}
                onClick={() => setFilterChapter(null)}
              >
                All Chapters
              </button>
              {chapters.map(ch => (
                <button
                  key={ch}
                  className={`tab ${filterChapter === ch ? 'active' : ''}`}
                  onClick={() => setFilterChapter(ch)}
                >
                  Ch {ch}
                </button>
              ))}
            </div>

            {/* Questions Grid */}
            <div style={{ display: "grid", gap: "16px", marginBottom: "40px" }}>
              {filteredQuestions.map((q) => {
                const submitted = submissions.has(q.id);
                const sub = submitted ? submissions.get(q.id) : null;
                return (
                  <div
                    key={q.id}
                    className={`question-card ${submitted ? 'submitted' : ''}`}
                    onClick={() => { setSelectedQuestion(q); setFeedback(null); }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <div className="question-title">{q.title}</div>
                        <p style={{ margin: "8px 0 12px 0", color: "var(--text)", fontSize: "14px" }}>{q.prompt}</p>
                        <div className="question-meta">
                          <span className="badge badge-chapter">Ch {q.chapter}</span>
                          <span className={`badge badge-difficulty-${q.difficulty || 'medium'}`}>{(q.difficulty || 'medium').toUpperCase()}</span>
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
            </div>
          </div>
        )}
      </div>

      {/* Answer Modal */}
      {selectedQuestion && !user.role.startsWith("ta") && (
        <div className="modal-overlay" onClick={() => setSelectedQuestion(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
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

              {selectedQuestion.max_attempts && submissions.has(selectedQuestion.id) && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Attempt {submissions.get(selectedQuestion.id)?.attempt_count || 1} of {selectedQuestion.max_attempts}
                </p>
              )}

              {!feedback ? (
                <>
                  {selectedQuestion.type === "text" || selectedQuestion.type === "fill_blank" ? (
                    <textarea
                      value={studentAnswer}
                      onChange={(e) => setStudentAnswer(e.target.value)}
                      placeholder="Your answer..."
                      style={{ marginBottom: "16px" }}
                    />
                  ) : selectedQuestion.type === "multiple_choice" && selectedQuestion.options ? (
                    <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(selectedQuestion.options as any[]).map((opt, idx) => (
                        <label key={idx} style={{ display: "flex", alignItems: "center", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", backgroundColor: studentAnswer === opt ? "var(--green-light)" : "transparent", transition: "all 150ms ease" }}>
                          <input
                            type="radio"
                            name="mc"
                            value={opt}
                            checked={studentAnswer === opt}
                            onChange={(e) => setStudentAnswer(e.target.value)}
                            style={{ marginRight: "12px" }}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  <button
                    onClick={submitAnswer}
                    disabled={submitting || !studentAnswer}
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                  >
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
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      backgroundColor: feedback.is_correct ? "var(--green-light)" : "var(--red-light)",
                      borderLeft: `4px solid ${feedback.is_correct ? "var(--green)" : "var(--red)"}`,
                      marginBottom: "16px"
                    }}>
                      <p style={{ margin: "0", color: feedback.is_correct ? "var(--green)" : "var(--red)", fontWeight: "600" }}>
                        {feedback.is_correct ? "✓ Correct!" : "✗ Incorrect"}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedQuestion(null)}
                    className="btn btn-ghost"
                    style={{ width: "100%" }}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
