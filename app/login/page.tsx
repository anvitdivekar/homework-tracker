"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(26, 46, 74, 0.03) 35px, rgba(26, 46, 74, 0.03) 70px)",
      padding: "20px",
    }}>
      <div className="card" style={{ maxWidth: "480px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontSize: "48px",
            fontFamily: "'Playfair Display', serif",
            fontWeight: "700",
            color: "var(--navy)",
            marginBottom: "4px",
          }}>
            <span style={{ color: "var(--navy)" }}>H</span><span style={{ color: "var(--gold)" }}>W</span>
          </div>
          <h1 style={{
            fontSize: "32px",
            marginTop: "20px",
            marginBottom: "8px",
            color: "var(--navy)",
          }}>Accounting Homework</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "0" }}>
            Sign in to access your assignments
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
          {error && (
            <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          textAlign: "center",
          margin: "16px 0 0",
        }}>
          Instructor access only.
        </p>
      </div>
    </div>
  );
}
