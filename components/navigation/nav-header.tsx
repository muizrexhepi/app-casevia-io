"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export function NavHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const current = segments[segments.length - 1] || "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, idx) => (
            <BreadcrumbItem
              key={idx}
              className={idx === segments.length - 1 ? "hidden md:block" : ""}
            >
              {idx === segments.length - 1 ? (
                <BreadcrumbPage className="capitalize">
                  {segment}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink
                    href={"/" + segments.slice(0, idx + 1).join("/")}
                    className="capitalize"
                  >
                    {segment}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          ))}
          {segments.length === 0 && (
            <BreadcrumbItem>
              <BreadcrumbPage>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
