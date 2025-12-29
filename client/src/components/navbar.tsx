"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

interface NavbarProps {
  showLogin: boolean
}

export default function Navbar({ showLogin }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <nav className="border-b border-teal-600/20 bg-neutral-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        >
          <span className="text-2xl font-bold text-white">
            Neu<span className="text-cyan-400">UX</span> <span className="text-xs text-gray-400">ai</span>
          </span>
        </button>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => router.push("/")} className="text-gray-300 hover:text-white transition">
            Home
          </button>
          <a href="#" className="text-gray-300 hover:text-white transition">
            Features
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition">
            How It Works
          </a>
          <button onClick={() => router.push("/pricing")} className="text-gray-300 hover:text-white transition">
            Pricing
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {showLogin ? (
            <Button
              onClick={() => router.push("/login")}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 py-2"
            >
              Login
            </Button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 rounded-full p-2 text-white transition"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
