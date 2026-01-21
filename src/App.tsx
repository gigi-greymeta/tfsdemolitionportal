import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Portal from "./pages/Portal";
import Runsheets from "./pages/Runsheets";
import SiteSafety from "./pages/SiteSafety";
import MyEmployment from "./pages/MyEmployment";
import NewEntry from "./pages/NewEntry";
import Logs from "./pages/Logs";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import DocumentSign from "./pages/DocumentSign";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/tfsapp">
          <Routes>
            <Route path="/" element={<Portal />} />
            <Route path="/runsheets" element={<Runsheets />} />
            <Route path="/site-safety" element={<SiteSafety />} />
            <Route path="/my-employment" element={<MyEmployment />} />
            <Route path="/new-entry" element={<NewEntry />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            <Route path="/document-sign" element={<DocumentSign />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
