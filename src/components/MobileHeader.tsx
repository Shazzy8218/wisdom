import owlLogo from "@/assets/owl-logo.png";
import OwlHuntTracker from "@/components/OwlHuntTracker";
import { useLiveClock } from "@/hooks/useLiveClock";

export default function MobileHeader() {
  const clock = useLiveClock();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-2.5">
        <img src={owlLogo} alt="Wisdom AI" className="h-7 w-7 drop-shadow-[0_0_8px_hsl(45,90%,55%,0.3)]" />
        <span className="font-display text-base font-bold text-foreground tracking-tight">
          Wisdom AI
        </span>
      </div>
      <div className="flex items-center gap-3">
        <OwlHuntTracker />
        <span className="text-[11px] font-mono text-muted-foreground">{clock.timeStr}</span>
      </div>
    </header>
  );
}
