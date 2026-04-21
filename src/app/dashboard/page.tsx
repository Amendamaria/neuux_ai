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

  // ✅ ADDED SEARCH STATE (NO UI CHANGE)
  const [searchQuery, setSearchQuery] = useState("");

  // ================= FETCH =================
  const fetchProjects = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/auth/login");
      return;
    }

    setUser(session.user);

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) setProjects(data);
  }, [supabase, router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ================= STAR (UNCHANGED LOGIC) =================
  const toggleStar = async (project: Project) => {
    const updatedValue = !project.is_starred;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, is_starred: updatedValue } : p
      )
    );

    await supabase
      .from("projects")
      .update({ is_starred: updatedValue })
      .eq("id", project.id);
  };

  // ================= ACTIONS =================
  const handleConfirmAction = async () => {
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

    fetchProjects();
    setActionProject(null);
    setActionType(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  // ✅ FILTER + SEARCH (ONLY CHANGE HERE)
  const filteredProjects = projects
    .filter((p) => {
      if (activeTab === "recents") return !p.is_deleted;
      if (activeTab === "starred") return p.is_starred && !p.is_deleted;
      if (activeTab === "trash") return p.is_deleted;
      return true;
    })
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex h-screen bg-black text-white">

      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col border-r border-neutral-900">

        <div className="px-5 py-4">
          <Image src="/logo.png" alt="logo" width={110} height={28} />
        </div>

        <div className="px-3 mt-2">
          <p className="text-xs text-neutral-500 px-3 mb-3">Projects</p>

          <div className="space-y-1">
            <NavItem icon={<Folder size={16} />} label="Recents" active={activeTab==="recents"} onClick={()=>setActiveTab("recents")} />
            <NavItem icon={<Star size={16} />} label="Starred" active={activeTab==="starred"} onClick={()=>setActiveTab("starred")} />
            <NavItem icon={<Trash2 size={16} />} label="Trash" active={activeTab==="trash"} onClick={()=>setActiveTab("trash")} />
          </div>
        </div>

        <div className="flex-1" />

        {/* PROFILE */}
        <div className="p-3 border-t border-neutral-900 relative">
          <button
            onClick={() => setShowProfileMenu((p) => !p)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-900"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center">
                <User size={16} />
              </div>

              <div className="text-sm leading-tight">
                <p className="truncate max-w-30">{user?.email}</p>
                <p className="text-xs text-neutral-500">Free Plan</p>
              </div>
            </div>

            <ChevronDown size={14} className="text-neutral-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-14 left-3 right-3 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <button className="w-full px-4 py-3 flex items-center gap-2 hover:bg-neutral-800 text-sm">
                <Settings size={14} /> Settings
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-red-500/10 text-red-400 text-sm"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="h-14 flex justify-between px-6 items-center border-b border-neutral-900">
          <div className="relative w-80">
            <Search className="absolute right-3 top-2.5 text-neutral-500" size={14}/>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 rounded-lg px-4 py-2 text-sm outline-none"
              placeholder="Search..."
            />
          </div>

          <button onClick={()=>setIsModalOpen(true)} className="bg-white text-black px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus size={14}/> New Project
          </button>
        </div>

        {/* PROJECTS */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-5">

            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => !project.is_deleted && router.push(`/project/${project.id}`)}
                className="group relative bg-neutral-900 border border-neutral-800 rounded-xl p-5 cursor-pointer hover:border-neutral-600"
              >
                <h3 className="text-sm font-medium mb-2">{project.name}</h3>

                <p className="text-xs text-neutral-400 mb-3">
                  {project.description || "No description"}
                </p>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-2">

                  {!project.is_deleted && (
                    <>
                      <Star
                        onClick={(e)=>{e.stopPropagation();toggleStar(project)}}
                        size={14}
                        className={project.is_starred ? "text-yellow-400 fill-yellow-400" : ""}
                      />

                      <Trash2
                        onClick={(e)=>{e.stopPropagation();setActionProject(project);setActionType("delete")}}
                        size={14}
                      />
                    </>
                  )}

                  {project.is_deleted && (
                    <>
                      <RotateCcw onClick={(e)=>{e.stopPropagation();setActionProject(project);setActionType("restore")}} size={14}/>
                      <X onClick={(e)=>{e.stopPropagation();setActionProject(project);setActionType("permanent")}} size={14}/>
                    </>
                  )}

                </div>
              </div>
            ))}

          </div>
        </div>

      </main>

      <NewProjectModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} />

      {/* CONFIRM MODAL */}
      {actionProject && actionType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-80">
            <p className="mb-4 text-sm">Confirm action?</p>
            <div className="flex justify-end gap-2">
              <button onClick={()=>{setActionProject(null);setActionType(null)}} className="px-3 py-1.5 bg-neutral-800 rounded">
                Cancel
              </button>
              <button onClick={handleConfirmAction} className="px-3 py-1.5 bg-white text-black rounded">
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
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
        ${active ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-white hover:bg-neutral-900"}
      `}
    >
      {icon}
      {label}
    </button>
  );
}