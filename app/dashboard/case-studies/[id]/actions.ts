// app/dashboard/casestudies/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/drizzle";
import { caseStudy } from "@/lib/auth/schema";
import { auth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

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
    revalidatePath("/dashboard/casestudies"); // The list page
    revalidatePath(`/dashboard/casestudies/${caseStudyId}`); // This page
    if (slugToSet) {
      revalidatePath(`/${slugToSet}`); // The public page
    }

    return { success: true, newSlug: slugToSet };
  } catch (error) {
    return { success: false, error: "Failed to update status." };
  }
}
