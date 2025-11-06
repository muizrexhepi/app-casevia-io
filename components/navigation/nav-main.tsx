// components/nav-main.tsx

"use client";

import { usePathname } from "next/navigation"; // ⬅️ IMPORT THIS HOOK
import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string; // ⬅️ Changed to optional to support the Dashboard fix
    icon?: LucideIcon;
  }[]; // ⬅️ Removed 'isActive' from type since we calculate it here
}) {
  const pathname = usePathname(); // ⬅️ GET THE CURRENT URL PATH

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.url
            ? pathname.startsWith(item.url) ||
              (item.url === "/dashboard" && pathname === "/") // Special case for root/dashboard
            : false;

          if (!item.url) return null;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive} // ⬅️ USE THE CALCULATED VALUE
                tooltip={item.title}
              >
                <a href={item.url}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
