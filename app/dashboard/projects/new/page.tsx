// app/dashboard/projects/new/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { planLimits } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/constants/plans";
import { UploadForm } from "@/components/projects/upload-form";

export default async function NewProjectPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  const plan = PLANS.find((p) => p.id === limits?.planId) || PLANS[0];

  return (
    <UploadForm
      organizationId={organizationId}
      currentPlan={plan}
      limits={limits}
    />
  );
}
