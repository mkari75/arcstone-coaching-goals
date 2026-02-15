import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from 'lucide-react';
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import NotFound from "./pages/NotFound";

// Lazy load non-critical routes
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const ProgramsLibrary = lazy(() => import("./pages/ProgramsLibrary"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const ProgramViewer = lazy(() => import("./pages/ProgramViewer"));
const PolicyViewer = lazy(() => import("./pages/PolicyViewer"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-[200px] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
    <p className="text-muted-foreground mt-1">This section is coming soon.</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="power-moves" element={<PlaceholderPage title="Daily Power Moves" />} />
            <Route path="activities" element={<Suspense fallback={<LoadingFallback />}><ActivityLog /></Suspense>} />
            <Route path="contacts" element={<Suspense fallback={<LoadingFallback />}><ContactsPage /></Suspense>} />
            <Route path="leaderboard" element={<Suspense fallback={<LoadingFallback />}><LeaderboardPage /></Suspense>} />
            <Route path="programs" element={<Suspense fallback={<LoadingFallback />}><ProgramsLibrary /></Suspense>} />
            <Route path="programs/:id" element={<Suspense fallback={<LoadingFallback />}><ProgramViewer /></Suspense>} />
            <Route path="policies-page" element={<Suspense fallback={<LoadingFallback />}><ProgramsLibrary /></Suspense>} />
            <Route path="policies/:id" element={<Suspense fallback={<LoadingFallback />}><PolicyViewer /></Suspense>} />
            <Route path="education" element={<PlaceholderPage title="Continuing Education" />} />
            <Route path="messages" element={<PlaceholderPage title="CEO Messages" />} />
            <Route path="manager" element={<Suspense fallback={<LoadingFallback />}><ManagerDashboard /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<LoadingFallback />}><AnalyticsDashboard /></Suspense>} />
            <Route path="integrations" element={<Suspense fallback={<LoadingFallback />}><IntegrationsPage /></Suspense>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
