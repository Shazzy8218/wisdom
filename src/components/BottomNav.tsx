import { Home, BookOpen, Route, MessageCircle, BookMarked, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/feed", icon: BookOpen, label: "Feed" },
  { to: "/paths", icon: Route, label: "Paths" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/library", icon: BookMarked, label: "Library" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-all duration-200 ${
                isActive ? "text-primary" : "text-text-tertiary hover:text-muted-foreground"
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                {isActive && <span className="text-micro font-semibold uppercase">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
