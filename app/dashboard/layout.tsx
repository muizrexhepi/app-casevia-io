import { AppSidebar } from "@/components/navigation/app-sidebar";
import { NavHeader } from "@/components/navigation/nav-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLoadingFallback } from "@/components/loading-fallback";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <NavHeader />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<DashboardLoadingFallback />}>
            {children}
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
