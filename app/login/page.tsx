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
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center", border: "2px solid #1e3a5f", padding: "20px", borderRadius: "8px", backgroundColor: "white" }}>
      <h1 style={{ fontFamily: "serif", color: "#1e3a5f" }}>Homework Tracker</h1>
      <button onClick={handleLogin} style={{ width: "100%", padding: "10px", fontSize: "16px", backgroundColor: "#1e3a5f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Sign in with Google
      </button>
    </div>
  );
}
