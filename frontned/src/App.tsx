import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";

import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Loading from "./pages/Loading";
import CropSelect from "./pages/CropSelect";
import SoilSelect from "./pages/SoilSelect";
import PlantingDate from "./pages/PlantingDate";
import Fertilizer from "./pages/Fertilizer";
import Result from "./pages/Result";
import Market from "./pages/Market";
import Alerts from "./pages/Alerts";
import CreateAlert from "./pages/CreateAlert";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>

        <Toaster />
        <Sonner />

        <AuthProvider>

          <AppProvider>

            <BrowserRouter>

              <Routes>

                <Route
                  path="/"
                  element={<Index />}
                />

                

                <Route
                  path="/loading"
                  element={
                    <ProtectedRoute>
                      <Loading />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/crop"
                  element={
                    <ProtectedRoute>
                      <CropSelect />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/soil"
                  element={
                    <ProtectedRoute>
                      <SoilSelect />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/date"
                  element={
                    <ProtectedRoute>
                      <PlantingDate />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/fertilizer"
                  element={
                    <ProtectedRoute>
                      <Fertilizer />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/result"
                  element={
                    <ProtectedRoute>
                      <Result />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/market"
                  element={
                    <ProtectedRoute>
                      <Market />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Alerts />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/alerts/new"
                  element={
                    <ProtectedRoute>
                      <CreateAlert />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={<NotFound />}
                />

              </Routes>

            </BrowserRouter>

          </AppProvider>

        </AuthProvider>

      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;