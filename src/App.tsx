
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

// Import pages
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ViewProfilePage from "./pages/ViewProfilePage";
import SearchPage from "./pages/SearchPage";
import MessagingPage from "./pages/MessagingPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import SettingsPage from "./pages/SettingsPage";

// Layout components
import DashboardLayout from "./layouts/DashboardLayout";
import AuthProtected from "./layouts/AuthProtected";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Protected Routes (require authentication) */}
            <Route
              path="/dashboard"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <DashboardPage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <ViewProfilePage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />
            <Route
              path="/search"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <SearchPage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />
            <Route
              path="/messaging"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <MessagingPage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />
            <Route
              path="/messaging/:id"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <MessagingPage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />
            <Route
              path="/connections"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <ConnectionsPage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthProtected>
                  <DashboardLayout>
                    <SettingsPage />
                  </DashboardLayout>
                </AuthProtected>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
