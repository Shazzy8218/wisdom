import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import type { DecisionProtocol } from "@/lib/feed-cards";

interface Props {
  protocols: DecisionProtocol[];
}

export default function DecisionProtocols({ protocols }: Props) {
  const navigate = useNavigate();
  if (!protocols?.length) return null;

  return (
    <div className="rounded-xl border border-accent-green/15 bg-accent-green/5 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-accent-green" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-green">Decision Support</p>
      </div>
      {protocols.map((p, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-green/15 flex items-center justify-center text-[9px] font-bold text-accent-green mt-0.5">
            {i + 1}
          </span>
          <div className="flex-1">
            <p className="text-caption text-muted-foreground leading-relaxed">{p.action}</p>
            {p.linkedCourse && (
              <button
                onClick={() => navigate(p.linkedCourseId ? `/mastery-track/${p.linkedCourseId}` : "/courses")}
                className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
              >
                <ArrowRight className="h-3 w-3" />
                {p.linkedCourse}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
