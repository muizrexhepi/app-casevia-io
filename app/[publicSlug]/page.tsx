// app/[publicSlug]/page.tsx
import { db } from "@/lib/drizzle";
import { caseStudy, organization } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building,
  Calendar,
  Quote,
  Target,
  BookText,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have this
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming you have this

// --- Helper Functions ---

/**
 * Safely parses a JSONB field that might be a string or already an object.
 * Returns an array, defaulting to an empty one on failure.
 */
function safeParseJsonb(jsonb: any, defaultValue: any[] = []): any[] {
  if (!jsonb) {
    return defaultValue;
  }
  if (typeof jsonb === "object" && jsonb !== null) {
    return Array.isArray(jsonb) ? jsonb : defaultValue;
  }
  if (typeof jsonb === "string") {
    try {
      const parsed = JSON.parse(jsonb);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

/**
 * Extracts the first number (int, float, percent) from a string.
 */
function extractMetric(str: string): { value: string; label: string } {
  const match = str.match(/([\d.,]+%?)/);
  if (match) {
    const value = match[1];
    const label = str.replace(match[0], "").trim();
    return { value, label };
  }
  return { value: "", label: str };
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
    title: data.seoTitle,
    description: data.seoDescription,
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

  // 2. Fetch Agency/Organization Details for Branding
  const [org] = await db
    .select({ name: organization.name, logo: organization.logo })
    .from(organization)
    .where(eq(organization.id, data.organizationId));

  // 3. Increment View Count (makes page dynamic)
  await db
    .update(caseStudy)
    .set({ viewCount: data.viewCount + 1 })
    .where(eq(caseStudy.id, data.id));

  // 4. Set Branding Colors
  const branding = data.customBranding || {};
  const agencyLogo = branding.logo || org?.logo || null;
  const agencyName = org?.name || "Our Agency";
  const primaryColor = branding.primaryColor || "#2563EB"; // Default: blue-600

  // 5. Safely Parse JSON data
  const keyQuotes = safeParseJsonb(data.keyQuotes);
  const metrics = safeParseJsonb(data.metrics);
  const keyTakeaways = safeParseJsonb(data.keyTakeaways);

  return (
    <div className="bg-white text-gray-900">
      {/* 1. Agency Header */}
      <PageHeader logo={agencyLogo} name={agencyName} />

      <main>
        {/* 2. Hero Section */}
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="font-semibold" style={{ color: primaryColor }}>
              Case Study: {data.clientName}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mt-2 mb-6">
              {data.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {data.summary}
            </p>
          </div>
        </section>

        {/* 3. Stats Bar */}
        {metrics.length > 0 && (
          <section className="bg-gray-800 text-white py-12">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {metrics.map((metric: { metric: string }, i: number) => (
                  <StatCard key={i} metric={metric.metric} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Main Content (2-Column Layout) */}
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Narrative */}
            <article className="lg:col-span-2 prose prose-lg max-w-none prose-p:whitespace-pre-wrap prose-headings:font-semibold">
              <Section
                title="The Challenge"
                content={data.challenge}
                color={primaryColor}
              />
              <Section
                title="The Solution"
                content={data.solution}
                color={primaryColor}
              />
              <Section
                title="The Results"
                content={data.results}
                color={primaryColor}
              />
            </article>

            {/* Right Column: Sticky Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-10 space-y-8">
                <StickySidebar
                  clientName={data.clientName}
                  clientIndustry={data.clientIndustry}
                  takeaways={keyTakeaways}
                  quote={keyQuotes[0]} // Show the first quote
                  color={primaryColor}
                />
              </div>
            </aside>
          </div>
        </div>

        {/* 5. Call to Action (CTA) */}
        <CtaSection agencyName={agencyName} color={primaryColor} />
      </main>

      {/* 6. Agency Footer */}
      <PageFooter agencyName={agencyName} />
    </div>
  );
}

// --- Sub-Components ---

function PageHeader({ logo, name }: { logo: string | null; name: string }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={`${name} Logo`} className="h-8 w-auto" />
          ) : (
            <span className="font-bold text-xl">{name}</span>
          )}
        </div>
        <Button
          asChild
          style={{
            backgroundColor: (PageHeader as any).primaryColor,
            color: "white",
          }}
        >
          <Link href="#contact">Contact Sales</Link>
        </Button>
      </nav>
    </header>
  );
}

function StatCard({ metric }: { metric: string }) {
  const { value, label } = extractMetric(metric);
  return (
    <div className="bg-gray-700 p-6 rounded-lg text-center">
      {value ? (
        <>
          <span className="text-4xl font-bold text-white">{value}</span>
          <p className="text-gray-300 mt-2">{label}</p>
        </>
      ) : (
        <p className="text-lg text-gray-200">{label}</p>
      )}
    </div>
  );
}

function Section({
  title,
  content,
  color,
}: {
  title: string;
  content: string | null;
  color: string;
}) {
  if (!content) return null;
  return (
    <section className="mb-12">
      <h2
        className="text-3xl font-semibold mb-4 pb-2"
        style={{ borderBottom: `3px solid ${color}` }}
      >
        {title}
      </h2>
      <p className="text-gray-700">{content}</p>
    </section>
  );
}

function StickySidebar({
  clientName,
  clientIndustry,
  takeaways,
  quote,
  color,
}: {
  clientName: string | null;
  clientIndustry: string | null;
  takeaways: string[];
  quote: string | null;
  color: string;
}) {
  return (
    <>
      <Card className="border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle>About the Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoItem icon={<Building />} label="Client" value={clientName} />
          <InfoItem
            icon={<Building />}
            label="Industry"
            value={clientIndustry}
          />
        </CardContent>
      </Card>

      {takeaways.length > 0 && (
        <Card className="border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="w-5 h-5" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {takeaways.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Check
                    className="w-5 h-5 shrink-0 mt-0.5"
                    style={{ color }}
                  />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {quote && (
        <div className="relative">
          <Quote
            className="w-16 h-16 absolute -top-4 -left-4"
            style={{ color }}
            fillOpacity={0.1}
            fill={color}
          />
          <blockquote
            className="text-xl italic font-medium text-gray-800 pl-4 py-4"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            {quote}
          </blockquote>
        </div>
      )}
    </>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-800 flex items-center gap-2">
        {icon}
        {value}
      </p>
    </div>
  );
}

function CtaSection({
  agencyName,
  color,
}: {
  agencyName: string;
  color: string;
}) {
  return (
    <section id="contact" className="bg-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Ready to achieve similar results?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Let {agencyName} help you overcome your challenges and reach your
          goals. Get in touch with our team today to start your project.
        </p>
        <Button
          size="lg"
          asChild
          style={{ backgroundColor: color, color: "white" }}
          className="text-lg font-semibold px-8 py-6"
        >
          <Link href="#">
            Contact Us <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function PageFooter({ agencyName }: { agencyName: string }) {
  return (
    <footer className="bg-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-8 text-center">
        <p>
          &copy; {new Date().getFullYear()} {agencyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
