"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  projectId: string;
};

type Section =
  | string
  | {
      name?: string;
      components?: string[];
      [key: string]: unknown;
    };

type Screen = {
  name: string;
  sections: Section[];
};

type WireframeData = {
  screens: Screen[];
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function WireframeTab({ projectId }: Props) {

  const [wireframes, setWireframes] = useState<WireframeData | null>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ SAFE ADDITIONS
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /* ============================= */
  /* Fetch Saved Wireframes        */
  /* ============================= */

  useEffect(() => {

    async function fetchWireframes() {

      try {

        const res = await fetch(`/api/wireframe?projectId=${projectId}`);

        if (!res.ok) return;

        const data = await res.json();

        if (data.success && data.data) {
          setWireframes(data.data);
        }

      } catch (error) {
        console.error("Failed to load wireframes:", error);
      }

    }

    if (projectId) fetchWireframes();

  }, [projectId]);

  /* ============================= */
  /* Fetch Chat History            */
  /* ============================= */

  useEffect(() => {

    async function fetchChat() {

      try {

        const res = await fetch(`/api/ai/wireframe-chat?projectId=${projectId}`);

        if (!res.ok) return;

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {

          const formatted = data.data.map(
            (m: { role: "user" | "assistant"; message: string }) => ({
              role: m.role,
              text: m.message
            })
          );

          setChat(formatted);

        }

      } catch (error) {
        console.error("Failed to load chat history:", error);
      }

    }

    if (projectId) fetchChat();

  }, [projectId]);

  /* ============================= */
  /* ✅ AUTO SCROLL                */
  /* ============================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* ============================= */
  /* Generate Wireframes           */
  /* ============================= */

  async function generate() {

    setLoading(true);

    try {

      const res = await fetch("/api/ai/wireframe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ projectId })
      });

      const data = await res.json();

      if (data.success) {
        setWireframes(data.data);
      }

    } catch (error) {
      console.error("Wireframe generation failed:", error);
    }

    setLoading(false);
  }

  /* ============================= */
  /* ✅ CHAT (ONLY ENHANCED)       */
  /* ============================= */

  async function send() {

    if (!message.trim() || !wireframes || isSending) return;

    const userMsg = message;

    setIsSending(true);

    setChat((c) => [...c, { role: "user", text: userMsg }]);

    setMessage("");

    try {

      const res = await fetch("/api/ai/wireframe-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          message: userMsg,
          wireframes
        })
      });

      const data = await res.json();

      if (data.type === "update") {

        setWireframes(data.data);

        setChat((c) => [
          ...c,
          { role: "assistant", text: "Wireframe updated successfully." }
        ]);

      } else {

        setChat((c) => [
          ...c,
          { role: "assistant", text: data.message }
        ]);

      }

    } catch {
      setChat((c) => [
        ...c,
        { role: "assistant", text: "Network error. Try again." }
      ]);
    }

    setIsSending(false);
  }

  /* ============================= */
  /* Enter Key Send                */
  /* ============================= */

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }

  }

  /* ============================= */
  /* Safe Section Renderer         */
  /* ============================= */

  function renderSection(section: Section) {

    if (typeof section === "string") return section;

    if (section?.name) return section.name;

    if (Array.isArray(section?.components)) {
      return section.components.join(", ");
    }

    return JSON.stringify(section);

  }

  /* ============================= */
  /* UI (UNCHANGED)                */
  /* ============================= */

  return (

    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <h2 className="text-lg font-semibold">
          AI Wireframes
        </h2>

        <button
          onClick={generate}
          className="px-4 py-2 bg-primary rounded-lg text-sm"
        >
          {loading ? "Generating..." : "Generate Wireframes"}
        </button>

      </div>

      {wireframes && Array.isArray(wireframes.screens) && (

        <div className="grid md:grid-cols-2 gap-6">

          {wireframes.screens.map((screen, i) => (

            <div
              key={i}
              className="border border-neutral-800 rounded-xl p-4 space-y-3"
            >

              <h3 className="font-medium">
                {screen.name}
              </h3>

              <div className="space-y-2">

                {screen.sections?.map((section, j) => (

                  <div
                    key={j}
                    className="border border-neutral-700 rounded-md p-3 text-sm bg-neutral-900"
                  >
                    {renderSection(section)}
                  </div>

                ))}

              </div>

            </div>

          ))}

        </div>

      )}

      <div className="rounded-xl border border-neutral-800 overflow-hidden">

        <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
          <span>💬</span>
          <span className="font-medium">
            Wireframe Assistant
          </span>
        </div>

        <div className="p-6 space-y-4 max-h-87.5 overflow-y-auto">

          {chat.map((m, i) => (

            <div
              key={i}
              className={`flex ${
                m.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`max-w-[70%] px-4 py-3 rounded-xl text-sm ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-neutral-800 text-neutral-200"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {m.text}
                </div>
              </div>

            </div>

          ))}

          {/* ✅ NEW */}
          {isSending && (
            <div className="text-sm text-neutral-400">
              AI is thinking...
            </div>
          )}

          <div ref={chatEndRef} />

        </div>

        <div className="border-t border-neutral-800 p-4 flex gap-3">

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Modify the wireframe..."
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm resize-none"
          />

          <button
            onClick={send}
            disabled={isSending}
            className="px-6 py-2 bg-primary rounded-lg text-sm disabled:opacity-50"
          >
            Send
          </button>

        </div>

      </div>

    </div>

  );
}