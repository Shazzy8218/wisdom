import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderOpen, Trash2, CheckCircle, Pause, Play, X } from "lucide-react";
import { loadProjects, createProject, updateProject, deleteProject, type Project } from "@/lib/projects";

interface ProjectsPanelProps {
  open: boolean;
  onClose: () => void;
  onInsertProject: (project: Project) => void;
}

export default function ProjectsPanel({ open, onClose, onInsertProject }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");

  const refresh = () => setProjects(loadProjects());

  const handleCreate = () => {
    if (!name.trim()) return;
    const p = createProject(name.trim(), goal.trim());
    refresh();
    setCreating(false);
    setName("");
    setGoal("");
  };

  const handleStatusToggle = (p: Project) => {
    const next = p.status === "active" ? "paused" : p.status === "paused" ? "active" : "active";
    updateProject(p.id, { status: next });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    refresh();
  };

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="absolute inset-x-0 bottom-0 top-12 bg-background/95 backdrop-blur-xl z-20 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="text-body font-semibold text-foreground">Projects</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 hide-scrollbar">
        {projects.length === 0 && !creating && (
          <p className="text-caption text-muted-foreground text-center py-8">No projects yet. Create one to track your goals.</p>
        )}

        {projects.map(p => (
          <div key={p.id} className="glass-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-foreground truncate">{p.name}</p>
                {p.goal && <p className="text-micro text-muted-foreground mt-0.5">{p.goal}</p>}
                {p.nextMove && (
                  <p className="text-micro text-primary mt-1.5 flex items-center gap-1">
                    🎯 Next: {p.nextMove}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onInsertProject(p)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-micro text-primary font-medium">
                  Ask Owl
                </button>
                <button onClick={() => handleStatusToggle(p)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                  {p.status === "active" ? <Pause className="h-3 w-3 text-muted-foreground" /> : <Play className="h-3 w-3 text-accent-green" />}
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-micro px-2 py-0.5 rounded-full ${
                p.status === "active" ? "bg-accent-green/15 text-accent-green" :
                p.status === "paused" ? "bg-accent-gold/15 text-accent-gold" :
                "bg-muted text-muted-foreground"
              }`}>
                {p.status}
              </span>
              {p.deadline && <span className="text-micro text-muted-foreground">Due: {p.deadline}</span>}
            </div>
          </div>
        ))}

        <AnimatePresence>
          {creating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-card p-4 space-y-3 overflow-hidden">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name"
                className="w-full bg-surface-2 rounded-xl px-3 py-2 text-body text-foreground placeholder:text-text-tertiary outline-none border border-border focus:border-primary/30" autoFocus />
              <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Goal (optional)"
                className="w-full bg-surface-2 rounded-xl px-3 py-2 text-body text-foreground placeholder:text-text-tertiary outline-none border border-border focus:border-primary/30" />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-caption font-medium">Create</button>
                <button onClick={() => setCreating(false)} className="rounded-xl bg-surface-2 text-muted-foreground px-4 py-2 text-caption">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!creating && (
        <div className="px-5 py-3 border-t border-border">
          <button onClick={() => setCreating(true)}
            className="w-full rounded-xl bg-surface-2 py-2.5 text-caption font-medium text-muted-foreground hover:bg-surface-hover transition-colors flex items-center justify-center gap-2">
            <Plus className="h-3.5 w-3.5" /> New Project
          </button>
        </div>
      )}
    </motion.div>
  );
}
