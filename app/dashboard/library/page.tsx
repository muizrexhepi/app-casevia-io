// app/dashboard/library/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { planLimits } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/constants/plans";
import { TemplateGallery } from "@/components/library/template-gallery";

export default async function LibraryPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  // Fetch plan
  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  const currentPlan = PLANS.find((p) => p.id === limits?.planId) || PLANS[0];

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Template Library
        </h1>
        <p className="text-muted-foreground">
          Professional templates to showcase your case studies. Choose a design
          that matches your brand.
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="rounded-lg border bg-card p-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-lg font-semibold">{currentPlan.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Templates Available</p>
            <p className="text-lg font-semibold">
              {currentPlan.limits.designTemplates === -1
                ? "All"
                : currentPlan.limits.designTemplates}
            </p>
          </div>
        </div>
      </div>

      {/* Template Gallery */}
      <TemplateGallery currentPlan={currentPlan} />
    </div>
  );
}
