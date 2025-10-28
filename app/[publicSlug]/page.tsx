// app/[publicSlug]/page.tsx
import { db } from "@/lib/drizzle";
import { caseStudy, organization, planLimits } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Quote, ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

function extractMetricValue(str: string): {
  value: string;
  unit: string;
  label: string;
} {
  const percentMatch = str.match(/([\d.,]+)%/);
  if (percentMatch) {
    return {
      value: percentMatch[1],
      unit: "%",
      label: str.replace(percentMatch[0], "").trim(),
    };
  }

  const multiplierMatch = str.match(/([\d.,]+)[xX]/);
  if (multiplierMatch) {
    return {
      value: multiplierMatch[1],
      unit: "×",
      label: str.replace(multiplierMatch[0], "").trim(),
    };
  }

  const numberMatch = str.match(/([\d.,]+)/);
  if (numberMatch) {
    return {
      value: numberMatch[1],
      unit: "",
      label: str.replace(numberMatch[0], "").trim(),
    };
  }

  return { value: "", unit: "", label: str };
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

  // 5. Branding (use custom or default to Casevia colors)
  const branding = (data.customBranding as any) || {};
  const primaryColor = branding.primaryColor || "oklch(0.205 0 0)"; // --primary from your CSS
  const agencyName = org?.name || "Agency";

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

      <main className={isFreePlan ? "" : "pt-12"}>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/20" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              {/* Client Badge */}
              {data.clientName && (
                <div className="flex justify-center">
                  <Badge
                    variant="secondary"
                    className="text-sm font-medium px-4 py-1.5"
                  >
                    {data.clientIndustry
                      ? `${data.clientName} • ${data.clientIndustry}`
                      : data.clientName}
                  </Badge>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                {data.title}
              </h1>

              {/* Summary */}
              {data.summary && (
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {data.summary}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Metrics Section */}
        {metrics.length > 0 && (
          <section className="py-12 sm:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-card border border-border rounded-2xl shadow-sm p-8 sm:p-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                  {metrics.slice(0, 4).map((metric: any, i: number) => {
                    const { value, unit, label } = extractMetricValue(
                      metric.metric
                    );
                    return (
                      <div key={i} className="text-center space-y-2">
                        <div className="flex items-baseline justify-center gap-1">
                          {value ? (
                            <>
                              <span className="text-5xl sm:text-6xl font-bold text-foreground">
                                {value}
                              </span>
                              {unit && (
                                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                                  {unit}
                                </span>
                              )}
                            </>
                          ) : null}
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground font-medium">
                          {label || metric.metric}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
              {/* Main Column */}
              <article className="lg:col-span-2 space-y-16">
                {/* Challenge */}
                {data.challenge && (
                  <ContentSection
                    title="The Challenge"
                    content={data.challenge}
                  />
                )}

                {/* Solution */}
                {data.solution && (
                  <ContentSection
                    title="The Solution"
                    content={data.solution}
                  />
                )}

                {/* Results */}
                {data.results && (
                  <ContentSection title="The Results" content={data.results} />
                )}
              </article>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-28 space-y-6">
                  {/* Quote */}
                  {keyQuotes.length > 0 && (
                    <div className="relative p-6 rounded-xl border-l-4 border-primary bg-muted/50">
                      <Quote className="absolute top-4 right-4 w-8 h-8 text-muted-foreground/20" />
                      <div className="relative space-y-4">
                        <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                          "
                          {typeof keyQuotes[0] === "string"
                            ? keyQuotes[0]
                            : keyQuotes[0].text}
                          "
                        </p>
                        {typeof keyQuotes[0] === "object" &&
                          keyQuotes[0].speaker && (
                            <p className="text-sm font-semibold text-muted-foreground">
                              — {keyQuotes[0].speaker}
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {keyTakeaways.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-base font-semibold text-foreground mb-4">
                        Key Takeaways
                      </h3>
                      <ul className="space-y-3">
                        {keyTakeaways.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

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
      </main>
    </div>
  );
}

// --- Sub-Components ---

function ContentSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
        {title}
      </h2>
      <div className="prose prose-slate max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-headings:text-foreground">
        <p className="whitespace-pre-wrap text-base sm:text-lg">{content}</p>
      </div>
    </section>
  );
}
