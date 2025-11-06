// NavHeader.tsx

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
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
import { ChevronRight } from "lucide-react";
import React from "react";

export function NavHeader() {
  const pathname = usePathname();

  // Parse the pathname into segments
  const segments = pathname.split("/").filter(Boolean);

  // Remove 'dashboard' from breadcrumbs as it's redundant
  const breadcrumbSegments = segments.filter((seg) => seg !== "dashboard");

  // Format segment names
  const formatSegment = (segment: string) => {
    // Handle special cases
    if (segment === "case-studies") return "Case Studies";
    if (segment === "new") return "New";

    // Replace hyphens with spaces and capitalize
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Build the full path for each segment
  const getSegmentPath = (index: number) => {
    return "/" + segments.slice(0, index + 1).join("/");
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbSegments.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            // Map over segments to generate list items and separators
            breadcrumbSegments.map((segment, idx) => {
              const isLast = idx === breadcrumbSegments.length - 1;
              const actualIndex = segments.indexOf(segment);
              const path = getSegmentPath(actualIndex);
              const formattedSegment = formatSegment(segment);

              return (
                <React.Fragment key={segment + idx}>
                  <BreadcrumbItem>
                    {isLast ? (
                      // Last item renders BreadcrumbPage inside the <li>
                      <BreadcrumbPage className="max-w-[200px] truncate">
                        {formattedSegment}
                      </BreadcrumbPage>
                    ) : (
                      // Non-last item renders a Link inside the <li>
                      <BreadcrumbLink asChild>
                        <Link href={path}>{formattedSegment}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>

                  {/* CORRECT FIX: Conditionally render the Separator *outside*
                    the BreadcrumbItem (<li>) and only if it's not the last item.
                  */}
                  {!isLast && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              );
            })
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
