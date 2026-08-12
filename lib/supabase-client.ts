import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mpamrvxvqjeppkunhwbh.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wYW1ydnh2cWplcHBrdW5od2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMjQzMDQsImV4cCI6MjEwMTkwMDMwNH0.5gX0HUznZuEQTu5N-N_YgUI6WptCa0oHW9bYxUuavFc";
  return createBrowserClient(url, key);
}
