import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { caseStudy } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";
import {
  BookText,
  Building,
  Calendar,
  Check,
  ArrowLeft,
  Eye,
  ExternalLink,
  Quote,
  Target,
  TrendingUp,
  Globe,
  Edit,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublishToggle } from "@/components/case-studies/publish-toggle";
import { Separator } from "@/components/ui/separator";

export default async function CaseStudyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  const [data] = await db
    .select()
    .from(caseStudy)
    .where(
      and(
        eq(caseStudy.id, params.id),
        eq(caseStudy.organizationId, organizationId)
      )
    );

  if (!data) {
    notFound();
  }

  const keyQuotes = safeParseJsonb(data.keyQuotes);
  const metrics = safeParseJsonb(data.metrics);
  const keyTakeaways = safeParseJsonb(data.keyTakeaways);

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
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">
                <BookText className="w-3 h-3 mr-1" />
                Case Study
              </Badge>
              {data.published ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  <Globe className="w-3 h-3 mr-1" />
                  Published
                </Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {data.title}
            </h1>
            {data.clientName && (
              <p className="text-lg text-muted-foreground">{data.clientName}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/projects/${data.projectId}/case-study`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            {data.published && data.publicSlug && (
              <Button asChild>
                <Link href={`/${data.publicSlug}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{data.summary}</p>
            </CardContent>
          </Card>

          {/* Challenge */}
          <Card>
            <CardHeader>
              <CardTitle>The Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {data.challenge}
              </p>
            </CardContent>
          </Card>

          {/* Solution */}
          <Card>
            <CardHeader>
              <CardTitle>The Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {data.solution}
              </p>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>The Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {data.results}
              </p>
            </CardContent>
          </Card>

          {/* Key Quotes */}
          {keyQuotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="w-5 h-5" />
                  Key Quotes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyQuotes.map((quote: string, i: number) => (
                  <div key={i} className="border-l-4 border-primary pl-5 py-2">
                    <p className="italic text-muted-foreground leading-relaxed">
                      "{quote}"
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Publishing */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PublishToggle
                caseStudyId={data.id}
                isPublished={data.published}
              />

              {data.published && data.publicSlug && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Public URL
                    </p>
                    <Link
                      href={`/${data.publicSlug}`}
                      target="_blank"
                      className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />/
                      {data.publicSlug}
                    </Link>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/${data.publicSlug}`} target="_blank">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                icon={<Building className="w-4 h-4" />}
                label="Industry"
                value={data.clientIndustry}
              />
              <Separator />
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Created"
                value={new Date(data.createdAt).toLocaleDateString()}
              />
              <Separator />
              <InfoRow
                icon={<Eye className="w-4 h-4" />}
                label="Views"
                value={data.viewCount.toLocaleString()}
              />
            </CardContent>
          </Card>

          {/* Metrics */}
          {metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.map((metric: { metric: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        {metric.metric}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Takeaways */}
          {keyTakeaways.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Key Takeaways
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {keyTakeaways.map((takeaway: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-1.5">•</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

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
