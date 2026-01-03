"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ChatSidebar from "@/app/chat/_components/chat-sidebar"
import ChatWindow from "@/app/chat/_components/chat-window"

interface User {
  email: string
  name?: string
  isAuthenticated: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    } else {
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div className="bg-neutral-950 h-screen flex items-center justify-center text-white">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar user={user} />
      <ChatWindow user={user} />
    </div>
  )
}
