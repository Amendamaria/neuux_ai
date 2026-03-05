"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import NewProjectModal from "@/components/NewProjectModal";
import Image from "next/image";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  description: string;
  target_users: string;
  goal: string;
  created_at: string;
  overview_status?: string;
  persona_status?: string;
  journey_status?: string;
  flow_status?: string;
  ui_status?: string;
};

export default function DashboardPage() {

  const router = useRouter();
  const supabase = createClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {

    const init = async () => {

      const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  router.replace("/auth/login");
  return;
}

const user = session.user;

      setUserEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          target_users,
          goal,
          created_at,
          overview_status,
          persona_status,
          journey_status,
          flow_status,
          ui_status
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data as Project[]);
      }

      setLoading(false);
    };

    init();

  }, []); // run once only

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getStatusColor = (status?: string) => {
    if (status === "completed") return "bg-green-500";
    if (status === "pending") return "bg-yellow-500";
    return "bg-neutral-600";
  };

  return (

    <div className="flex h-screen bg-neutral-950 text-white">

      <main className="flex-1 flex flex-col">

        {/* Header */}

        <div className="flex items-center justify-between px-10 py-4 border-b border-neutral-800">

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NeuUXAI Logo"
              width={110}
              height={28}
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">

            <span className="text-sm text-neutral-300">
              {userEmail}
            </span>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg"
            >
              Logout
            </button>

          </div>

        </div>

        {/* Dashboard */}

        <div className="p-10 overflow-y-auto flex-1">

          <div className="flex justify-between items-center">

            <div>
              <h1 className="text-2xl font-semibold">
                Dashboard
              </h1>

              <p className="text-sm text-neutral-400 mt-1">
                Manage your UX projects
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 rounded-xl bg-white text-black text-sm font-medium hover:opacity-90 transition"
            >
              + New Project
            </button>

          </div>

          {/* Projects */}

          <div className="grid grid-cols-3 gap-6 mt-10">

            {loading && (
              <div className="text-neutral-400 text-sm">
                Loading projects...
              </div>
            )}

            {!loading && projects.length === 0 && (
              <div
                onClick={() => setIsModalOpen(true)}
                className="h-40 border border-dashed border-neutral-700 rounded-2xl flex items-center justify-center hover:bg-white/5 cursor-pointer transition"
              >
                <span className="text-neutral-400 text-sm">
                  + Create your first UX Project
                </span>
              </div>
            )}

            {projects.map((project) => (

              <div
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl hover:bg-neutral-800 transition cursor-pointer"
              >

                <h3 className="text-lg font-medium">
                  {project.name}
                </h3>

                <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-4 text-xs">

                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(project.overview_status)}`} />
                    Overview
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(project.persona_status)}`} />
                    Persona
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(project.journey_status)}`} />
                    Journey
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(project.flow_status)}`} />
                    Flow
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(project.ui_status)}`} />
                    UI
                  </div>

                </div>

                <p className="text-xs text-neutral-500 mt-4">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>

              </div>

            ))}

          </div>

        </div>

      </main>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}