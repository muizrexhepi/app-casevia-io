// app/[publicSlug]/page.tsx
import { db } from "@/lib/drizzle";
import { caseStudy, organization, planLimits } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import {
  TEMPLATES,
  ModernTemplate,
  ProfessionalTemplate,
  TemplateProps,
} from "@/lib/templates";

// --- Helper Functions ---

function safeParseJsonb(jsonb: any, defaultValue: any[] = []): any[] {
  if (!jsonb) return defaultValue;
  if (typeof jsonb === "object" && jsonb !== null) {
    return Array.isArray(jsonb) ? jsonb : defaultValue;
  }
  if (typeof jsonb === "string") {
    try {
      const parsed = JSON.parse(jsonb);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

// --- SEO Metadata ---

export async function generateMetadata({
  params,
}: {
  params: { publicSlug: string };
}) {
  const [data] = await db
    .select({
      seoTitle: caseStudy.seoTitle,
      seoDescription: caseStudy.seoDescription,
      title: caseStudy.title,
      summary: caseStudy.summary,
    })
    .from(caseStudy)
    .where(
      and(
        eq(caseStudy.publicSlug, params.publicSlug),
        eq(caseStudy.published, true)
      )
    );

  if (!data) {
    return { title: "Not Found" };
  }

  return {
    title: data.seoTitle || data.title,
    description: data.seoDescription || data.summary,
  };
}

// --- Page Component ---

export default async function PublicCaseStudyPage({
  params,
}: {
  params: { publicSlug: string };
}) {
  // 1. Fetch Case Study
  const [data] = await db
    .select()
    .from(caseStudy)
    .where(
      and(
        eq(caseStudy.publicSlug, params.publicSlug),
        eq(caseStudy.published, true)
      )
    );

  if (!data) {
    notFound();
  }

  // 2. Fetch Organization & Plan
  const [org] = await db
    .select({
      name: organization.name,
      logo: organization.logo,
    })
    .from(organization)
    .where(eq(organization.id, data.organizationId));

  const [planData] = await db
    .select({ planId: planLimits.planId })
    .from(planLimits)
    .where(eq(planLimits.organizationId, data.organizationId));

  const isFreePlan = !planData || planData.planId === "free";

  // 3. Increment View Count
  await db
    .update(caseStudy)
    .set({ viewCount: (data.viewCount || 0) + 1 })
    .where(eq(caseStudy.id, data.id));

  // 4. Parse JSON data
  const keyQuotes = safeParseJsonb(data.keyQuotes);
  const metrics = safeParseJsonb(data.metrics);
  const keyTakeaways = safeParseJsonb(data.keyTakeaways);

  // 5. Get template
  const templateId = data.templateUsed || "modern";
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];

  // 6. Prepare case study data for template
  const caseStudyData: TemplateProps["caseStudy"] = {
    title: data.title,
    summary: data.summary || "",
    clientName: data.clientName,
    clientIndustry: data.clientIndustry,
    challenge: data.challenge || "",
    solution: data.solution || "",
    results: data.results || "",
    metrics: metrics,
    keyQuotes: keyQuotes.map((q: any) =>
      typeof q === "string" ? q : q.text || ""
    ),
    keyTakeaways: keyTakeaways,
    customBranding: data.customBranding as any,
  };

  // 7. Render the appropriate template
  const renderTemplate = () => {
    const props: TemplateProps = {
      caseStudy: caseStudyData,
      template: template,
    };

    switch (templateId) {
      case "professional":
        return <ProfessionalTemplate {...props} />;
      case "modern":
      default:
        return <ModernTemplate {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Free Plan: Branded Header */}
      {isFreePlan && (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between">
              <Link
                href="https://casevia.io"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-foreground">Casevia</span>
                <span className="text-muted-foreground/50">/</span>
                <span>Case Study</span>
              </Link>
              <Link
                href="https://app.casevia.io/signup"
                className="text-sm font-medium text-foreground hover:text-foreground/80 flex items-center gap-1.5 group"
              >
                Create your own
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Template Content */}
      <main className={isFreePlan ? "" : "pt-12"}>{renderTemplate()}</main>

      {/* Footer CTA (only for free plan) */}
      {isFreePlan && (
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by Casevia</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Create Your Own Case Studies in Minutes
            </h2>
            <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Turn client interviews into professional case studies with AI.
              Upload, transcribe, and publish — no design skills needed.
            </p>
            <Link
              href="https://app.casevia.io/signup"
              className="inline-flex items-center gap-2 bg-background text-foreground hover:bg-background/90 font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              Get Started Free
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
