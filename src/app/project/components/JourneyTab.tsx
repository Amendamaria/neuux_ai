"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ✅ Stable Supabase client (outside component) */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Stage = {
  stage: string;
  user_actions: string[];
  user_thoughts: string[];
  pain_points: string[];
  opportunities: string[];
};

type Journey = {
  stages: Stage[];
};

type Persona = {
  id: string;
  name: string;
};

interface Props {
  projectId: string;
}

export default function JourneyTab({ projectId }: Props) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(false);

  /* ========================= */
  /*        Fetch Personas     */
  /* ========================= */

  useEffect(() => {
    const fetchPersonas = async () => {
      const { data, error } = await supabase
        .from("project_personas")
        .select("id, name")
        .eq("project_id", projectId);

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setPersonas(data);
        if (data.length > 0) {
          setSelectedPersona(data[0].id);
        }
      }
    };

    fetchPersonas();
  }, [projectId]);

  /* ========================= */
  /*        Fetch Journey      */
  /* ========================= */

  useEffect(() => {
    if (!selectedPersona) return;

    const fetchJourney = async () => {
      const { data, error } = await supabase
        .from("project_journey_maps")
        .select("journey_data")
        .eq("project_id", projectId)
        .eq("persona_id", selectedPersona)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      if (data?.journey_data) {
        setJourney(data.journey_data);
      } else {
        setJourney(null);
      }
    };

    fetchJourney();
  }, [selectedPersona, projectId]);

  /* ========================= */
  /*      Generate Journey     */
  /* ========================= */

  const generateJourney = async () => {
    if (!selectedPersona) return;

    setLoading(true);

    const res = await fetch("/api/ai/journey-map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        personaId: selectedPersona,
      }),
    });

    const result = await res.json();

    if (result.success && result.data) {
      setJourney(result.data);
    } else {
      alert("Journey generation failed");
    }

    setLoading(false);
  };

  /* ========================= */
  /*            UI             */
  /* ========================= */

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Journey Map</h2>

        <button
          onClick={generateJourney}
          disabled={loading || !selectedPersona}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
        >
          {loading ? "Generating..." : "Generate Journey"}
        </button>
      </div>

      {/* Persona Dropdown */}
      {personas.length > 0 && (
        <select
          value={selectedPersona || ""}
          onChange={(e) => setSelectedPersona(e.target.value)}
          className="mb-6 bg-gray-800 border border-gray-700 p-2 rounded-lg"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Empty State */}
      {!journey && (
        <p className="text-gray-400">
          No journey map found. Click Generate Journey.
        </p>
      )}

      {/* Journey Display */}
      {journey && journey.stages && (
        <div className="space-y-8">
          {journey.stages.map((stage, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 p-6 rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-4">
                {stage.stage}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">

                <div>
                  <h4 className="font-medium mb-2 text-blue-400">
                    User Actions
                  </h4>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {stage.user_actions?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-purple-400">
                    User Thoughts
                  </h4>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {stage.user_thoughts?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-red-400">
                    Pain Points
                  </h4>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {stage.pain_points?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-green-400">
                    Opportunities
                  </h4>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {stage.opportunities?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}