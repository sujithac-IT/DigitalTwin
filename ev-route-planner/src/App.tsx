import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { EVProvider } from "./contexts/EVContext";
import { AuthProvider } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { VoiceToggle } from "./components/VoiceAssistant";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import Stations from "./pages/Stations";
import Notifications from "./pages/Notifications";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Services from "./pages/Services";
import SafetyCompanion from "./pages/SafetyCompanion";
import ContactSupport from "./pages/ContactSupport";
import NotFound from "./pages/NotFound";
import { SiriAssistant } from "./components/SiriAssistant";

const queryClient = new QueryClient();

// Layout wrapper to conditionally show sidebar
const AppLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <>
      <SiriAssistant />
      {!isLoginPage && <Sidebar />}
      {!isLoginPage && <VoiceToggle />}
      <div className={!isLoginPage ? "lg:ml-64" : ""}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<Map />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact-support" element={<ContactSupport />} />
          <Route path="/safety-companion" element={<SafetyCompanion />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EVProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="app-container">
              <AppLayout />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </EVProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
