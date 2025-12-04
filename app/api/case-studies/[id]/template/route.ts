// app/api/case-studies/[id]/template/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { caseStudy, planLimits } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import { TEMPLATES } from "@/lib/templates";
import { PLANS } from "@/lib/constants/plans";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.session.activeOrganizationId;
    const caseStudyId = params.id;

    // 2. Get request body
    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    // 3. Validate template exists
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    // 4. Check plan limits
    const [limits] = await db
      .select()
      .from(planLimits)
      .where(eq(planLimits.organizationId, organizationId));

    if (!limits) {
      return NextResponse.json(
        { error: "Plan limits not found" },
        { status: 404 }
      );
    }

    const plan = PLANS.find((p) => p.id === limits.planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // 5. Check if user can access this template
    const tierOrder = ["free", "freelancer", "pro", "agency"];
    const userTierIndex = tierOrder.indexOf(plan.id);
    const templateTierIndex = tierOrder.indexOf(
      template.tier === "pro" ? "pro" : template.tier
    );

    if (userTierIndex < templateTierIndex) {
      return NextResponse.json(
        {
          error: `${template.name} template requires ${template.tier} plan or higher`,
          requiredPlan: template.tier,
        },
        { status: 403 }
      );
    }

    // 6. Verify case study ownership
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
      return NextResponse.json(
        { error: "Case study not found" },
        { status: 404 }
      );
    }

    // 7. Update template
    await db
      .update(caseStudy)
      .set({
        templateUsed: templateId,
        updatedAt: new Date(),
      })
      .where(eq(caseStudy.id, caseStudyId));

    return NextResponse.json({
      success: true,
      message: "Template updated successfully",
    });
  } catch (error) {
    console.error("Template update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
