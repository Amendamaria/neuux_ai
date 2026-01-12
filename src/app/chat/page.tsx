import ChatSidebar from "@/app/chat/_components/chat-sidebar"
import ChatWindow from "@/app/chat/_components/chat-window"

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <ChatWindow />
    </div>
  )
}
