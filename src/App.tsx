import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ServicesProvider } from "@/contexts/ServicesContext";
import Index from "./pages/Index";
import ServiceDetail from "@/components/ServiceDetail";
import EventDetail from "@/components/EventDetail";
import ServiceCart from "@/components/ServiceCart";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ServicesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/servicio/:id" element={<ServiceDetail />} />
            <Route path="/evento/:id" element={<EventDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ServiceCart />
        </BrowserRouter>
      </ServicesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
