"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare, Menu, X } from "lucide-react"
import UserMenu from "@/components/user-menu"

interface User {
  email: string
  name?: string
  isAuthenticated: boolean
}

interface ChatSidebarProps {
  user: User
}

export default function ChatSidebar({ user }: ChatSidebarProps) {
  const router = useRouter()
  const [chatHistory] = useState([
    { id: 1, title: "Lorem ipsum dolor sit amet eu consectetur" },
    { id: 2, title: "Lorem ipsum dolor sit amet eu consectetur" },
    { id: 3, title: "Lorem ipsum dolor sit amet eu consectetur" },
    { id: 4, title: "Lorem ipsum dolor sit amet eu consectetur" },
  ])
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/")} className="text-lg font-bold text-white hover:opacity-80 transition">
          Neu<span className="text-cyan-400">UX</span> <span className="text-xs text-gray-400">ai</span>
        </button>
        {isMobileOpen && (
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden">
            <X className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full py-2 mb-6">New Chat</Button>

      {/* Chat History */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        <p className="text-gray-400 text-sm font-semibold">Chat History</p>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent border border-teal-600/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>

        {/* History Items */}
        <div className="space-y-2">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-teal-900/30 transition text-left group"
            >
              <MessageSquare className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-300 line-clamp-2">{chat.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User Menu */}
      <UserMenu user={user} />
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-teal-600 p-2 rounded-lg"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-linear-to-b from-teal-950/50 to-neutral-950 border-r border-teal-600/20 flex-col p-6">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-64 bg-linear-to-b from-teal-950/50 to-neutral-950 border-r border-teal-600/20 flex flex-col p-6 h-full"
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
