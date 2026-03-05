"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {

  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const [userEmail, setUserEmail] = useState<string | null>(null);

  /* ========================= */
  /* Get User + Listen Changes */
  /* ========================= */

  useEffect(() => {

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, [supabase]);



  /* ========================= */
  /* Logout                    */
  /* ========================= */

  const handleLogout = async () => {

    await supabase.auth.signOut();

    router.push("/");

  };



  /* ========================= */
  /* Hide Navbar in App Pages  */
  /* ========================= */

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/project")
  ) {
    return null;
  }



  return (

    <nav className="border-b border-teal-600/20 backdrop-blur-sm bg-transparent">

      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* LOGO */}

        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="NeuUXAI Logo"
            width={110}
            height={28}
            className="object-contain"
            priority
          />
        </Link>



        {/* NAV LINKS */}

        <div className="hidden md:flex items-center gap-8">

          <Link href="/" className="hover:text-neuuxai transition">
            Home
          </Link>

          <Link href="/#features" className="hover:text-neuuxai transition">
            Features
          </Link>

          <Link href="/#how-it-works" className="hover:text-neuuxai transition">
            How It Works
          </Link>

          <Link href="/pricing" className="hover:text-neuuxai transition">
            Pricing
          </Link>

        </div>



        {/* AUTH */}

        <div className="flex items-center gap-4">

          {userEmail ? (
            <>
              <span className="text-sm text-neutral-300">
                {userEmail}
              </span>

              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm"
            >
              Login
            </Link>
          )}

        </div>

      </div>

    </nav>
  );
}