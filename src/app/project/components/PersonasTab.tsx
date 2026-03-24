"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AiChat from "./AiChat";

type Props = {
  projectId: string;
  activePersonaId: string | null;
  setActivePersonaId: React.Dispatch<React.SetStateAction<string | null>>;
};

type Persona = {
  id: string;
  name: string;
  age: string;
  occupation: string;
  location: string;
  background: string;
  goals: string;
  pain_points: string;
  motivations: string;
  tech_usage: string;
  quote: string;
  created_at?: string;
};

export default function PersonasTab({
  projectId,
  activePersonaId,
  setActivePersonaId,
}: Props) {
  const supabase = createClient();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  /* ========================= */
  /*      FETCH PERSONAS       */
  /* ========================= */

  const fetchPersonas = useCallback(async () => {
    const { data } = await supabase
      .from("project_personas")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (data) {
      setPersonas(data);

      if (data.length > 0 && !activePersonaId) {
        setActivePersonaId(data[0].id);
      }
    }

    setLoading(false);
  }, [projectId, supabase, activePersonaId, setActivePersonaId]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  /* ========================= */
  /*    GENERATE PERSONA      */
  /* ========================= */

  const generatePersona = async () => {
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }), // ✅ Correct key
      });

      const result = await res.json();

      if (result.success) {
        await fetchPersonas();

        // Select newest persona
        const { data } = await supabase
          .from("project_personas")
          .select("id")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setActivePersonaId(data.id);
        }
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error("Persona generation failed:", error);
    }

    setGenerating(false);
  };

  if (loading) {
    return <div className="text-neutral-400">Loading personas...</div>;
  }

  return (
    <div className="space-y-8">

      {/* Header + Generate Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Personas</h2>

        <button
          onClick={generatePersona}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm disabled:opacity-50 transition"
        >
          {generating ? "Generating..." : "Generate Persona"}
        </button>
      </div>

      {/* Persona Grid */}
      {personas.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-neutral-400 text-sm">
          No personas generated yet. Click Generate Persona.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {personas.map((persona) => {
            const isActive = persona.id === activePersonaId;

            return (
              <div
                key={persona.id}
                onClick={() => setActivePersonaId(persona.id)}
                className={`cursor-pointer rounded-xl p-6 space-y-4 border transition
                  ${
                    isActive
                      ? "bg-primary/10 border-primary"
                      : "bg-neutral-900 border-neutral-800 hover:border-neutral-600"
                  }
                `}
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    {persona.name || "Unnamed Persona"}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {persona.age || "-"} • {persona.occupation || "-"} •{" "}
                    {persona.location || "-"}
                  </p>
                </div>

                <Section title="Background" value={persona.background} />
                <Section title="Goals" value={persona.goals} />
                <Section title="Pain Points" value={persona.pain_points} />
                <Section title="Motivations" value={persona.motivations} />
                <Section title="Tech Usage" value={persona.tech_usage} />

                {persona.quote && (
                  <p className="italic text-neutral-400 mt-2">
                    &ldquo;{persona.quote}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Chat for refinement */}
      <AiChat projectId={projectId} module="personas" />
    </div>
  );
}

function Section({
  title,
  value,
}: {
  title: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-sm text-neutral-300 whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}