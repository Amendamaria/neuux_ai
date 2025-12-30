"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FcGoogle } from "react-icons/fc";
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      localStorage.setItem("user", JSON.stringify({ email, isAuthenticated: true }))
      router.push("/chat")
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar showLogin={false} />

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-teal-600/40 rounded-3xl p-8 bg-gradient-to-b from-teal-900/30 to-transparent space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Ready To Build?</h1>
            <p className="text-gray-400">Sign in to your account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Input
                type="email"
                placeholder="Email:"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
                required
              />
            </div>

            <div className="relative">
              <Input
                type="password"
                placeholder="Password:"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full py-3 font-semibold flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>

          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500">OR</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              localStorage.setItem("user", JSON.stringify({ email: "user@google.com", isAuthenticated: true }))
              router.push("/chat")
            }}
            className="w-full bg-transparent border border-teal-600/30 hover:bg-teal-900/20 text-white rounded-full py-3 flex items-center justify-center gap-2"
          >
            <FcGoogle />
            Continue with Google
          </Button>

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
