// app/dashboard/case-studies/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/drizzle";
import { caseStudy, planLimits } from "@/lib/auth/schema";
import { auth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { TEMPLATES } from "@/lib/templates";
import { PLANS } from "@/lib/constants/plans";

// A simple function to create a URL-friendly slug
const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Coalesce slashes/spaces
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes

// Helper to generate a unique slug
async function generateUniqueSlug(title: string, caseStudyId: string) {
  let slug = slugify(title);
  let unique = false;
  let attempt = 0;

  while (!unique) {
    const newSlug = attempt === 0 ? slug : `${slug}-${attempt}`;
    const [existing] = await db
      .select({ id: caseStudy.id })
      .from(caseStudy)
      .where(eq(caseStudy.publicSlug, newSlug));

    // If it doesn't exist, or if it exists but is our *own* case study, it's fine
    if (!existing || existing.id === caseStudyId) {
      slug = newSlug;
      unique = true;
    } else {
      attempt++;
    }
  }
  return slug;
}

export async function updatePublishStatus(
  caseStudyId: string,
  published: boolean
) {
  // 1. Authenticate user
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    throw new Error("Not authenticated");
  }

  const organizationId = session.session.activeOrganizationId;

  // 2. Get the current case study
  const [current] = await db
    .select({
      id: caseStudy.id,
      title: caseStudy.title,
      publicSlug: caseStudy.publicSlug,
    })
    .from(caseStudy)
    .where(
      and(
        eq(caseStudy.id, caseStudyId),
        eq(caseStudy.organizationId, organizationId)
      )
    );

  if (!current) {
    throw new Error("Case study not found");
  }

  // 3. Determine the public slug
  let slugToSet = current.publicSlug;
  if (published && !current.publicSlug) {
    // Generate a new slug only if publishing and one doesn't exist
    slugToSet = await generateUniqueSlug(current.title, current.id);
  }

  // 4. Update the database
  try {
    await db
      .update(caseStudy)
      .set({
        published: published,
        publicSlug: slugToSet,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(caseStudy.id, caseStudyId),
          eq(caseStudy.organizationId, organizationId)
        )
      );

    // 5. Revalidate paths to show changes
    revalidatePath("/dashboard/case-studies"); // The list page
    revalidatePath(`/dashboard/case-studies/${caseStudyId}`); // This page
    if (slugToSet) {
      revalidatePath(`/${slugToSet}`); // The public page
    }

    return { success: true, newSlug: slugToSet };
  } catch (error) {
    return { success: false, error: "Failed to update status." };
  }
}

export async function updateTemplate(caseStudyId: string, templateId: string) {
  // 1. Authenticate
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    throw new Error("Not authenticated");
  }

  const organizationId = session.session.activeOrganizationId;

  // 2. Validate template exists
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error("Invalid template");
  }

  // 3. Check plan limits
  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  if (!limits) {
    throw new Error("Plan limits not found");
  }

  const plan = PLANS.find((p) => p.id === limits.planId);
  if (!plan) {
    throw new Error("Invalid plan");
  }

  // 4. Check if user can access this template
  const tierMap: Record<string, string[]> = {
    free: ["free"],
    freelancer: ["free", "pro"],
    pro: ["free", "pro"],
    agency: ["free", "pro", "agency"],
  };

  const allowedTiers = tierMap[plan.id] || ["free"];
  if (!allowedTiers.includes(template.tier)) {
    throw new Error(
      `${template.name} template requires ${template.tier} plan or higher`
    );
  }

  // 5. Verify case study ownership
  const [existingStudy] = await db
    .select()
    .from(caseStudy)
    .where(
      and(
        eq(caseStudy.id, caseStudyId),
        eq(caseStudy.organizationId, organizationId)
      )
    );

  if (!existingStudy) {
    throw new Error("Case study not found");
  }

  // 6. Update template
  try {
    await db
      .update(caseStudy)
      .set({
        templateUsed: templateId,
        updatedAt: new Date(),
      })
      .where(eq(caseStudy.id, caseStudyId));

    // 7. Revalidate paths
    revalidatePath(`/dashboard/case-studies/${caseStudyId}`);
    if (existingStudy.publicSlug) {
      revalidatePath(`/${existingStudy.publicSlug}`);
    }

    return { success: true, message: "Template updated successfully" };
  } catch (error) {
    return { success: false, error: "Failed to update template" };
  }
}
