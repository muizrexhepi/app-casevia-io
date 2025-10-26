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
  Mail, // New Icon
  Globe, // New Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- Helper Functions ---

/**
 * Safely parses a JSONB field that might be a string or already an object.
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

/**
 * NEW: Converts hex to RGB for use in rgba()
 */
function hexToRgb(hex: string) {
  let c: any = hex.substring(1).split("");
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = "0x" + c.join("");
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
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

  // 2. Fetch Agency/Organization Details
  const [org] = await db
    .select({ name: organization.name, logo: organization.logo })
    .from(organization)
    .where(eq(organization.id, data.organizationId));

  // 3. Increment View Count
  await db
    .update(caseStudy)
    .set({ viewCount: data.viewCount + 1 })
    .where(eq(caseStudy.id, data.id));

  // 4. Set Branding Colors
  const branding = data.customBranding || {};
  const agencyLogo = branding.logo || org?.logo || null;
  const agencyName = org?.name || "Our Agency";
  const primaryColor = branding.primaryColor || "#2563EB"; // Default: blue-600
  // NEW: Create a light shade for backgrounds
  const rgb = hexToRgb(primaryColor);
  const lightPrimaryColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.05)`; // 5% opacity

  // 5. Safely Parse JSON data
  const keyQuotes = safeParseJsonb(data.keyQuotes);
  const metrics = safeParseJsonb(data.metrics);
  const keyTakeaways = safeParseJsonb(data.keyTakeaways);

  return (
    <div className="bg-white text-gray-900 antialiased">
      {/* 1. UPGRADED Agency Header (Sticky + Blur) */}
      <PageHeader logo={agencyLogo} name={agencyName} color={primaryColor} />

      <main>
        {/* 2. UPGRADED Hero Section */}
        <HeroSection
          agencyName={agencyName}
          clientName={data.clientName}
          title={data.title}
          summary={data.summary}
          primaryColor={primaryColor}
          lightPrimaryColor={lightPrimaryColor}
        />

        {/* 3. UPGRADED Stats Bar */}
        {metrics.length > 0 && (
          <MetricsBar metrics={metrics} color={primaryColor} />
        )}

        {/* 4. Main Content (2-Column Layout) */}
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Left Column: Narrative (UPGRADED Section styling) */}
            <article className="lg:col-span-2 space-y-12">
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

            {/* Right Column: Sticky Sidebar (UPGRADED with Client Logo) */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-28 space-y-8">
                <StickySidebar
                  clientName={data.clientName}
                  clientIndustry={data.clientIndustry}
                  clientLogo={(data as any).clientLogo} // Assumes 'clientLogo' field exists
                  takeaways={keyTakeaways}
                  quote={keyQuotes[0]}
                  color={primaryColor}
                />
              </div>
            </aside>
          </div>
        </div>

        {/* 5. UPGRADED Call to Action (CTA) */}
        <CtaSection
          agencyName={agencyName}
          color={primaryColor}
          lightColor={lightPrimaryColor}
        />
      </main>

      {/* 6. UPGRADED Agency Footer */}
      <PageFooter agencyName={agencyName} logo={agencyLogo} />
    </div>
  );
}

// --- Sub-Components (Overhauled) ---

function PageHeader({
  logo,
  name,
  color,
}: {
  logo: string | null;
  name: string;
  color: string;
}) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {logo ? (
            <img src={logo} alt={`${name} Logo`} className="h-8 w-auto" />
          ) : (
            <span className="font-bold text-xl">{name}</span>
          )}
        </Link>
        <Button
          asChild
          style={{ backgroundColor: color, color: "white" }}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          <Link href="#contact">Contact Sales</Link>
        </Button>
      </nav>
    </header>
  );
}

function HeroSection({
  agencyName,
  clientName,
  title,
  summary,
  primaryColor,
  lightPrimaryColor,
}: {
  agencyName: string;
  clientName: string | null;
  title: string;
  summary: string | null;
  primaryColor: string;
  lightPrimaryColor: string;
}) {
  return (
    <section
      className="py-20 md:py-28"
      style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, ${lightPrimaryColor} 0%, transparent 40%),
                         radial-gradient(circle at 80% 90%, ${lightPrimaryColor} 0%, transparent 40%)`,
      }}
    >
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="mb-4">
          <Link
            href="/work" // Assumes an agency "work" or "portfolio" page
            className="text-sm font-medium"
            style={{ color: primaryColor }}
          >
            {agencyName} Case Studies <span className="opacity-50">/</span>{" "}
            {clientName}
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mt-2 mb-6">
          {title}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">{summary}</p>
      </div>
    </section>
  );
}

function MetricsBar({
  metrics,
  color,
}: {
  metrics: { metric: string }[];
  color: string;
}) {
  return (
    <section className="bg-gray-900 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric: { metric: string }, i: number) => {
            const { value, label } = extractMetric(metric.metric);
            return (
              <div key={i} className="text-center">
                {value ? (
                  <>
                    <span className="text-5xl font-bold" style={{ color }}>
                      {value}
                    </span>
                    <p className="text-gray-300 mt-2 text-lg">{label}</p>
                  </>
                ) : (
                  <p className="text-lg text-gray-200">{label}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
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
    <section>
      <div className="mb-4">
        <span
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          {title}
        </span>
      </div>
      {/* Use prose for nice defaults, but override p color for better contrast */}
      <div className="prose prose-lg max-w-none prose-p:text-gray-700 prose-p:whitespace-pre-wrap">
        <p>{content}</p>
      </div>
    </section>
  );
}

function StickySidebar({
  clientName,
  clientIndustry,
  clientLogo,
  takeaways,
  quote,
  color,
}: {
  clientName: string | null;
  clientIndustry: string | null;
  clientLogo?: string | null; // Assumed field
  takeaways: string[];
  quote: string | null;
  color: string;
}) {
  return (
    <>
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle>About {clientName}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {clientLogo && (
            <div className="flex items-center justify-center p-4 bg-white rounded-lg">
              <img
                src={clientLogo}
                alt={`${clientName} Logo`}
                className="max-h-16 w-auto"
              />
            </div>
          )}
          <InfoItem
            icon={<Building className="text-gray-400" />}
            label="Industry"
            value={clientIndustry}
          />
        </CardContent>
      </Card>

      {takeaways.length > 0 && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="w-5 h-5" style={{ color }} />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {takeaways.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
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
        <blockquote
          className="text-lg italic font-medium text-gray-800 p-4 rounded-lg"
          style={{
            borderLeft: `4px solid ${color}`,
            backgroundColor: `rgba(${hexToRgb(color).join(", ")}, 0.05)`,
          }}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
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
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-1">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function CtaSection({
  agencyName,
  color,
  lightColor,
}: {
  agencyName: string;
  color: string;
  lightColor: string;
}) {
  return (
    <section id="contact" style={{ backgroundColor: lightColor }}>
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to build your success story?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl">
              Let {agencyName} help you overcome your challenges and reach your
              goals. Get in touch with our team today to start your project.
            </p>
          </div>
          {/* Right Column: Contact Card */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4">Speak to an expert</h3>
            <p className="text-gray-600 mb-6">
              We're ready to help. Fill out our form or email us directly.
            </p>
            <div className="space-y-4">
              <Button
                size="lg"
                asChild
                style={{ backgroundColor: color, color: "white" }}
                className="w-full text-base font-semibold py-6"
              >
                <Link href="#">
                  Contact Us <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full text-base font-semibold py-6 border-gray-300"
              >
                <Link href="mailto:sales@agency.com">
                  <Mail className="w-5 h-5 mr-2" />
                  sales@agency.com
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PageFooter({
  agencyName,
  logo,
}: {
  agencyName: string;
  logo: string | null;
}) {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Column 1: Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              {logo ? (
                <img
                  src={logo}
                  alt={`${agencyName} Logo`}
                  className="h-8 w-auto filter grayscale invert"
                />
              ) : (
                <span className="font-bold text-xl text-white">
                  {agencyName}
                </span>
              )}
            </Link>
            <p className="text-base max-w-xs">
              Delivering measurable results for ambitious brands.
            </p>
          </div>
          {/* Column 2: Services */}
          <div>
            <h4 className="font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-white">
                  Marketing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Design
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Development
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Strategy
                </Link>
              </li>
            </ul>
          </div>
          {/* Column 3: Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          {/* Column 4: Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <p>
            &copy; {new Date().getFullYear()} {agencyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
