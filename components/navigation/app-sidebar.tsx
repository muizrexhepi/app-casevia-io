"use client";

import * as React from "react";
import { BookOpen, Bot, Frame, PieChart, SquareTerminal } from "lucide-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending: isUserLoading } = authClient.useSession();
  const { data: activeOrg, isPending: isOrgLoading } =
    authClient.useListOrganizations();

  if (isUserLoading || isOrgLoading) return null;
  if (!session?.user) return null;

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
  };

  const navMain = [
    { title: "Projects", url: "/dashboard/projects", icon: Bot },
    { title: "Case Studies", url: "/dashboard/case-studies", icon: BookOpen },
    { title: "Analytics", url: "/dashboard/analytics", icon: PieChart },
    { title: "Library", url: "/dashboard/library", icon: Frame },
  ];

  return (
    <Sidebar collapsible="icon" {...props} className="border-none">
      <SidebarHeader>
        <TeamSwitcher organization={activeOrg?.[0]} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
