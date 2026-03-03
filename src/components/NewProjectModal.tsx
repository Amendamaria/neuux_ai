"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Overview = {
  summary: string;
  problem_statement: string;
  ux_objectives: string;
  success_metrics: string[];
};

type AIResponse = {
  success: boolean;
  type?: "full" | "partial";
  updatedOverview?: Overview;
  error?: string;
};

export default function NewProjectModal({ isOpen, onClose }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    target_users: "",
    goal: "",
  });

  if (!isOpen) return null;

  const handleCreateProject = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        setLoading(false);
        return;
      }

      // ================= Insert Project =================

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            user_id: user.id,
            name: form.name,
            description: form.description,
            target_users: form.target_users,
            goal: form.goal,
            ai_status: "pending",
          },
        ])
        .select()
        .single();

      if (error || !data) {
        console.error("Project Insert Error:", error);
        alert("Error creating project.");
        setLoading(false);
        return;
      }

      // ================= Generate Overview =================

      const aiResponse = await fetch("/api/ai/overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: data.id,
          feedback: "Generate full overview",
        }),
      });

      // 🔥 Read raw text first (important)
      const rawText = await aiResponse.text();

      let aiResult: AIResponse;

      try {
        aiResult = JSON.parse(rawText) as AIResponse;
      } catch {
  console.error("AI returned non-JSON:", rawText);
  alert("AI returned unexpected response.");
  setLoading(false);
  router.push(`/project/${data.id}`);
  return;
}

      console.log("AI Response:", aiResult);

      if (!aiResponse.ok || aiResult.success === false) {
        console.error("AI Generation Error:", aiResult);

        alert(
          aiResult.error ||
            "Project created, but AI generation failed."
        );

        setLoading(false);
        router.push(`/project/${data.id}`);
        return;
      }

      // ================= Success =================

      setLoading(false);
      onClose();
      router.push(`/project/${data.id}`);

    } catch (err) {
      console.error("Unexpected Error:", err);
      alert("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-8">

        <h2 className="text-xl font-semibold mb-6">
          Start New UX Project
        </h2>

        <div className="space-y-4">

          <input
            placeholder="Project Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white outline-none"
          />

          <textarea
            placeholder="Describe your product idea..."
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white outline-none"
          />

          <input
            placeholder="Who will use this?"
            value={form.target_users}
            onChange={(e) =>
              setForm({ ...form, target_users: e.target.value })
            }
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white outline-none"
          />

          <input
            placeholder="Main goal of the product"
            value={form.goal}
            onChange={(e) =>
              setForm({ ...form, goal: e.target.value })
            }
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateProject}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-white text-black font-medium hover:opacity-90 transition"
          >
            {loading
              ? "Generating Overview..."
              : "Generate UX Blueprint"}
          </button>
        </div>

      </div>
    </div>
  );
}