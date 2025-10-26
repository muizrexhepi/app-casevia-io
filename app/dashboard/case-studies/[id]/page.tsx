// app/dashboard/case-studies/[id]/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { caseStudy } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import {
  BookText,
  Building,
  Calendar,
  Check,
  ChevronLeft,
  Eye,
  Link as LinkIcon,
  Quote,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublishToggle } from "@/components/case-studies/publish-toggle";

export default async function CaseStudyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Get authenticated session
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  // Fetch the specific case study, ensuring it belongs to the user's org
  const [data] = await db
    .select()
    .from(caseStudy)
    .where(
      and(
        eq(caseStudy.id, params.id), // This line was fine, the error was misleading
        eq(caseStudy.organizationId, organizationId)
      )
    );

  // If no case study found (or doesn't belong to org), show 404
  if (!data) {
    notFound();
  }

  // Safely parse JSONB fields
  const keyQuotes = safeParseJsonb(data.keyQuotes);
  const metrics = safeParseJsonb(data.metrics);
  const keyTakeaways = safeParseJsonb(data.keyTakeaways);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <Link
              href="/dashboard/case-studies"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Case Studies
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {data.title}
            </h1>
            <p className="text-lg text-muted-foreground">{data.clientName}</p>
          </div>
          {data.published && data.publicSlug && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/${data.publicSlug}`} target="_blank">
                <Eye className="w-4 h-4 mr-2" />
                View Live Page
              </Link>
            </Button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column (Content) */}
          <div className="md:col-span-2 space-y-6">
            <CaseStudySection title="Summary" content={data.summary} />
            <CaseStudySection title="Challenge" content={data.challenge} />
            <CaseStudySection title="Solution" content={data.solution} />
            <CaseStudySection title="Results" content={data.results} />

            {/* Key Quotes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="w-5 h-5" />
                  Key Quotes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyQuotes.length > 0 ? (
                  keyQuotes.map((quote: string, i: number) => (
                    <blockquote
                      key={i}
                      className="border-l-4 border-border pl-4 italic text-muted-foreground"
                    >
                      {quote}
                    </blockquote>
                  ))
                ) : (
                  <p className="text-muted-foreground">No key quotes found.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Sidebar) */}
          <aside className="md:col-span-1 space-y-6 md:sticky md:top-6">
            {/* Publish Card */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Status</CardTitle>
                <CardDescription>
                  {data.published
                    ? "Your case study is live."
                    : "Your case study is a draft."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PublishToggle
                  caseStudyId={data.id}
                  isPublished={data.published}
                />
                {data.published && data.publicSlug && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-muted-foreground">
                      Public URL
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <Link
                        href={`/${data.publicSlug}`}
                        target="_blank"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {`/${data.publicSlug}`}
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Building className="w-4 h-4" />}
                  label="Client Industry"
                  value={data.clientIndustry}
                />
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Created"
                  value={new Date(data.createdAt).toLocaleDateString()}
                />
                <InfoRow
                  icon={<Eye className="w-4 h-4" />}
                  label="Views"
                  value={data.viewCount.toString()}
                />
              </CardContent>
            </Card>

            {/* Metrics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-none space-y-2">
                  {metrics.length > 0 ? (
                    metrics.map((metric: { metric: string }, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-1" />
                        <span className="text-sm">{metric.metric}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No metrics found.
                    </p>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Key Takeaways Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookText className="w-5 h-5" />
                  Key Takeaways
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {keyTakeaways.length > 0 ? (
                    keyTakeaways.map((takeaway: string, i: number) => (
                      <li key={i} className="text-sm">
                        {takeaway}
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No takeaways found.
                    </p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying content sections
function CaseStudySection({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use whitespace-pre-wrap to respect newlines in the content */}
        <p className="text-foreground whitespace-pre-wrap">
          {content || "N/A"}
        </p>
      </CardContent>
    </Card>
  );
}

// Helper component for detail rows
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">
        {value || "N/A"}
      </span>
    </div>
  );
}

/**
 * Safely parses a JSONB field that might be a string or already an object.
 * Returns an array, defaulting to an empty one on failure.
 */
function safeParseJsonb(jsonb: any, defaultValue: any[] = []): any[] {
  if (!jsonb) {
    return defaultValue;
  }
  if (typeof jsonb === "object" && jsonb !== null) {
    // It's already parsed (Drizzle/pg-driver did its job)
    return Array.isArray(jsonb) ? jsonb : defaultValue;
  }
  if (typeof jsonb === "string") {
    // It's a string, needs parsing
    try {
      const parsed = JSON.parse(jsonb);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
      // It's a malformed string (like "Their profit...")
      return defaultValue;
    }
  }
  // Not an object or string, return default
  return defaultValue;
}
