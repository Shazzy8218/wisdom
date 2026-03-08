import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import RoadmapCanvas from "./RoadmapCanvas";
import ActionTableCanvas from "./ActionTableCanvas";
import DocumentCanvas from "./DocumentCanvas";
import DiagnosticCanvas from "./DiagnosticCanvas";
import DecisionTreeCanvas from "./DecisionTreeCanvas";
import LessonCanvas from "./LessonCanvas";

export type CanvasIntent = "roadmap" | "action-table" | "document" | "diagnostic" | "decision-tree" | "lesson" | null;

interface CanvasPanelProps {
  intent: CanvasIntent;
  content: string;
  onClose: () => void;
}

const CANVAS_MAP: Record<string, React.FC<{ content: string }>> = {
  "roadmap": RoadmapCanvas,
  "action-table": ActionTableCanvas,
  "document": DocumentCanvas,
  "diagnostic": DiagnosticCanvas,
  "decision-tree": DecisionTreeCanvas,
  "lesson": LessonCanvas,
};

const CANVAS_LABELS: Record<string, string> = {
  "roadmap": "📊 Roadmap",
  "action-table": "📋 Action Table",
  "document": "📄 Document",
  "diagnostic": "🔍 Diagnostic",
  "decision-tree": "🌳 Decision Tree",
  "lesson": "📖 Lesson",
};

export default function CanvasPanel({ intent, content, onClose }: CanvasPanelProps) {
  const Component = intent ? CANVAS_MAP[intent] : null;

  return (
    <AnimatePresence>
      {intent && Component && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="border-t border-border bg-card/95 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="text-micro font-semibold text-muted-foreground uppercase tracking-widest">
              {CANVAS_LABELS[intent] || "Canvas"}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="max-h-[45vh] overflow-y-auto hide-scrollbar p-4">
            <Component content={content} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
