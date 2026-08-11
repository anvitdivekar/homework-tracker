"use client";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
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
          <p style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            margin: "0",
          }}>Sign in to access your assignments</p>
        </div>

        <button
          onClick={handleLogin}
          className="btn-primary"
          style={{
            width: "100%",
            marginBottom: "16px",
          }}
        >
          Sign in with Google
        </button>

        <p style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          textAlign: "center",
          margin: "0",
        }}>
          Instructor access only. Use your school email to sign in.
        </p>
      </div>
    </div>
  );
}
