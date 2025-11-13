import { NavHeader } from "@/components/navigation/nav-header";
import { OrganizationAutoSelector } from "@/components/org-selector";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <>
      {/* <OrganizationAutoSelector /> */}
      <SidebarProvider>
        <SettingsSidebar />
        <SidebarInset>
          <NavHeader />
          <div className="flex h-full">
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
