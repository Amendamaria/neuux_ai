"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AiChat from "./AiChat";

type Props = {
  projectId: string;
};

type Overview = {
  summary: string;
  problem_statement: string;
  ux_objectives: string;
  success_metrics: string;
};

export default function OverviewTab({ projectId }: Props) {
  const supabase = createClient();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    const { data } = await supabase
      .from("project_overview")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (data) {
      setOverview(data);
    }

    setLoading(false);
  }, [projectId, supabase]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="text-neutral-400 text-sm">
        Loading overview...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <Section title="Summary" value={overview?.summary} />

      <Section
        title="Problem Statement"
        value={overview?.problem_statement}
      />

      <Section
        title="UX Objectives"
        value={overview?.ux_objectives}
      />

      <Section
        title="Success Metrics"
        value={overview?.success_metrics}
      />

      {/* AI Assistant */}
      <AiChat
        projectId={projectId}
        module="overview"
        onUpdate={fetchOverview}
      />

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
  if (!value) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-2">{title}</h3>

        <p className="text-neutral-500 text-sm">
          No content yet. Use the AI assistant below to generate.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">

      <h3 className="text-sm font-semibold mb-2">
        {title}
      </h3>

      <p className="text-sm text-neutral-300 whitespace-pre-wrap">
        {value}
      </p>

    </div>
  );
}