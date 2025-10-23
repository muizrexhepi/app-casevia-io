"use client";

import {
  Settings2,
  User,
  Palette,
  Bell,
  Shield,
  Users,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function SettingsSidebar() {
  const accountItems = [
    { title: "Account Settings", url: "/settings/account", icon: User },
    { title: "Appearance", url: "/settings/appearance", icon: Palette },
    { title: "Notifications", url: "/settings/notifications", icon: Bell },
    { title: "Security", url: "/settings/security", icon: Shield },
  ];

  const workspaceItems = [
    {
      title: "Workspace Settings",
      url: "/settings/workspace",
      icon: Settings2,
    },
    { title: "Team & Members", url: "/settings/team", icon: Users },
    { title: "Billing & Plans", url: "/settings/billing", icon: CreditCard },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 py-1.5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center rounded-md hover:bg-sidebar-accent p-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {/* Hide text when sidebar is collapsed */}
          <span className="text-sm font-semibold group-data-[state=collapsed]:hidden">
            Settings
          </span>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* Account Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">
            Account
          </SidebarGroupLabel>
          <SidebarMenu>
            {accountItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span className="group-data-[state=collapsed]:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Workspace Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">
            Workspace
          </SidebarGroupLabel>
          <SidebarMenu>
            {workspaceItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span className="group-data-[state=collapsed]:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
