"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft
} from "lucide-react";

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

export default function ProjectPage() {

  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

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

      {/* ================= Sidebar ================= */}

      <aside className="w-64 border-r border-neutral-800 p-4 fixed left-0 top-0 h-screen bg-neutral-950 flex flex-col">

        {/* 🔙 Back to Dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold mb-6 px-2">
          Project Workspace
        </h2>

        {/* Tabs */}
        <nav className="flex flex-col gap-2">

          {tabs.map((tab) => (

            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-3 rounded-lg text-sm capitalize transition ${
                activeTab === tab
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {tab === "userflow"
                ? "User Flow"
                : tab === "design-system"
                ? "Design System"
                : tab}
            </button>

          ))}

        </nav>

      </aside>

      {/* ================= Main Content ================= */}

      <main className="ml-64 flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-14 border-b border-neutral-800 flex items-center px-6">

          <h1 className="text-sm font-medium text-neutral-300">
            Project ID: {projectId}
          </h1>

        </div>

        {/* Tab Content */}
        <div className="p-10 space-y-8">

          {activeTab === "overview" && (
            <OverviewTab projectId={projectId} />
          )}

          {activeTab === "personas" && (
            <PersonasTab
              projectId={projectId}
              activePersonaId={activePersonaId}
              setActivePersonaId={setActivePersonaId}
            />
          )}

          {activeTab === "journey" && (
            <JourneyTab projectId={projectId} />
          )}

          {activeTab === "userflow" && (
            <UserFlowTab projectId={projectId} />
          )}

          {activeTab === "wireframe" && (
            <WireframeTab projectId={projectId} />
          )}

          {activeTab === "design-system" && (
            <DesignSystemTab projectId={projectId} />
          )}

        </div>

      </main>

    </div>
  );
}