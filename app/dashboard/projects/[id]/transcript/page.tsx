// app/dashboard/projects/[id]/transcript/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import { TranscriptView } from "./transcript-view";

export default async function TranscriptPage({
  params,
}: {
  params: { id: string };
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  // Fetch project with transcript
  const [projectData] = await db
    .select()
    .from(project)
    .where(
      and(eq(project.id, params.id), eq(project.organizationId, organizationId))
    );

  if (!projectData) {
    redirect("/dashboard/projects");
  }

  if (!projectData.transcript) {
    redirect(`/dashboard/projects/${params.id}`);
  }

  return <TranscriptView project={projectData} />;
}
