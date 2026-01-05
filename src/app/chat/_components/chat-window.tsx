"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

interface User {
  email: string
  name?: string
  isAuthenticated: boolean
}

interface ChatWindowProps {
  user: User
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    localStorage.setItem("chatMessages", JSON.stringify(newMessages))
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Lorem ipsum dolor sit amet consectetur. Habitant eu bibendum amet quis duis tincidunt id. Posuere quam lorem erat mauris aliquet nec placerat. Odio rhoncus est praesent nec orci. Sit sit accumsan arcu sed eu ut. Sed non non purus cras diam commodo.",
        sender: "ai",
        timestamp: new Date(),
      }
      const updatedMessages = [...newMessages, aiMessage]
      setMessages(updatedMessages)
      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages))
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <p className="text-2xl font-semibold text-white">Hai There 👋</p>
            <h2 className="text-4xl font-bold">
              <span className="text-white">How Can I</span> <span className="text-cyan-400">Help?</span>
            </h2>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex gap-3 max-w-md lg:max-w-2xl ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {message.sender === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-red-500 shrink-0 flex items-center justify-center text-xs font-bold">
                      UX
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-4 ${
                      message.sender === "user" ? "bg-teal-900/50 text-white" : "bg-neutral-900 text-gray-300"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-cyan-500 shrink-0 flex items-center justify-center">
                      <span className="text-xs">👤</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500 shrink-0 flex items-center justify-center text-xs font-bold">
                    UX
                  </div>
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-teal-600/20 p-6">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your ideas..."
            className="flex-1 bg-neutral-900 border border-teal-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-lg p-3 text-white flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
