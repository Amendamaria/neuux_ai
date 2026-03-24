"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  projectId: string;
  module: string; // "overview" | "personas" 
  onUpdate?: () => void | Promise<void>;
};

export default function AiChat({ projectId, module, onUpdate }: Props) {
  const supabase = createClient();

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ================= FETCH CHAT HISTORY =================

  useEffect(() => {
    const fetchChat = async () => {
      const { data, error } = await supabase
        .from("project_chat")
        .select("*")
        .eq("project_id", projectId)
        .eq("module", module)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setChat(
          data.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }
    };

    if (projectId && module) {
      fetchChat();
    }
  }, [projectId, module, supabase]);

  // ================= AUTO SCROLL =================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ================= SEND MESSAGE =================

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setInput("");
    setIsSending(true);

    // Save user message
    await supabase.from("project_chat").insert({
      project_id: projectId,
      module,
      role: "user",
      content: trimmed,
    });

    setChat((prev) => [...prev, { role: "user", content: trimmed }]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          activeTab: module,
          message: trimmed,
        }),
      });

      const result = await response.json();

      const assistantMessage = result.success
        ? result.message
        : result.error || "Something went wrong.";

      // Save assistant message
      await supabase.from("project_chat").insert({
        project_id: projectId,
        module,
        role: "assistant",
        content: assistantMessage,
      });

      setChat((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);

      // 🔥 Refresh parent component (OverviewTab)
      if (result.success && onUpdate) {
        await onUpdate();
      }

    } catch {
      const errorMessage = "Network error. Please try again.";

      setChat((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage },
      ]);
    }

    setIsSending(false);
  };

  return (
    <div className="mt-8 border border-neutral-800 rounded-2xl bg-neutral-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-800">
        <h3 className="text-sm font-semibold">
          💬 {module.charAt(0).toUpperCase() + module.slice(1)} Assistant
        </h3>
      </div>

      {/* Messages */}
      <div className="max-h-72 overflow-y-auto p-6 space-y-4">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-white"
                  : "bg-neutral-800 text-neutral-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="text-sm text-neutral-400">
            AI is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-800 p-4 flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={`Ask AI about ${module}...`}
          rows={1}
          className="flex-1 resize-none bg-neutral-800 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          onClick={sendMessage}
          disabled={isSending}
          className="bg-primary hover:bg-primary/60 px-6 py-3 rounded-xl text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}