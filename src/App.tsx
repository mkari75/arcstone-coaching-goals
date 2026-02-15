import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import ActivityLog from "./pages/ActivityLog";
import ContactsPage from "./pages/ContactsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import ProgramsLibrary from "./pages/ProgramsLibrary";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import ProgramViewer from "./pages/ProgramViewer";
import PolicyViewer from "./pages/PolicyViewer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            <Route path="activities" element={<ActivityLog />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="programs" element={<ProgramsLibrary />} />
            <Route path="programs/:id" element={<ProgramViewer />} />
            <Route path="policies-page" element={<ProgramsLibrary />} />
            <Route path="policies/:id" element={<PolicyViewer />} />
            <Route path="education" element={<PlaceholderPage title="Continuing Education" />} />
            <Route path="messages" element={<PlaceholderPage title="CEO Messages" />} />
            <Route path="messages" element={<PlaceholderPage title="CEO Messages" />} />
            <Route path="manager" element={<ManagerDashboard />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
