"use client";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Question } from "@/lib/types";

const chapters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function InstructorPage() {
  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [chapter, setChapter] = useState(1);
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadQuestions(); }, []);

  const loadQuestions = async () => {
    const { data } = await supabase.from("questions_public").select("*").order("chapter");
    if (data) setQuestions(data as Question[]);
  };

  const createQuestion = async () => {
    if (!title || !prompt || !answer) return;
    setCreating(true);
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, prompt, correct_answer: answer, explanation,
        chapter, type, difficulty,
        options: type === "multiple_choice" ? options.split("\n").filter(Boolean) : null,
      }),
    });
    setTitle(""); setPrompt(""); setAnswer(""); setExplanation(""); setOptions("");
    setCreating(false);
    loadQuestions();
  };

  return (
    <div>
      <div className="page-header">
        <h1><span className="logo-mark">HW</span> Instructor View</h1>
        <div className="page-header-nav">
          <Link href="/analytics" className="btn btn-ghost-navy" style={{ padding: "8px 16px", fontSize: "14px" }}>Analytics</Link>
          <Link href="/student" className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "14px" }}>Student View →</Link>
        </div>
      </div>

      <div className="container">
        <div style={{ marginBottom: "40px" }}>
          <h2>Create Question</h2>
          <div className="card" style={{ padding: "24px" }}>
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input type="text" placeholder="e.g., Journal Entry Practice" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Chapter</label>
                <select value={chapter} onChange={e => setChapter(parseInt(e.target.value))}>
                  {chapters.map(ch => <option key={ch} value={ch}>Chapter {ch}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Prompt</label>
              <textarea placeholder="What do you want students to answer?" value={prompt} onChange={e => setPrompt(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Correct Answer</label>
              <textarea placeholder="Debit Cash 1000, Credit Revenue 1000" value={answer} onChange={e => setAnswer(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Explanation (Optional)</label>
              <textarea placeholder="Why is this the correct answer?" value={explanation} onChange={e => setExplanation(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Question Type</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="text">Text Answer</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="fill_blank">Fill in the Blank</option>
                </select>
              </div>
            </div>
            {type === "multiple_choice" && (
              <div className="form-group">
                <label>Options (one per line)</label>
                <textarea placeholder="Option A&#10;Option B&#10;Option C" value={options} onChange={e => setOptions(e.target.value)} />
              </div>
            )}
            <button onClick={createQuestion} disabled={creating} className="btn btn-primary" style={{ marginTop: "16px" }}>
              {creating ? "Creating..." : "Create Question"}
            </button>
          </div>
        </div>

        <div>
          <h2>All Questions ({questions.length})</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            {questions.map(q => (
              <div key={q.id} className="question-card" style={{ borderLeftColor: "var(--navy)" }}>
                <div className="question-title">{q.title}</div>
                <p style={{ margin: "8px 0", color: "var(--text)", fontSize: "14px" }}>{q.prompt}</p>
                <div className="question-meta">
                  <span className="badge badge-chapter">Ch {q.chapter}</span>
                  <span className={`badge badge-difficulty-${q.difficulty || "medium"}`}>{(q.difficulty || "medium").toUpperCase()}</span>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p style={{ color: "var(--text-muted)" }}>No questions yet. Create one above.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
