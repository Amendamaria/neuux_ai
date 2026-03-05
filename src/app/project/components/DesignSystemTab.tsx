"use client";

import { useState, useEffect } from "react";

type Props = {
  projectId: string;
};

type Colors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
};

type TypographyValue = string | Record<string, unknown>;

type Typography = {
  font_family: string;
  headings: TypographyValue;
  body: TypographyValue;
};

type Spacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

type ComponentItem =
  | string
  | {
      name: string;
      properties?: Record<string, string>;
    };

type DesignSystem = {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  components: ComponentItem[];
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function DesignSystemTab({ projectId }: Props) {

  const [system, setSystem] = useState<DesignSystem | null>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  /* ============================= */
  /* Fetch saved design system     */
  /* ============================= */

  useEffect(() => {

    async function fetchSystem() {

      try {

        const res = await fetch(`/api/design-system?projectId=${projectId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setSystem(data.data as DesignSystem);
        }

      } catch (error) {
        console.error("Failed to load design system:", error);
      }

    }

    if (projectId) {
      fetchSystem();
    }

  }, [projectId]);



  /* ============================= */
  /* Load Chat History             */
  /* ============================= */

  useEffect(() => {

    async function fetchChat() {

      try {

        const res = await fetch(
          `/api/ai/design-system-chat?projectId=${projectId}`
        );

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
  /* Generate Design System        */
  /* ============================= */

  async function generate() {

    setLoading(true);

    try {

      const res = await fetch("/api/ai/design-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ projectId })
      });

      const data = await res.json();

      if (data.success) {
        setSystem(data.data as DesignSystem);
      }

    } catch (error) {
      console.error("Design system generation failed", error);
    }

    setLoading(false);
  }



  /* ============================= */
  /* Chat Editing                  */
  /* ============================= */

  async function send() {

    if (!message.trim() || !system) return;

    const userMsg = message;

    setChat((c) => [...c, { role: "user", text: userMsg }]);

    setMessage("");

    try {

      const res = await fetch("/api/ai/design-system-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          message: userMsg,
          designSystem: system
        })
      });

      const data = await res.json();

      if (data.type === "update") {

        setSystem(data.data as DesignSystem);

        setChat((c) => [
          ...c,
          { role: "assistant", text: "Design system updated." }
        ]);

      } else {

        setChat((c) => [
          ...c,
          { role: "assistant", text: data.message }
        ]);

      }

    } catch (error) {
      console.error("Design system chat failed", error);
    }
  }



  /* ============================= */
  /* Enter / Shift+Enter           */
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
  /* Safe recursive renderer       */
  /* ============================= */

  function renderValue(value: unknown): React.ReactNode {

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (typeof value === "object" && value !== null) {

      return Object.entries(value).map(([key, val]) => (
        <div key={key} className="text-sm">
          <span className="text-neutral-400">{key}:</span>{" "}
          {renderValue(val)}
        </div>
      ));

    }

    return null;
  }



  /* ============================= */
  /* UI                            */
  /* ============================= */

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex justify-between items-center">

        <h2 className="text-lg font-semibold">
          AI Design System
        </h2>

        <button
          onClick={generate}
          className="px-4 py-2 bg-blue-600 rounded-lg text-sm"
        >
          {loading ? "Generating..." : "Generate Design System"}
        </button>

      </div>



      {/* Design System */}

      {system && (

        <div className="grid md:grid-cols-2 gap-6">

          {/* Colors */}

          <div className="border border-neutral-800 rounded-xl p-4 space-y-3">

            <h3 className="font-medium">Colors</h3>

            {(Object.entries(system.colors) as [keyof Colors, string][]).map(
              ([key, value]) => (

                <div key={key} className="flex items-center gap-3">

                  <div
                    className="w-8 h-8 rounded"
                    style={{ background: value }}
                  />

                  <span className="text-sm">
                    {key} — {value}
                  </span>

                </div>

              )
            )}

          </div>



          {/* Typography */}

          <div className="border border-neutral-800 rounded-xl p-4 space-y-2">

            <h3 className="font-medium">Typography</h3>

            <div className="text-sm">
              Font Family: {system.typography.font_family}
            </div>

            <div className="text-sm">
              Headings: {renderValue(system.typography.headings)}
            </div>

            <div className="text-sm">
              Body: {renderValue(system.typography.body)}
            </div>

          </div>



          {/* Spacing */}

          <div className="border border-neutral-800 rounded-xl p-4 space-y-2">

            <h3 className="font-medium">Spacing</h3>

            {(Object.entries(system.spacing) as [keyof Spacing, string][]).map(
              ([key, value]) => (
                <p key={key} className="text-sm">
                  {key}: {value}
                </p>
              )
            )}

          </div>



          {/* Components */}

          <div className="border border-neutral-800 rounded-xl p-4 space-y-2">

            <h3 className="font-medium">Components</h3>

            <ul className="list-disc list-inside text-sm">

              {system.components.map((component, i) => {

                const label =
                  typeof component === "string"
                    ? component
                    : component?.name ?? "Component";

                return <li key={i}>{label}</li>;

              })}

            </ul>

          </div>

        </div>

      )}



      {/* Assistant Chat */}

      <div className="rounded-xl border border-neutral-800 overflow-hidden">

        <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
          <span>💬</span>
          <span className="font-medium">
            Design System Assistant
          </span>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">

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
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-200"
                }`}
              >
                {m.text}
              </div>

            </div>

          ))}

        </div>



        <div className="border-t border-neutral-800 p-4 flex gap-3">

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Modify design system..."
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm resize-none"
          />

          <button
            onClick={send}
            className="px-6 py-2 bg-blue-600 rounded-lg text-sm"
          >
            Send
          </button>

        </div>

      </div>

    </div>

  );

}