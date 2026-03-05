"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {

  const router = useRouter();

  useEffect(() => {

    const handleAuth = async () => {

      const supabase = createClient();

      // get session from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // OAuth login (Google)
        router.replace("/dashboard");
        return;
      }

      // Email confirmation flow
      await supabase.auth.signOut();

      router.replace("/auth/login");

    };

    handleAuth();

  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Verifying authentication...
    </div>
  );
}