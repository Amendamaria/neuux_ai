"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth/login");
        return;
      }

      router.replace("/chat");
    };

    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Signing you in...
    </div>
  );
}