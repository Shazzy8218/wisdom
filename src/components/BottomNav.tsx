import { Home, BookOpen, Route, MessageCircle, BarChart3, Gamepad2, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/feed", icon: BookOpen, label: "Feed" },
  { to: "/paths", icon: Route, label: "Paths" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/mastery", icon: BarChart3, label: "Mastery" },
  { to: "/games", icon: Gamepad2, label: "Games" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
