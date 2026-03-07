import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SplashQuote from "@/components/SplashQuote";
import Index from "./pages/Index";
import LearnFeed from "./pages/LearnFeed";
import LearnPaths from "./pages/LearnPaths";
import Chat from "./pages/Chat";
import MasteryChart from "./pages/MasteryChart";
import Games from "./pages/Games";
import Profile from "./pages/Profile";
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

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashQuote onDismiss={() => setShowSplash(false)} />}
        <BrowserRouter>
          <div className="mx-auto max-w-lg">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/feed" element={<LearnFeed />} />
              <Route path="/paths" element={<LearnPaths />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/mastery" element={<MasteryChart />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/hallucination-hunter" element={<HallucinationHunter />} />
              <Route path="/games/prompt-puzzle" element={<PromptPuzzle />} />
              <Route path="/games/output-duel" element={<OutputDuel />} />
              <Route path="/games/time-trial" element={<TimeTrial />} />
              <Route path="/games/prompt-surgery" element={<PromptSurgery />} />
              <Route path="/category/:categoryId" element={<CategoryHub />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wallet" element={<WisdomWallet />} />
              <Route path="/store" element={<TokenStore />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
