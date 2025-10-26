// app/dashboard/projects/[id]/case-study/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project, caseStudy, socialPost } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import { CaseStudyView } from "./case-study-view";

export default async function CaseStudyPage({
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

  // Fetch case study
  const [caseStudyData] = await db
    .select()
    .from(caseStudy)
    .where(eq(caseStudy.projectId, params.id));

  if (!caseStudyData) {
    // If case study not ready, redirect to project status
    redirect(`/dashboard/projects/${params.id}`);
  }

  // Fetch social posts
  const socialPosts = await db
    .select()
    .from(socialPost)
    .where(eq(socialPost.caseStudyId, caseStudyData.id));

  return (
    <CaseStudyView
      project={projectData}
      caseStudy={caseStudyData}
      socialPosts={socialPosts}
    />
  );
}
