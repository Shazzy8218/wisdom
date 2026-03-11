import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import owlLogo from "@/assets/owl-logo.png";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/", { replace: true });
      } else {
        await signUp(email, password, displayName);
        toast({
          title: "Account created",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background md:flex-row">
      {/* Left branding panel - desktop only */}
      <div className="hidden md:flex md:w-1/2 md:h-screen items-center justify-center bg-card border-r border-border">
        <div className="max-w-md text-center space-y-6 px-12">
          <img
            src={owlLogo}
            alt="Wisdom AI"
            className="w-24 h-24 mx-auto drop-shadow-[0_0_24px_hsl(45,90%,55%,0.3)]"
          />
          <h2 className="font-display text-h1 text-foreground">
            Master AI.<br/>Build Smarter.
          </h2>
          <p className="text-body-lg text-muted-foreground">
            Your personal AI tutor that adapts to how you learn. Courses, drills, and real-world practice — all in one place.
          </p>
        </div>
      </div>

      {/* Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Logo - mobile only */}
          <div className="flex flex-col items-center gap-3 md:hidden">
            <img
              src={owlLogo}
              alt="Wisdom AI"
              className="w-16 h-16 drop-shadow-[0_0_12px_hsl(45,90%,55%,0.3)]"
            />
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Wisdom AI
            </h1>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block text-center">
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Sign in to continue learning." : "Create your account to begin."}
            </p>
          </div>

          {/* Mobile subtitle */}
          <p className="text-sm text-muted-foreground text-center md:hidden">
            {isLogin ? "Welcome back." : "Create your account."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
                className="bg-surface-2 border-border"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-surface-2 border-border"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-surface-2 border-border"
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
