import {
  LayoutDashboard,
  Users,
  Target,
  Activity,
  Trophy,
  BookOpen,
  Shield,
  GraduationCap,
  BarChart3,
  MessageSquare,
  Plug,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Power Moves", icon: Target, path: "/power-moves" },
  { title: "Activities", icon: Activity, path: "/activities" },
  { title: "Contacts", icon: Users, path: "/contacts" },
  { title: "Leaderboard", icon: Trophy, path: "/leaderboard" },
  { title: "Goals", icon: Target, path: "/goals" },
  { title: "Programs", icon: BookOpen, path: "/programs" },
  { title: "Policies", icon: Shield, path: "/policies-page" },
  { title: "Education", icon: GraduationCap, path: "/education" },
  { title: "Messages", icon: MessageSquare, path: "/messages" },
  { title: "Manager", icon: Shield, path: "/manager" },
  { title: "Manager Goals", icon: Target, path: "/manager-goals" },
  { title: "Analytics", icon: BarChart3, path: "/analytics" },
  { title: "Integrations", icon: Plug, path: "/integrations" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-display font-bold text-sm">A</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-sidebar-foreground">ARCSTONE</h2>
            <p className="text-xs text-sidebar-foreground/60">Financial Coaching</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
