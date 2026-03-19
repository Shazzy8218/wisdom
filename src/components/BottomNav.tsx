import { useState } from "react";
import { BookOpen, BookMarked, User, Mic, X, StickyNote, Zap } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import OwlIcon from "@/components/OwlIcon";

const NAV_ITEMS = [
  { to: "/", icon: null, label: "Home", isOwl: true },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/library", icon: BookMarked, label: "Library" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const navigate = useNavigate();

  const handleCapture = () => {
    if (captureText.trim()) {
      // Navigate to chat with the captured idea as a pre-filled message
      navigate(`/chat?q=${encodeURIComponent(captureText.trim())}`);
      setCaptureText("");
      setCaptureOpen(false);
    }
  };

  return (
    <>
      {/* Capture Overlay */}
      <AnimatePresence>
        {captureOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-safe-top py-4">
              <h2 className="font-display text-lg font-bold text-foreground">Quick Capture</h2>
              <button
                onClick={() => setCaptureOpen(false)}
                className="p-2 rounded-xl bg-surface-2 text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 px-5 pb-6 flex flex-col">
              <textarea
                autoFocus
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                placeholder="Capture an idea, question, or insight..."
                className="flex-1 bg-surface-2 border border-border rounded-2xl p-4 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (captureText.trim()) {
                      navigate(`/chat?q=${encodeURIComponent(captureText.trim())}`);
                      setCaptureText("");
                      setCaptureOpen(false);
                    }
                  }}
                  disabled={!captureText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-30"
                >
                  <Zap className="h-4 w-4" /> Send to Wisdom Owl
                </button>
                <button
                  onClick={() => {
                    const notes = JSON.parse(localStorage.getItem("wisdom-quick-notes") || "[]");
                    notes.unshift({ text: captureText.trim(), ts: Date.now() });
                    localStorage.setItem("wisdom-quick-notes", JSON.stringify(notes.slice(0, 50)));
                    setCaptureText("");
                    setCaptureOpen(false);
                  }}
                  disabled={!captureText.trim()}
                  className="p-3 rounded-2xl bg-surface-2 border border-border text-foreground disabled:opacity-30"
                >
                  <StickyNote className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Capture Button */}
      {!captureOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setCaptureOpen(true)}
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Mic className="h-5 w-5" />
        </motion.button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-2xl pb-safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label, isOwl }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 transition-all duration-200 relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-[1px] left-3 right-3 h-[2px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {isOwl ? (
                    <OwlIcon
                      size={22}
                      className={`transition-opacity ${isActive ? "opacity-100" : "opacity-40"}`}
                    />
                  ) : (
                    Icon && (
                      <Icon
                        className={`h-5 w-5 transition-all ${isActive ? "scale-110" : ""}`}
                        strokeWidth={isActive ? 2.2 : 1.5}
                      />
                    )
                  )}
                  <span
                    className={`text-[10px] font-semibold transition-colors ${
                      isActive ? "text-primary" : ""
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
