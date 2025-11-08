"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/drizzle";
import { project, caseStudy, planLimits } from "@/lib/auth/schema";
import { auth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * Delete a project and all associated data
 * Note: This does NOT refund the monthly case study quota - once used, it's spent.
 * Only storage is freed up.
 */
export async function deleteProject(projectId: string) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return { success: false, error: "Not authenticated" };
  }

  const organizationId = session.session.activeOrganizationId;

  try {
    // Verify project belongs to organization
    const [existingProject] = await db
      .select({
        id: project.id,
        fileSize: project.fileSize,
      })
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.organizationId, organizationId)
        )
      );

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    // Delete project (cascades to case studies due to schema foreign keys)
    await db.delete(project).where(eq(project.id, projectId));

    // Only free up storage space - case study quota stays used
    if (existingProject.fileSize) {
      const storageMb = Math.ceil(existingProject.fileSize / (1024 * 1024));

      const [currentLimits] = await db
        .select()
        .from(planLimits)
        .where(eq(planLimits.organizationId, organizationId));

      if (currentLimits) {
        await db
          .update(planLimits)
          .set({
            storageUsedMb: Math.max(0, currentLimits.storageUsedMb - storageMb),
            // caseStudiesUsed stays the same - they already used their quota
            updatedAt: new Date(),
          })
          .where(eq(planLimits.organizationId, organizationId));
      }
    }

    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/case-studies");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

/**
 * Update case study content
 */
export async function updateCaseStudyContent(
  caseStudyId: string,
  data: {
    title: string;
    summary: string;
    clientName: string | null;
    clientIndustry: string | null;
    challenge: string;
    solution: string;
    results: string;
    keyQuotes: any;
    metrics: any;
    keyTakeaways: any;
  }
) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return { success: false, error: "Not authenticated" };
  }

  const organizationId = session.session.activeOrganizationId;

  // Verify case study belongs to organization
  const [existing] = await db
    .select({ id: caseStudy.id })
    .from(caseStudy)
    .where(
      and(
        eq(caseStudy.id, caseStudyId),
        eq(caseStudy.organizationId, organizationId)
      )
    );

  if (!existing) {
    return { success: false, error: "Case study not found" };
  }

  try {
    await db
      .update(caseStudy)
      .set({
        title: data.title,
        summary: data.summary,
        clientName: data.clientName,
        clientIndustry: data.clientIndustry,
        challenge: data.challenge,
        solution: data.solution,
        results: data.results,
        keyQuotes: data.keyQuotes,
        metrics: data.metrics,
        keyTakeaways: data.keyTakeaways,
        updatedAt: new Date(),
      })
      .where(eq(caseStudy.id, caseStudyId));

    revalidatePath(`/dashboard/projects`);
    revalidatePath(`/dashboard/case-studies`);
    revalidatePath(`/dashboard/case-studies/${caseStudyId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update case study:", error);
    return { success: false, error: "Failed to save changes" };
  }
}

/**
 * Publish/unpublish a case study
 */
export async function toggleCaseStudyPublish(
  caseStudyId: string,
  published: boolean
) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return { success: false, error: "Not authenticated" };
  }

  const organizationId = session.session.activeOrganizationId;

  try {
    const [existing] = await db
      .select({ id: caseStudy.id, publicSlug: caseStudy.publicSlug })
      .from(caseStudy)
      .where(
        and(
          eq(caseStudy.id, caseStudyId),
          eq(caseStudy.organizationId, organizationId)
        )
      );

    if (!existing) {
      return { success: false, error: "Case study not found" };
    }

    // Generate slug if publishing and no slug exists
    let publicSlug = existing.publicSlug;
    if (published && !publicSlug) {
      publicSlug = `${caseStudyId}-${Date.now()}`;
    }

    await db
      .update(caseStudy)
      .set({
        published,
        publicSlug: published ? publicSlug : existing.publicSlug,
        updatedAt: new Date(),
      })
      .where(eq(caseStudy.id, caseStudyId));

    revalidatePath(`/dashboard/case-studies`);
    revalidatePath(`/dashboard/case-studies/${caseStudyId}`);
    if (publicSlug) {
      revalidatePath(`/case-study/${publicSlug}`);
    }

    return { success: true, publicSlug };
  } catch (error) {
    console.error("Failed to toggle publish:", error);
    return { success: false, error: "Failed to update publish status" };
  }
}

/**
 * Delete a case study
 */
export async function deleteCaseStudy(caseStudyId: string) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return { success: false, error: "Not authenticated" };
  }

  const organizationId = session.session.activeOrganizationId;

  try {
    const [existing] = await db
      .select({ id: caseStudy.id })
      .from(caseStudy)
      .where(
        and(
          eq(caseStudy.id, caseStudyId),
          eq(caseStudy.organizationId, organizationId)
        )
      );

    if (!existing) {
      return { success: false, error: "Case study not found" };
    }

    await db.delete(caseStudy).where(eq(caseStudy.id, caseStudyId));

    // Update plan limits
    const [currentLimits] = await db
      .select()
      .from(planLimits)
      .where(eq(planLimits.organizationId, organizationId));

    if (currentLimits) {
      await db
        .update(planLimits)
        .set({
          caseStudiesUsed: Math.max(0, currentLimits.caseStudiesUsed - 1),
          updatedAt: new Date(),
        })
        .where(eq(planLimits.organizationId, organizationId));
    }

    revalidatePath("/dashboard/case-studies");
    revalidatePath("/dashboard/projects");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete case study:", error);
    return { success: false, error: "Failed to delete case study" };
  }
}
