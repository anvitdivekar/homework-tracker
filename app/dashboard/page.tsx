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
  const [chapter, setChapter] = useState(1);
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ is_correct: boolean | null; score: number | null; explanation: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
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
      body: JSON.stringify({ chapter, title, prompt, correct_answer: answer, type, options: parsed_options, difficulty }),
    });
    setTitle("");
    setPrompt("");
    setAnswer("");
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

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "2px solid #1e3a5f", paddingBottom: "10px" }}>
        <h1 style={{ fontFamily: "serif", color: "#1e3a5f" }}>Homework Tracker</h1>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <span style={{ color: "#666" }}>{user.email} ({user.role})</span>
          {user.role !== "ta" && (
            <Link href="/progress" style={{ color: "#1e3a5f", textDecoration: "none", padding: "8px 16px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
              Progress
            </Link>
          )}
          {user.role === "ta" && (
            <>
              <Link href="/analytics" style={{ color: "#1e3a5f", textDecoration: "none", padding: "8px 16px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
                Analytics
              </Link>
              <button onClick={handleExportCSV} style={{ padding: "8px 16px", backgroundColor: "#d4af37", border: "none", cursor: "pointer", borderRadius: "4px" }}>
                Export CSV
              </button>
            </>
          )}
          <button onClick={handleLogout} style={{ padding: "8px 16px", backgroundColor: "#d4af37", border: "none", cursor: "pointer", borderRadius: "4px" }}>
            Logout
          </button>
        </div>
      </div>

      {user.role === "ta" ? (
        <div>
          <h2 style={{ fontFamily: "serif", color: "#1e3a5f" }}>Create Question</h2>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }} />
          <textarea placeholder="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", minHeight: "100px" }} />
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}>
            <option value="text">Text Answer</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="fill_blank">Fill in the Blank</option>
            <option value="image">Image Upload</option>
          </select>
          {type === "multiple_choice" && (
            <textarea placeholder="Options (one per line)" value={options} onChange={(e) => setOptions(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", minHeight: "80px" }} />
          )}
          <input placeholder="Correct Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }} />
          <select value={chapter} onChange={(e) => setChapter(parseInt(e.target.value))} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button onClick={createQuestion} style={{ padding: "10px 20px", backgroundColor: "#1e3a5f", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
            Create
          </button>

          <h2 style={{ fontFamily: "serif", color: "#1e3a5f", marginTop: "30px" }}>Questions</h2>
          <div>
            {questions.map((q) => (
              <div key={q.id} style={{ padding: "10px", border: "1px solid #ccc", marginBottom: "10px", borderRadius: "4px" }}>
                <strong>[Ch {q.chapter}] {q.title}</strong>
                <p>{q.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ fontFamily: "serif", color: "#1e3a5f" }}>Homework</h2>
          <div>
            {questions.map((q) => {
              const submitted = submissions.has(q.id);
              const sub = submitted ? submissions.get(q.id) : null;
              return (
                <div key={q.id} style={{ padding: "10px", border: "1px solid #ccc", marginBottom: "10px", borderRadius: "4px", backgroundColor: submitted ? "#e8f5e9" : "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <strong>[Ch {q.chapter}] {q.title}</strong>
                      {q.difficulty && <span style={{ marginLeft: "10px", fontSize: "12px", padding: "2px 6px", borderRadius: "3px", backgroundColor: q.difficulty === "easy" ? "#c8e6c9" : q.difficulty === "hard" ? "#ffcdd2" : "#fff9c4" }}>{q.difficulty}</span>}
                      <p>{q.prompt}</p>
                      {q.due_at && <small style={{ color: new Date() > new Date(q.due_at) ? "#d32f2f" : "#666" }}>Due: {new Date(q.due_at).toLocaleDateString()}</small>}
                      {q.points && <small style={{ marginLeft: "10px" }}>({q.points} pts)</small>}
                    </div>
                    <div>
                      {submitted && sub && (
                        <div style={{ textAlign: "right", marginBottom: "10px" }}>
                          {sub.is_correct && <span style={{ color: "#2d5016" }}>✓ Correct</span>}
                          {sub.is_correct === false && <span style={{ color: "#8b3a3a" }}>✗ Incorrect</span>}
                          {sub.is_correct === null && <span style={{ color: "#666" }}>⏳ Pending</span>}
                          {sub.score !== null && <div style={{ fontSize: "14px", color: "#666" }}>{sub.score}/{q.points || 1} pts</div>}
                        </div>
                      )}
                      <button onClick={() => { setSelectedQuestion(q); setFeedback(null); }} style={{ marginLeft: "10px", padding: "5px 10px", backgroundColor: "#1e3a5f", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
                        {submitted ? "Edit" : "Submit"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedQuestion && !user.role.startsWith("ta") && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", maxWidth: "500px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <h3 style={{ fontFamily: "serif", margin: "0" }}>{selectedQuestion.title}</h3>
              {selectedQuestion.time_limit_sec && timeRemaining !== null && (
                <div style={{ color: timeRemaining < 10 ? "#d32f2f" : "#666", fontSize: "14px", fontWeight: "bold" }}>
                  ⏱ {timeRemaining}s
                </div>
              )}
            </div>
            <p>{selectedQuestion.prompt}</p>
            {selectedQuestion.max_attempts && submissions.has(selectedQuestion.id) && (
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                Attempts: {submissions.get(selectedQuestion.id)?.attempt_count || 1} / {selectedQuestion.max_attempts}
              </p>
            )}
            {!feedback ? (
              <>
                {selectedQuestion.type === "text" || selectedQuestion.type === "fill_blank" ? (
                  <textarea value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} placeholder="Your answer" style={{ width: "100%", minHeight: "100px", padding: "8px", marginBottom: "10px" }} />
                ) : selectedQuestion.type === "multiple_choice" && selectedQuestion.options ? (
                  <div style={{ marginBottom: "10px" }}>
                    {(selectedQuestion.options as any[]).map((opt, idx) => (
                      <label key={idx} style={{ display: "block", marginBottom: "8px" }}>
                        <input type="radio" name="mc" value={opt} checked={studentAnswer === opt} onChange={(e) => setStudentAnswer(e.target.value)} style={{ marginRight: "8px" }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : selectedQuestion.type === "image" ? (
                  <input type="file" accept="image/*" onChange={(e) => setStudentAnswer((e.target.files?.[0]?.name) ?? "")} style={{ display: "block", marginBottom: "10px" }} />
                ) : null}
                <button onClick={submitAnswer} disabled={submitting || !studentAnswer} style={{ padding: "10px 20px", backgroundColor: "#1e3a5f", color: "white", border: "none", cursor: "pointer", borderRadius: "4px", marginRight: "10px", opacity: submitting || !studentAnswer ? 0.6 : 1 }}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </>
            ) : (
              <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                {feedback.is_correct === true && <p style={{ color: "#2d5016" }}>✓ Correct!</p>}
                {feedback.is_correct === false && <p style={{ color: "#8b3a3a" }}>✗ Incorrect</p>}
                {feedback.is_correct === null && <p style={{ color: "#666" }}>Submitted for manual grading</p>}
                {feedback.score !== null && <p><strong>Score:</strong> {feedback.score}/{selectedQuestion.points || 1} pts</p>}
                {feedback.explanation && <p><strong>Explanation:</strong> {feedback.explanation}</p>}
              </div>
            )}
            <button onClick={() => setSelectedQuestion(null)} style={{ padding: "10px 20px", border: "1px solid #ccc", cursor: "pointer", borderRadius: "4px", marginTop: "20px" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
