"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings } from "lucide-react"

interface User {
  email: string
  name?: string
  isAuthenticated: boolean
}

interface UserMenuProps {
  user: User
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("chatMessages")
    router.push("/")
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-teal-900/30 transition text-left"
      >
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
          {(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user.name || user.email}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-900 border border-teal-600/30 rounded-lg overflow-hidden z-50">
          <button
            onClick={() => {
              setIsOpen(false)
              // Add settings page later
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-teal-900/30 transition text-left text-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <div className="border-t border-teal-600/20"></div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 transition text-left text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
