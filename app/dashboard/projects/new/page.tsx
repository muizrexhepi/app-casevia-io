// app/dashboard/projects/new/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { planLimits } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";
import { UploadFormWrapper } from "@/components/projects/upload-form-wrapper";

export default async function NewProjectPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  // Fetch plan limits
  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  // If no limits exist, create default free plan
  if (!limits) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);

    await db.insert(planLimits).values({
      organizationId,
      planId: "free",
      caseStudiesUsed: 0,
      storageUsedMb: 0,
      socialPostsUsed: 0,
      resetAt: nextReset,
    });

    // Refresh page to get the new limits
    redirect("/dashboard/projects/new");
  }

  return (
    <UploadFormWrapper organizationId={organizationId} initialLimits={limits} />
  );
}
