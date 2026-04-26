import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import owlLogo from "@/assets/owl-logo.png";
import { toast } from "@/hooks/use-toast";
import { detectInAppBrowser } from "@/lib/in-app-browser";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const inApp = useMemo(() => detectInAppBrowser(), []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", description: "Paste it in Safari or Chrome to sign in with Google." });
    } catch {
      toast({ title: "Copy failed", description: "Long-press the address bar to copy the URL.", variant: "destructive" });
    }
  };

  const handleOpenInBrowser = () => {
    // Best-effort: try to break out of the in-app webview.
    const url = window.location.href;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Fallback handled by Copy button.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a password reset link." });
        setMode("login");
      } else if (mode === "login") {
        await signIn(email, password);
        navigate("/", { replace: true });
      } else {
        await signUp(email, password, displayName);
        toast({ title: "Account created", description: "Please check your email to verify your account." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({ title: "Error", description: String(error), variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "OAuth failed", variant: "destructive" });
    }
  };

  const heading = mode === "forgot" ? "Reset password" : mode === "login" ? "Welcome back" : "Get started";
  const subtitle = mode === "forgot"
    ? "Enter your email to receive a reset link."
    : mode === "login"
    ? "Sign in to continue learning."
    : "Create your account to begin.";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background md:flex-row">
      {/* Left branding panel - desktop only */}
      <div className="hidden md:flex md:w-1/2 md:h-screen items-center justify-center bg-card border-r border-border">
        <div className="max-w-md text-center space-y-6 px-12">
          <img src={owlLogo} alt="Wisdom AI" className="w-24 h-24 mx-auto drop-shadow-[0_0_24px_hsl(45,90%,55%,0.3)]" />
          <h2 className="font-display text-h1 text-foreground">Master AI.<br />Build Smarter.</h2>
          <p className="text-body-lg text-muted-foreground">
            Your personal AI tutor that adapts to how you learn. Courses, drills, and real-world practice — all in one place.
          </p>
        </div>
      </div>

      {/* Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
          {/* Logo - mobile only */}
          <div className="flex flex-col items-center gap-3 md:hidden">
            <img src={owlLogo} alt="Wisdom AI" className="w-16 h-16 drop-shadow-[0_0_12px_hsl(45,90%,55%,0.3)]" />
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Wisdom AI</h1>
          </div>

          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight mb-1">{heading}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* In-app browser warning — Google blocks OAuth in webviews like Snapchat/Instagram/TikTok */}
          {mode !== "forgot" && inApp.isInApp && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <p className="text-xs text-amber-200 font-medium">
                You're in {inApp.appName ?? "an in-app browser"}. Google sign-in is blocked here.
              </p>
              <p className="text-xs text-amber-200/80">
                Open this page in Safari or Chrome to continue with Google — or use email below.
              </p>
              <div className="flex gap-2 pt-1">
                <Button type="button" size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={handleOpenInBrowser}>
                  <ExternalLink className="h-3.5 w-3.5" /> Open in browser
                </Button>
                <Button type="button" size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={handleCopyLink}>
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </Button>
              </div>
            </div>
          )}

          {/* Social login buttons - not shown in forgot mode */}
          {mode !== "forgot" && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full gap-2 bg-surface-2 border-border hover:bg-surface-hover disabled:opacity-50"
                onClick={() => {
                  if (inApp.isInApp) {
                    toast({
                      title: "Open in your browser",
                      description: `Google blocks sign-in inside ${inApp.appName ?? "in-app browsers"}. Tap "Open in browser" above or use email.`,
                      variant: "destructive",
                    });
                    return;
                  }
                  handleOAuth("google");
                }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full gap-2 bg-surface-2 border-border hover:bg-surface-hover" onClick={() => handleOAuth("apple")}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Input
                placeholder="Display name (optional — we'll use your email if blank)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-surface-2 border-border"
              />
            )}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-surface-2 border-border" />
            {mode !== "forgot" && (
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-surface-2 border-border" />
            )}

            {mode === "login" && (
              <div className="text-right">
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "..." : mode === "forgot" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            {mode === "forgot" ? (
              <button type="button" onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to sign in
              </button>
            ) : (
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
