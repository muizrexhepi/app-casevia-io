// app/dashboard/projects/[id]/case-study/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/drizzle";
import { caseStudy } from "@/lib/auth/schema";
import { auth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

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
  // 1. Authenticate user
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return { success: false, error: "Not authenticated" };
  }

  const organizationId = session.session.activeOrganizationId;

  // 2. Verify case study belongs to organization
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

  // 3. Update case study
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

    // 4. Revalidate paths
    revalidatePath(`/dashboard/projects`);
    revalidatePath(`/dashboard/case-studies`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update case study:", error);
    return { success: false, error: "Failed to save changes" };
  }
}
