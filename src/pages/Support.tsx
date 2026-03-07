import { useState } from "react";
import { ArrowLeft, Mail, Clock, MessageCircle, Bug } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const FAQ = [
  { q: "How do I earn Wisdom Tokens?", a: "Complete lessons, quizzes, feed cards, daily missions, games, and find hidden owls. Each activity rewards a specific number of tokens." },
  { q: "What does Pro unlock?", a: "Pro gives you 50 daily AI messages, all learning tracks, 2x token earning, boss challenges, and personal playbook exports." },
  { q: "Can I use Wisdom AI offline?", a: "The app requires an internet connection for AI-powered features like chat, lesson generation, and feed content. Previously loaded content may be available offline." },
  { q: "How does the streak system work?", a: "Your streak increases by 1 for each day you complete at least one learning activity (lesson, quiz, drill, or feed card). Miss a day and it resets to 0." },
  { q: "How do I delete my data?", a: "Go to Settings → scroll to Danger Zone → Delete My Account. This permanently removes all your data." },
  { q: "What is the Owl Hunt?", a: "Hidden gold owls appear in 3 random locations each day. Tap them to earn +3 tokens each. Max 3 owls per day, resets every 24 hours." },
];

export default function Support() {
  const [bugReport, setBugReport] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugReport.trim()) return;
    setSubmitting(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1000));
    toast({ title: "Report sent", description: "We'll review your report and get back to you." });
    setBugReport("");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <Link to="/settings" className="flex items-center gap-2 text-muted-foreground text-caption mb-4 hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <h1 className="font-display text-h1 text-foreground">Support</h1>
        <p className="text-body text-muted-foreground mt-2">We're here to help.</p>
      </div>

      {/* Contact */}
      <div className="px-5 mb-6">
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-body font-medium text-foreground">Email Support</p>
              <p className="text-caption text-primary">support@wisdomowl.app</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-caption text-muted-foreground">Typical response time: 24–48 hours</p>
          </div>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* FAQ */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="glass-card p-4 cursor-pointer group">
              <summary className="text-body font-medium text-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                {item.q}
              </summary>
              <p className="text-caption text-muted-foreground mt-3 pl-6">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Bug Report */}
      <div className="px-5">
        <h2 className="section-label mb-4">Report a Bug</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="h-4 w-4 text-primary" />
              <span className="text-caption font-medium text-foreground">Describe the issue</span>
            </div>
            <textarea
              value={bugReport}
              onChange={e => setBugReport(e.target.value)}
              placeholder="What happened? What did you expect to happen?"
              rows={4}
              className="w-full bg-surface-2 border border-border rounded-xl p-3 text-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={!bugReport.trim() || submitting}
            className="w-full rounded-2xl bg-primary py-3 text-body font-semibold text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            {submitting ? "Sending..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
