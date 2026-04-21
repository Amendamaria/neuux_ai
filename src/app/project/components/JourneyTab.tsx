"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  projectId: string;
};

type Persona = {
  id: string;
  name: string;
};

type Stage = {
  name?: string;
  stage?: string;
  objectives?: string;
  needs?: string;
  feelings?: string;
  barriers?: string;
  [key: string]: string | number | null | undefined;
};

type JourneyMap = {
  stages: Stage[];
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type DBChatMessage = {
  role: "user" | "assistant";
  message: string;
};

export default function JourneyTab({ projectId }: Props) {

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>("");

  const [journey, setJourney] = useState<JourneyMap | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /* ========================= */
  /* Load Personas             */
  /* ========================= */

  useEffect(() => {
    async function loadPersonas() {
      try {
        const res = await fetch(`/api/personas?projectId=${projectId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setPersonas(data.data);

          if (data.data.length > 0) {
            setSelectedPersona(data.data[0].id);
          }
        }

      } catch (error) {
        console.error("Failed to load personas", error);
      }
    }

    loadPersonas();
  }, [projectId]);

  /* ========================= */
  /* Load Journey Map          */
  /* ========================= */

  useEffect(() => {
    async function fetchJourney() {
      if (!selectedPersona) return;

      try {
        const res = await fetch(
          `/api/journey-map?projectId=${projectId}&personaId=${selectedPersona}`
        );

        const data = await res.json();

        if (data.success && data.data) {
          setJourney(data.data);

          if (data.data.stages?.length > 0) {
            setColumns(Object.keys(data.data.stages[0]));
          }

        } else {
          setJourney(null);
        }

      } catch (error) {
        console.error("Failed to load journey map", error);
      }
    }

    fetchJourney();
  }, [projectId, selectedPersona]);

  /* ========================= */
  /* ✅ FINAL CHAT LOAD FIX     */
  /* ========================= */

  useEffect(() => {
    if (!projectId || !selectedPersona) return;

    let isMounted = true;

    async function loadChat() {
      try {
        const res = await fetch(
          `/api/ai/journey-map-chat?projectId=${projectId}&personaId=${selectedPersona}`
        );

        const data: { success: boolean; data: DBChatMessage[] } = await res.json();

        if (isMounted && data.success) {
          setChat(
            data.data.map((msg) => ({
              role: msg.role,
              text: msg.message,
            }))
          );
        }

      } catch (error) {
        console.error("Failed to load chat", error);
      }
    }

    loadChat();

    return () => {
      isMounted = false;
    };
  }, [projectId, selectedPersona]);

  /* ========================= */
  /* Auto Scroll               */
  /* ========================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* ========================= */
  /* Generate Journey Map      */
  /* ========================= */

  async function generate() {
    if (!selectedPersona) return;

    setLoading(true);

    try {
      const res = await fetch("/api/ai/journey-map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          personaId: selectedPersona
        })
      });

      const data = await res.json();

      if (data.success) {
        setJourney(data.data);

        if (data.data.stages?.length > 0) {
          setColumns(Object.keys(data.data.stages[0]));
        }
      }

    } catch (error) {
      console.error("Journey generation failed", error);
    }

    setLoading(false);
  }

  /* ========================= */
  /* Chat Send                 */
  /* ========================= */

  async function send() {

    if (!message.trim() || !journey || !selectedPersona || isSending) return;

    setIsSending(true);

    const userMsg = message;

    setChat((c) => [...c, { role: "user", text: userMsg }]);
    setMessage("");

    try {

      const res = await fetch("/api/ai/journey-map-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          personaId: selectedPersona,
          message: userMsg,
          journeyMap: journey
        })
      });

      const data = await res.json();

      if (data.type === "update") {

        setJourney(data.data);

        if (data.data.stages?.length > 0) {
          setColumns(Object.keys(data.data.stages[0]));
        }

        setChat((c) => [
          ...c,
          { role: "assistant", text: "Journey map updated." }
        ]);

      } else {

        setChat((c) => [
          ...c,
          { role: "assistant", text: data.message || "AI responded." }
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">User Journey Map</h2>

        <button
          onClick={generate}
          className="px-4 py-2 bg-primary rounded-lg text-sm"
        >
          {loading ? "Generating..." : "Generate Journey Map"}
        </button>
      </div>

      <div className="max-w-sm">
        <label className="text-sm text-neutral-400 mb-1 block">
          Select Persona
        </label>

        <select
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {journey?.stages && (
        <div className="overflow-x-auto">
          <table className="w-full border border-neutral-800 text-sm">
            <thead>
              <tr className="bg-neutral-900">
                {columns.map((col) => (
                  <th key={col} className="p-3 border border-neutral-800 capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {journey.stages.map((stage, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="p-3 border border-neutral-800">
                      {stage[col] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 overflow-hidden">

        <div className="px-4 py-3 border-b border-neutral-800">
          💬 Journey Assistant
        </div>

        <div className="p-6 space-y-4 max-h-87.5 overflow-y-auto">

          {chat.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-xl text-sm ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-neutral-800 text-neutral-200"
                }`}
              >
                {m.text}
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

        <div className="border-t border-neutral-800 p-4 flex gap-3">

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Modify the journey map..."
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