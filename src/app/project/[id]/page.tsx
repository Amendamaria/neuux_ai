"use client";

import { use, useState } from "react";

import OverviewTab from "../components/OverviewTab";
import PersonasTab from "../components/PersonasTab";
import JourneyTab from "../components/JourneyTab";
import UserFlowTab from "../components/UserFlowTab";
import WireframeTab from "../components/WireframeTab";
import DesignSystemTab from "../components/DesignSystemTab";

type TabType =
  | "overview"
  | "personas"
  | "journey"
  | "userflow"
  | "wireframe"
  | "design-system";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

  const tabs: TabType[] = [
    "overview",
    "personas",
    "journey",
    "userflow",
    "wireframe",
    "design-system",
  ];

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      {/* Sidebar */}

      <aside className="w-64 border-r border-neutral-800 p-6 fixed left-0 top-0 h-screen bg-neutral-950">
        <h2 className="text-lg font-semibold mb-8">Project Workspace</h2>

        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-3 rounded-lg text-sm capitalize transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {tab === "userflow" ? "User Flow" : tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}

      <main className="ml-64 flex-1 p-10 space-y-8">
        {activeTab === "overview" && <OverviewTab projectId={projectId} />}

        {activeTab === "personas" && (
          <PersonasTab
            projectId={projectId}
            activePersonaId={activePersonaId}
            setActivePersonaId={setActivePersonaId}
          />
        )}

        {activeTab === "journey" && <JourneyTab projectId={projectId} />}

        {activeTab === "userflow" && <UserFlowTab projectId={projectId} />}

        {activeTab === "wireframe" && <WireframeTab projectId={projectId} />}

        {activeTab === "design-system" && (
          <DesignSystemTab projectId={projectId} />
        )}
      </main>
    </div>
  );
}
