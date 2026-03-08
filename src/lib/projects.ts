// Projects system — persistent project tracking

export interface Project {
  id: string;
  name: string;
  goal: string;
  deadline?: string;
  status: "active" | "paused" | "done";
  createdAt: number;
  updatedAt: number;
  nextMove?: string;
}

const STORAGE_KEY = "wisdom-projects";

export function loadProjects(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createProject(name: string, goal: string, deadline?: string): Project {
  const project: Project = {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name,
    goal,
    deadline,
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const projects = loadProjects();
  projects.unshift(project);
  saveProjects(projects);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...updates, updatedAt: Date.now() };
    saveProjects(projects);
  }
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter(p => p.id !== id));
}
