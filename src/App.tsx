import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import SplashQuote from "@/components/SplashQuote";
import ScrollToTop from "@/components/ScrollToTop";
import { useAuth } from "@/hooks/useAuth";
import { useCalibration } from "@/hooks/useCalibration";
import { useCloudSync } from "@/hooks/useCloudSync";
import CalibrationModal from "@/components/CalibrationModal";
import Chat from "./pages/Chat";
import Courses from "./pages/Courses";
import LearnFeed from "./pages/LearnFeed";
import Games from "./pages/Games";
import Profile from "./pages/Profile";
import Scoreboard from "./pages/Index";
import Goals from "./pages/Goals";
import NotFound from "./pages/NotFound";
import WisdomWallet from "./pages/WisdomWallet";
import TokenStore from "./pages/TokenStore";
import Upgrade from "./pages/Upgrade";
import Library from "./pages/Library";
import Playground from "./pages/Playground";
import Settings from "./pages/Settings";
import HallucinationHunter from "./pages/HallucinationHunter";
import PromptPuzzle from "./pages/PromptPuzzle";
import OutputDuel from "./pages/OutputDuel";
import TimeTrial from "./pages/TimeTrial";
import PromptSurgery from "./pages/PromptSurgery";
import CategoryHub from "./pages/CategoryHub";
import ModuleView from "./pages/ModuleView";
import LessonView from "./pages/LessonView";
import CoreTrackHub from "./pages/CoreTrackHub";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import LiveFireDrills from "./pages/LiveFireDrills";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  const { calibration, loading: calLoading, completeCalibration } = useCalibration();
  const location = useLocation();
  const navigate = useNavigate();
  useCloudSync();
  const [splashDismissed, setSplashDismissed] = useState(false);

  const routeState =
    location.state && typeof location.state === "object"
      ? (location.state as { returnTo?: string })
      : undefined;
  const returnTo = routeState?.returnTo;
  const isEditingCalibration = calibration.calibrationDone || Boolean(returnTo);

  const handleCalibrationComplete = async (answers: Parameters<typeof completeCalibration>[0]) => {
    await completeCalibration(answers);
    navigate(returnTo || "/", { replace: true });
  };

  const handleCalibrationBack = () => {
    if (isEditingCalibration) {
      navigate(returnTo || "/", { replace: true });
      return;
    }

    import("@/integrations/supabase/client").then(({ supabase }) => supabase.auth.signOut());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!splashDismissed) {
    return <SplashQuote onDismiss={() => setSplashDismissed(true)} />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (calLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!calibration.calibrationDone && location.pathname !== "/calibration") {
    return <Navigate to="/calibration" replace />;
  }

  if (location.pathname === "/calibration") {
    return (
      <CalibrationModal
        onComplete={handleCalibrationComplete}
        onBack={handleCalibrationBack}
        showSkip={false}
        submitLabel={isEditingCalibration ? "Save preferences" : "Let's go"}
        title={isEditingCalibration ? "Update how Wisdom Owl responds to you." : "Let's tune Wisdom Owl to you."}
        description={
          isEditingCalibration
            ? "Update your preferences, save them once, and jump right back in."
            : "Answer a few quick questions so I actually think like you do."
        }
        initialAnswers={{
          goalMode: calibration.goalMode,
          outputMode: calibration.outputMode,
          primaryDesire: calibration.primaryDesire,
          answerTone: calibration.answerTone,
          learningStyle: calibration.learningStyle,
          intensity: calibration.intensity,
        }}
      />
    );
  }

  return (
    <>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/feed" element={<LearnFeed />} />
          <Route path="/learn" element={<Navigate to="/courses" replace />} />
          <Route path="/paths" element={<Navigate to="/courses" replace />} />
          <Route path="/mastery" element={<Navigate to="/courses" replace />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/hallucination-hunter" element={<HallucinationHunter />} />
          <Route path="/games/prompt-puzzle" element={<PromptPuzzle />} />
          <Route path="/games/output-duel" element={<OutputDuel />} />
          <Route path="/games/time-trial" element={<TimeTrial />} />
          <Route path="/games/prompt-surgery" element={<PromptSurgery />} />
          <Route path="/track/:trackId" element={<CoreTrackHub />} />
          <Route path="/category/:categoryId" element={<CategoryHub />} />
          <Route path="/category/:categoryId/module" element={<ModuleView />} />
          <Route path="/category/:categoryId/lesson" element={<LessonView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/wallet" element={<WisdomWallet />} />
          <Route path="/store" element={<TokenStore />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/library" element={<Library />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/support" element={<Support />} />
          <Route path="/drills" element={<LiveFireDrills />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/chat" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
