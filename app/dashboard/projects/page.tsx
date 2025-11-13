// app/dashboard/projects/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project, planLimits } from "@/lib/auth/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { ProjectsList } from "@/components/projects/projects-list";
import { Button } from "@/components/ui/button";

export default async function ProjectsPage() {
  // Get authenticated session
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const organizationId = session.session.activeOrganizationId;

  // Fetch all projects for this organization
  const projects = await db
    .select()
    .from(project)
    .where(eq(project.organizationId, organizationId))
    .orderBy(desc(project.createdAt));

  // Fetch plan limits
  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage your customer interviews and case studies
            </p>
          </div>
          <Button asChild size={"lg"}>
            <Link href="/dashboard/projects/new">
              <Plus className="w-5 h-5" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Projects List with Subscription Context */}
        <ProjectsList projects={projects} initialLimits={limits} />
      </div>
    </div>
  );
}
