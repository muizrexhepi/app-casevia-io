// app/dashboard/projects/[id]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { ProjectStatusView } from "@/components/projects/project-status-view";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  // Fetch project
  const [projectData] = await db
    .select()
    .from(project)
    .where(
      and(eq(project.id, params.id), eq(project.organizationId, organizationId))
    );

  if (!projectData) {
    redirect("/dashboard/projects");
  }

  return <ProjectStatusView project={projectData} />;
}
