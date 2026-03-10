import { MessageCircle, BookOpen, BookMarked, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import OwlIcon from "@/components/OwlIcon";

const NAV_ITEMS = [
  { to: "/", icon: null, label: "Chat", isOwl: true },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/library", icon: BookMarked, label: "Library" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, isOwl }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200 ${
                isActive ? "text-primary" : "text-text-tertiary hover:text-muted-foreground"
              }`
            }>
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
      </div>
    </nav>
  );
}
