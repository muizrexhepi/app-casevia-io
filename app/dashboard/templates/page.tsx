// app/dashboard/templates/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { planLimits } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/constants/plans";
import { TemplateGallery } from "@/components/library/template-gallery";

export default async function TemplatesPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  // Get plan information
  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  const plan = PLANS.find((p) => p.id === limits?.planId) || PLANS[0];

  return (
    <div className="container max-w-7xl py-8 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/dashboard/case-studies">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Case Studies
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Template Gallery
                </h1>
                <p className="text-muted-foreground">
                  Choose the perfect design for your case studies
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
            <div className="text-lg font-semibold capitalize">{plan.name}</div>
          </div>
        </div>
      </div>

      {/* Template Gallery */}
      <TemplateGallery currentPlan={plan} />
    </div>
  );
}
