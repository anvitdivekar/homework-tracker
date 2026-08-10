"use client";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question, Submission, User } from "@/lib/types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [chapter, setChapter] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/login");
      return;
    }

    const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    const isTA = authUser.email === process.env.NEXT_PUBLIC_TA_EMAIL;
    if (data) {
    // Make sure the configured TA always gets the TA role
    if (isTA && data.role !== "ta") {
      const { data: updatedUser } = await supabase
        .from("users")
        .update({ role: "ta" })
        .eq("id", authUser.id)
        .select()
        .single();

      setUser(updatedUser);
    } else {
      setUser(data);
    }
  } else {
    const role = isTA ? "ta" : "student";

    const { data: newUser } = await supabase
      .from("users")
      .insert([
        {
          id: authUser.id,
          email: authUser.email,
          role,
        },
      ])
      .select()
      .single();

    setUser(newUser);
  }

    loadQuestions();
  };

  const loadQuestions = async () => {
    const { data } = await supabase.from("questions").select("*").order("chapter");
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
    await supabase.from("questions").insert([{ chapter, title, prompt, correct_answer: answer }]);
    setTitle("");
    setPrompt("");
    setAnswer("");
    loadQuestions();
  };

  const submitAnswer = async () => {
    if (!selectedQuestion || !studentAnswer) return;
    await supabase.from("submissions").upsert([
      { user_id: user!.id, question_id: selectedQuestion.id, answer: studentAnswer, submitted_at: new Date().toISOString() },
    ]);
    setStudentAnswer("");
    setSelectedQuestion(null);
    loadQuestions();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "2px solid #1e3a5f", paddingBottom: "10px" }}>
        <h1 style={{ fontFamily: "serif", color: "#1e3a5f" }}>Homework Tracker</h1>
        <div>
          <span style={{ marginRight: "20px" }}>{user.email} ({user.role})</span>
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
          <input placeholder="Correct Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }} />
          <select value={chapter} onChange={(e) => setChapter(parseInt(e.target.value))} style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>)}
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
                <small>Answer: {q.correct_answer}</small>
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
              return (
                <div key={q.id} style={{ padding: "10px", border: "1px solid #ccc", marginBottom: "10px", borderRadius: "4px", backgroundColor: submitted ? "#e8f5e9" : "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <strong>[Ch {q.chapter}] {q.title}</strong>
                      <p>{q.prompt}</p>
                    </div>
                    <div>
                      {submitted && <span style={{ color: "#2d5016", fontSize: "20px" }}>✓</span>}
                      <button onClick={() => setSelectedQuestion(q)} style={{ marginLeft: "10px", padding: "5px 10px", backgroundColor: "#1e3a5f", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
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
            <h3 style={{ fontFamily: "serif" }}>{selectedQuestion.title}</h3>
            <p>{selectedQuestion.prompt}</p>
            <textarea value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} placeholder="Your answer" style={{ width: "100%", minHeight: "100px", padding: "8px", marginBottom: "10px" }} />
            <button onClick={submitAnswer} style={{ padding: "10px 20px", backgroundColor: "#1e3a5f", color: "white", border: "none", cursor: "pointer", borderRadius: "4px", marginRight: "10px" }}>
              Submit
            </button>
            <button onClick={() => setSelectedQuestion(null)} style={{ padding: "10px 20px", border: "1px solid #ccc", cursor: "pointer", borderRadius: "4px" }}>
              Close
            </button>
            {submissions.has(selectedQuestion.id) && (
              <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                <strong>Correct Answer:</strong> {selectedQuestion.correct_answer}
                <p style={{ color: studentAnswer === selectedQuestion.correct_answer ? "#2d5016" : "#8b3a3a" }}>
                  {studentAnswer === selectedQuestion.correct_answer ? "✓ Correct" : "✗ Incorrect"}
                </p>
                {selectedQuestion.explanation && <p><strong>Explanation:</strong> {selectedQuestion.explanation}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
