"use client";

import { useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

type Props = {
  projectId: string;
};

type FlowNode = {
  id: string;
  label: string;
};

type FlowEdge = {
  from: string;
  to: string;
};

type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function UserFlowTab({ projectId }: Props) {

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [flow, setFlow] = useState<FlowData | null>(null);

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(false);

  /* ========================= */
  /* Convert AI Flow           */
  /* ========================= */

 function convertFlow(flowData: FlowData) {

  if (!flowData?.nodes || !flowData?.edges) return;

  const rfNodes: Node[] = flowData.nodes.map((n, i) => ({
    id: n.id,
    data: { label: n.label },
    position: { x: 200 * i, y: 120 * i },
  }));

  const rfEdges: Edge[] = flowData.edges.map((e, i) => ({
    id: "e" + i,
    source: e.from,
    target: e.to,
  }));

  setNodes(rfNodes);
  setEdges(rfEdges);
}

  /* ========================= */
  /* Load saved flow           */
  /* ========================= */

  useEffect(() => {

    async function fetchFlow() {

      try {

        const res = await fetch(`/api/userflow?projectId=${projectId}`);
        const data = await res.json();

        if (data.success && data.data) {

          const savedFlow: FlowData = data.data;

          setFlow(savedFlow);
          convertFlow(savedFlow);

        }

      } catch (err) {
        console.error("Failed to load saved flow", err);
      }

    }

    if (projectId) fetchFlow();

  }, [projectId]);

  /* ========================= */
  /* Load Chat History         */
  /* ========================= */

 /* ========================= */
/* Load Chat History         */
/* ========================= */

useEffect(() => {

  async function fetchChat() {

    try {

      const res = await fetch(
        `/api/userflow?projectId=${projectId}`
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

    } catch (err) {
      console.error("Failed to load chat history", err);
    }

  }

  if (projectId) fetchChat();

}, [projectId]);
  /* ========================= */
  /* Generate Flow             */
  /* ========================= */

  async function generateFlow() {

    setLoading(true);

    try {

      const res = await fetch("/api/ai/userflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (data.success) {

        const generatedFlow: FlowData = data.data;

        setFlow(generatedFlow);
        convertFlow(generatedFlow);

      }

    } catch (err) {
      console.error("Flow generation failed", err);
    }

    setLoading(false);
  }

  /* ========================= */
  /* Chat                      */
  /* ========================= */

  async function sendMessage() {

    if (!message.trim() || !flow) return;

    const userMsg = message;

    setChat((c) => [...c, { role: "user", text: userMsg }]);
    setMessage("");

    try {

      const res = await fetch("/api/ai/userflow-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          message: userMsg,
          flow,
        }),
      });

      const data = await res.json();

      if (data.type === "update") {

        const updatedFlow: FlowData = data.data;

        setFlow(updatedFlow);
        convertFlow(updatedFlow);

        setChat((c) => [
          ...c,
          { role: "assistant", text: "Flow updated." },
        ]);

      } else {

        setChat((c) => [
          ...c,
          { role: "assistant", text: data.message },
        ]);

      }

    } catch (err) {
      console.error("Chat failed", err);
    }

  }

  /* ========================= */
  /* Enter / Shift+Enter       */
  /* ========================= */

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }

  }

  /* ========================= */
  /* UI                        */
  /* ========================= */

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <h2 className="text-lg font-semibold">
          UI User Flow
        </h2>

        <button
          onClick={generateFlow}
          className="px-4 py-2 bg-blue-600 rounded-lg text-sm"
        >
          {loading ? "Generating..." : "Generate Flow"}
        </button>

      </div>

      {/* Flow Diagram */}

      <div className="h-125 border border-neutral-800 rounded-xl overflow-hidden">

        <ReactFlow nodes={nodes} edges={edges} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>

      </div>

      {/* Chat Assistant */}

      <div className="rounded-xl border border-neutral-800 overflow-hidden">

        <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
          <span>💬</span>
          <span className="font-medium">
            User Flow Assistant
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
            placeholder="Ask or modify the flow..."
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm resize-none"
          />

          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-blue-600 rounded-lg text-sm"
          >
            Send
          </button>

        </div>

      </div>

    </div>

  );
}