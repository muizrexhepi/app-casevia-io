// app/actions/templates.ts
"use server";

import { eq, and } from "drizzle-orm";
import { getTemplateById } from "@/lib/templates";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { caseStudy, planLimits } from "@/lib/auth/schema";
import { headers } from "next/headers";

export async function updateCaseStudyTemplate(
  caseStudyId: string,
  templateId: string,
  organizationId: string
) {
  const session = await auth.api.getSession({
    headers: await headers(), // depending on your auth setup
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // 1. Get the template details
  const template = getTemplateById(templateId);
  if (!template) throw new Error("Invalid template");

  // 2. Validate Plan Limits
  // Fetch the organization's current plan to ensure they can use this tier
  const limits = await db.query.planLimits.findFirst({
    where: eq(planLimits.organizationId, organizationId),
  });

  const currentPlan = limits?.planId || "free";

  const planHierarchy = ["free", "freelancer", "pro", "agency"];
  const templateTierMap: Record<string, number> = {
    free: 0,
    pro: 2, // Freelancer (1) includes Pro usually, or adjust logic
    agency: 3,
  };

  const userLevel = planHierarchy.indexOf(currentPlan);
  const requiredLevel = planHierarchy.indexOf(
    template.tier === "pro" ? "freelancer" : template.tier
  ); // Adjust mapping based on your business logic

  if (userLevel < requiredLevel) {
    throw new Error(`Upgrade to ${template.tier} to use this template`);
  }

  // 3. Update the Case Study
  await db
    .update(caseStudy)
    .set({
      templateUsed: templateId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(caseStudy.id, caseStudyId),
        eq(caseStudy.organizationId, organizationId)
      )
    );

  revalidatePath(`/dashboard/projects/${caseStudyId}`); // Adjust path to your editor
  return { success: true };
}
