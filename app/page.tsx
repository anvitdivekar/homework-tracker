"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.push(session ? "/dashboard" : "/login");
    });
  }, [router, supabase]);

  return <div>Loading...</div>;
}
