import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Share2, Copy } from "lucide-react";
import { type StarterLesson } from "@/lib/categories";
import { toast } from "@/hooks/use-toast";

interface ShareCardProps {
  lesson: StarterLesson;
  categoryName: string;
  onClose: () => void;
}

export default function ShareCard({ lesson, categoryName, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const shareText = `💡 ${lesson.title}\n\n"${lesson.bragLine || lesson.hook}"\n\n🧠 Mental Model: ${lesson.mentalModel?.split(".")[0] || "Learn more in the app"}\n\n— WISDOM AI`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    toast({ title: "Share text copied!" });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Wisdom: ${lesson.title}`, text: shareText });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="mb-5">
      <div className="glass-card border-accent-gold/20 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-accent-gold" />
            <h3 className="font-display text-body font-semibold text-foreground">Share My Wisdom</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-surface-hover transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* The Share Card Preview */}
        <div ref={cardRef} className="m-4 rounded-2xl bg-gradient-to-br from-card via-surface-2 to-card border border-accent-gold/20 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <p className="text-micro font-semibold text-primary mb-1">{categoryName}</p>
          <h4 className="font-display text-h3 text-foreground mb-3">{lesson.title}</h4>
          
          <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 mb-3">
            <p className="text-caption italic text-foreground">"{lesson.bragLine || lesson.hook}"</p>
          </div>
          
          {lesson.mentalModel && (
            <div className="mb-3">
              <p className="text-micro font-semibold text-muted-foreground mb-1">🧠 MENTAL MODEL</p>
              <p className="text-caption text-foreground leading-relaxed">{lesson.mentalModel.split(".").slice(0, 2).join(".")}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <span className="font-display text-micro font-bold text-primary tracking-wider">WISDOM AI</span>
            <span className="text-micro text-text-tertiary">wisdom.ai</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2">
          <button onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-surface-2 py-3 text-caption font-semibold text-foreground hover:bg-surface-hover transition-colors">
            <Copy className="h-4 w-4" /> Copy Text
          </button>
          <button onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-caption font-semibold text-primary-foreground">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}
