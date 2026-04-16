import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image, FileText, Wand2, Globe, X } from "lucide-react";

interface AttachmentPickerProps {
  open: boolean;
  onClose: () => void;
  onCamera: () => void;
  onPhotos: () => void;
  onFiles: () => void;
  onCreateImage: () => void;
  onWebSearch?: () => void;
}

const actions = [
  { id: "camera", label: "Camera", icon: Camera, color: "text-blue-400" },
  { id: "photos", label: "Photos", icon: Image, color: "text-green-400" },
  { id: "files", label: "Files", icon: FileText, color: "text-orange-400" },
  { id: "create-image", label: "Create Image", icon: Wand2, color: "text-purple-400" },
  { id: "web-search", label: "Web Search", icon: Globe, color: "text-cyan-400" },
] as const;

export default function AttachmentPicker({
  open, onClose, onCamera, onPhotos, onFiles, onCreateImage, onWebSearch,
}: AttachmentPickerProps) {
  const handlers: Record<string, () => void> = {
    camera: onCamera,
    photos: onPhotos,
    files: onFiles,
    "create-image": onCreateImage,
    "web-search": onWebSearch || (() => {}),
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card border-t border-border/50 shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Actions grid */}
            <div className="px-6 pb-8 pt-2">
              <div className="grid grid-cols-4 gap-4">
                {actions.map((action, i) => {
                  if (action.id === "web-search" && !onWebSearch) return null;
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { handlers[action.id](); onClose(); }}
                      className="flex flex-col items-center gap-2 py-3 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Cancel */}
            <div className="px-6 pb-8">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-muted/50 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
