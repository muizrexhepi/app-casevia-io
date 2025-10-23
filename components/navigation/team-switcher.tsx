"use client";

import * as React from "react";
import { ChevronsUpDown, Settings, Settings2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function TeamSwitcher({ organization }: { organization: any }) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  if (!organization) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-medium">
                {organization.logo ? (
                  <img
                    src={organization.logo}
                    alt={organization.name}
                    className="size-4 object-contain"
                  />
                ) : (
                  organization.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {organization.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {organization.plan || "Free Plan"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="px-2 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-sidebar text-xs font-medium">
                  {organization.logo ? (
                    <img
                      src={organization.logo}
                      alt={organization.name}
                      className="size-4 object-contain"
                    />
                  ) : (
                    organization.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {organization.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {organization.plan || "Free Plan"}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Links */}
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer"
              onClick={() => router.push("/settings/workspace")}
            >
              <Settings className="h-4 w-4" />
              <span>Workspace Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer"
              onClick={() => router.push("/team/invite")}
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Members</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
