"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MessageSquare, Menu, X } from "lucide-react"

interface User {
  email: string
  name?: string
  isAuthenticated: boolean
}

interface ChatSidebarProps {
  user: User
}

export default function ChatSidebar() {
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
        <button
          onClick={() => router.push("/")}
          className="hover:opacity-80 transition"
        >
          <Image
            src="/Logo.svg"
            alt="NeuUX AI"
            width={110}
            height={28}
            priority
          />
        </button>

        {isMobileOpen && (
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden">
            <X className="w-6 h-6 text-foreground" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <Button className="w-full rounded-full mb-6">
        New Chat
      </Button>

      {/* Chat History */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        <p className="text-muted-foreground text-sm font-semibold">
          Chat History
        </p>

        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔍
          </span>
        </div>

        {/* History Items */}
        <div className="space-y-2">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition text-left"
            >
              <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm text-foreground line-clamp-2">
                {chat.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-background border-r border-border flex-col p-6">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-64 bg-background border-r border-border flex flex-col p-6 h-full"
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
