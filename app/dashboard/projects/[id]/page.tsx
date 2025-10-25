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
  params: Promise<{ id: string }>;
}) {
  // ✅ Await params because it's now a Promise in Next.js 15+
  const { id } = await params;

  // ✅ Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ✅ Protect the route
  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  // ✅ Fetch the project
  const [projectData] = await db
    .select()
    .from(project)
    .where(
      and(
        // if your project.id is a number, use Number(id)
        eq(project.id, id),
        eq(project.organizationId, organizationId)
      )
    );

  // ✅ Redirect if not found
  if (!projectData) {
    redirect("/dashboard/projects");
  }

  // ✅ Render the project view
  return <ProjectStatusView project={projectData} />;
}
