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
              <Route path="/profile" element={<Profile />} />
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
