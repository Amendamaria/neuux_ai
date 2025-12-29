"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      // Store auth state in localStorage
      localStorage.setItem("user", JSON.stringify({ email, isAuthenticated: true }))
      router.push("/chat")
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950">
      <Navbar showLogin={false} />

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-teal-600/40 rounded-3xl p-8 bg-gradient-to-b from-teal-900/30 to-transparent space-y-8">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Ready To Build?</h1>
            <p className="text-gray-400">Sign in to your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                placeholder="Email:"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type="password"
                placeholder="Password:"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full py-3 font-semibold flex items-center justify-end gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-950 text-gray-500">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            onClick={() => {
              localStorage.setItem("user", JSON.stringify({ email: "user@google.com", isAuthenticated: true }))
              router.push("/chat")
            }}
            className="w-full bg-transparent border border-teal-600/30 hover:bg-teal-900/20 text-white rounded-full py-3 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#4285F4"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                SignUp
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
