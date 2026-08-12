import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || "https://ukjftxaqrttxyjhwokct.supabase.co";
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVramZ0eGFxcnR0eHlqaHdva2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNDE0NzIsImV4cCI6MjA5NzkxNzQ3Mn0.VSnoe0SdfuesiQTHXZVAz8-RTkEXnEIYCV3Jk0hTvds";
  return createBrowserClient(url, key);
}
