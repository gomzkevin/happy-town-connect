import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ServicesProvider } from "@/contexts/ServicesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ServiceDetail from "@/components/ServiceDetail";
import EventDetail from "@/components/EventDetail";
import ServiceCart from "@/components/ServiceCart";
import AuthPage from "@/components/auth/AuthPage";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ServicesProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/servicio/:id" element={<ServiceDetail />} />
              <Route path="/evento/:id" element={<EventDetail />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ServiceCart />
          </BrowserRouter>
        </ServicesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
