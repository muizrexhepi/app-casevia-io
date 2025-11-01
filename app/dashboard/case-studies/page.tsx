import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { caseStudy, planLimits } from "@/lib/auth/schema"; // Import caseStudy table
import { eq, desc } from "drizzle-orm";
import { CaseStudiesList } from "@/components/case-studies/case-studies-list";

export default async function CaseStudiesPage() {
  // Get authenticated session
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const organizationId = session.session.activeOrganizationId;

  // Fetch all case studies for this organization
  const caseStudies = await db
    .select()
    .from(caseStudy)
    .where(eq(caseStudy.organizationId, organizationId))
    .orderBy(desc(caseStudy.createdAt));

  // Fetch plan limits (still relevant for the usage card)
  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Case Studies
            </h1>
            <p className="text-muted-foreground">
              Manage and publish your generated case studies
            </p>
          </div>
          {/* Note: Removed the "New Project" button as it belongs on the projects page. */}
          {/* The flow is Project -> Case Study, so no "New Case Study" button here. */}
        </div>

        {/* Case Studies List with Subscription Context */}
        <CaseStudiesList caseStudies={caseStudies} initialLimits={limits} />
      </div>
    </div>
  );
}
