import { useRequireAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { VoiceNoteButton } from "@/components/coaching/VoiceNoteButton";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  const { session, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-display">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
            <SidebarTrigger />
            <div className="flex-1" />
            <NotificationCenter />
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
          </header>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
          <VoiceNoteButton />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
