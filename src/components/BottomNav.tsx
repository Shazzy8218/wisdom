import { BookOpen, BookMarked, User, MoreHorizontal, Gamepad2, Target, Wallet, Settings, Trophy, Zap, HelpCircle, Newspaper, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OwlIcon from "@/components/OwlIcon";

const PRIMARY_NAV = [
  { to: "/", icon: null, label: "Chat", isOwl: true },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/feed", icon: Newspaper, label: "Feed" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/profile", icon: User, label: "Profile" },
];

const MORE_NAV = [
  { to: "/games", icon: Gamepad2, label: "Games" },
  { to: "/drills", icon: Zap, label: "Live Drills" },
  
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/feed", icon: Newspaper, label: "Feed" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/support", icon: HelpCircle, label: "Support" },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl bg-card border-t border-border pb-safe-bottom"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-sm font-semibold text-foreground">More</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 px-4 pb-6">
                {MORE_NAV.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-2xl pb-safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {PRIMARY_NAV.map(({ to, icon: Icon, label, isOwl }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isOwl ? (
                    <OwlIcon size={22} className={isActive ? "opacity-100" : "opacity-50"} />
                  ) : (
                    Icon && <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                  )}
                  <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200 ${
              moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
