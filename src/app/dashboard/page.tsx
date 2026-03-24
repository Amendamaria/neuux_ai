"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NewProjectModal from "@/components/NewProjectModal";
import {
  Folder,
  Star,
  Trash2,
  RotateCcw,
  X,
  Plus,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  is_deleted: boolean;
  is_starred: boolean;
};

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<
    "recents" | "starred" | "trash"
  >("recents");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [actionProject, setActionProject] = useState<Project | null>(null);
  const [actionType, setActionType] = useState<
    "delete" | "restore" | "permanent" | null
  >(null);

  const fetchProjects = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/auth/login");
      return;
    }

    setUser(session.user);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) return console.error(error);

    if (data) {
      setProjects(
        data.map((p) => ({
          ...p,
          is_starred: p.is_starred ?? false,
          is_deleted: p.is_deleted ?? false,
        }))
      );
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".profile-menu")) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () =>
      document.removeEventListener("click", handleClickOutside);
  }, []);

  async function toggleStar(project: Project) {
    const updated = !project.is_starred;

    const { error } = await supabase
      .from("projects")
      .update({ is_starred: updated })
      .eq("id", project.id);

    if (error) return console.error(error);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, is_starred: updated } : p
      )
    );
  }

  async function handleConfirmAction() {
    if (!actionProject || !actionType) return;

    const id = actionProject.id;

    if (actionType === "delete") {
      await supabase.from("projects").update({ is_deleted: true }).eq("id", id);
    }

    if (actionType === "restore") {
      await supabase.from("projects").update({ is_deleted: false }).eq("id", id);
    }

    if (actionType === "permanent") {
      await supabase.from("projects").delete().eq("id", id);
    }

    await fetchProjects();

    setActionProject(null);
    setActionType(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const filteredProjects = projects.filter((p) => {
    if (activeTab === "recents") return !p.is_deleted;
    if (activeTab === "starred") return p.is_starred && !p.is_deleted;
    if (activeTab === "trash") return p.is_deleted;
    return true;
  });

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col border-r border-neutral-800">
        <div className="px-5 py-4 border-b border-neutral-800">
          <Image src="/logo.png" alt="logo" width={110} height={28} />
        </div>

        <div className="px-2 py-3 space-y-1">
          <p className="text-xs text-neutral-500 px-3 mb-2">Projects</p>

          <NavItem icon={<Folder size={16} />} label="Recents" active={activeTab==="recents"} onClick={()=>setActiveTab("recents")} />
          <NavItem icon={<Star size={16} />} label="Starred" active={activeTab==="starred"} onClick={()=>setActiveTab("starred")} />
          <NavItem icon={<Trash2 size={16} />} label="Trash" active={activeTab==="trash"} onClick={()=>setActiveTab("trash")} />
        </div>

        <div className="flex-1" />

        {/* Profile */}
        <div className="p-3 border-t border-neutral-800 profile-menu relative">
          <button onClick={()=>setShowProfileMenu(p=>!p)} className="w-full flex items-center justify-between p-2 hover:bg-neutral-800 rounded-lg">
            <div className="flex items-left gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <User size={18}/>
              </div>
              <div className="text-sm">
                <p className="truncate max-w-36">{user?.email}</p>
                <p className="text-xs text-neutral-500">Free Plan</p>
              </div>
            </div>
            <ChevronDown size={16}/>
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-18 left-3 right-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg overflow-hidden">
              <button onClick={()=>router.push("/settings")} className="w-full px-4 py-3 flex gap-2 hover:bg-neutral-800">
                <Settings size={16}/> Settings
              </button>
              <button onClick={handleLogout} className="w-full px-4 py-3 flex gap-2 hover:bg-red-500/10 hover:text-red-400">
                <LogOut size={16}/> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">

        {/* Header */}
        <div className="h-14 flex justify-between px-6 border-b border-neutral-800 items-center">
          <div className="relative w-80">
            <Search className="absolute right-3 top-2.5 text-neutral-500" size={16}/>
            <input
              placeholder="Search projects..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-5 py-2 text-sm"
            />
          </div>

          <button onClick={()=>setIsModalOpen(true)} className="bg-white text-black px-4 py-2 rounded-lg flex gap-2 items-center">
            <Plus size={16}/> New Project
          </button>
        </div>

        {/* 🔥 IMPROVED PROJECT CARDS */}
        <div className="p-6 grid grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() =>
                !project.is_deleted &&
                router.push(`/project/${project.id}`)
              }
              className="group relative bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-neutral-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Folder size={14} />
                  </div>

                  <h3 className="text-sm font-medium line-clamp-1">
                    {project.name}
                  </h3>
                </div>

                {project.is_starred && !project.is_deleted && (
                  <Star size={14} className="text-yellow-400" />
                )}
              </div>

              <p className="text-xs text-neutral-400 line-clamp-2 mb-4">
                {project.description || "No description provided"}
              </p>

              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span>
                  {new Date(project.created_at).toLocaleDateString()}
                </span>

                {project.is_deleted && (
                  <span className="text-red-400">In Trash</span>
                )}
              </div>

              {/* ACTIONS */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <div className="flex items-center gap-1 bg-neutral-800/80 backdrop-blur px-2 py-1 rounded-lg border border-neutral-700 shadow-md">


                {!project.is_deleted && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(project);
                      }}
                      className="p-1.5 rounded-md hover:bg-neutral-800"
                    >
                      <Star
                        size={14}
                        className={
                          project.is_starred
                            ? "text-yellow-400"
                            : "text-neutral-400"
                        }
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionProject(project);
                        setActionType("delete");
                      }}
                      className="p-1.5 rounded-md hover:bg-neutral-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}

                {project.is_deleted && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionProject(project);
                        setActionType("restore");
                      }}
                      className="p-1.5 rounded-md hover:bg-neutral-800"
                    >
                      <RotateCcw size={14} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionProject(project);
                        setActionType("permanent");
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      <NewProjectModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} />

      {/* ACTION MODAL */}
      {actionProject && actionType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-neutral-900 p-6 rounded-xl w-80">
            <h3 className="mb-2">
              {actionType === "delete" && "Move to Trash?"}
              {actionType === "restore" && "Restore Project?"}
              {actionType === "permanent" && "Delete Permanently?"}
            </h3>

            <p className="text-sm text-neutral-400 mb-4">
              {actionType === "permanent"
                ? "This cannot be undone."
                : "You can revert later."}
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setActionProject(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 bg-neutral-800 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAction}
                className="px-3 py-1.5 bg-white text-black rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm ${
        active ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}