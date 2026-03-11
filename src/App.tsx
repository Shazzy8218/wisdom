import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  const { calibration, loading: calLoading, completeCalibration } = useCalibration();
  useCloudSync();
  const [splashDismissed, setSplashDismissed] = useState(false);

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
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Show calibration modal for first-time users
  if (!calLoading && user && !calibration.calibrationDone) {
    return <CalibrationModal onComplete={completeCalibration} />;
  }

  return (
    <>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          {/* Chat is now the default home */}
          <Route path="/" element={<Chat />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/feed" element={<LearnFeed />} />
          {/* Redirects for old routes */}
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
