// app/dashboard/templates/preview/[templateId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TEMPLATES,
  ModernTemplate,
  ProfessionalTemplate,
  TemplateProps,
} from "@/lib/templates";

// Sample preview data
const PREVIEW_DATA: TemplateProps["caseStudy"] = {
  title: "How TechCorp Reduced Infrastructure Costs by 60% While Scaling 5x",
  summary:
    "TechCorp transformed their cloud infrastructure to handle 500% more traffic while cutting AWS costs by 60% through strategic optimization.",
  clientName: "TechCorp Solutions",
  clientIndustry: "SaaS & Cloud Services",
  challenge: `TechCorp was experiencing rapid growth but their infrastructure costs were growing even faster. During peak traffic periods, their systems struggled to maintain performance, resulting in a 15% downtime rate that was affecting customer satisfaction and revenue.

The engineering team had tried multiple solutions - vertical scaling, load balancers, and CDN optimization - but nothing addressed the root cause. Their monolithic architecture was becoming a bottleneck, and the manual deployment process meant that pushing critical fixes took hours instead of minutes.

The stakes were high: their largest enterprise clients were threatening to leave if reliability didn't improve, and the board was questioning whether the company could profitably scale.`,

  solution: `After a comprehensive infrastructure audit, we implemented a three-phase transformation strategy. First, we decoupled their monolithic application into microservices, allowing each component to scale independently based on demand.

Phase two focused on implementing a serverless architecture using AWS Lambda and Kubernetes for container orchestration. This allowed TechCorp to only pay for actual compute time rather than maintaining idle servers. We also implemented auto-scaling policies that could respond to traffic spikes in under 30 seconds.

The final phase involved setting up a robust CI/CD pipeline with automated testing and blue-green deployments. This reduced deployment time from 4 hours to just 8 minutes, and eliminated the fear of pushing updates during business hours.`,

  results: `The transformation exceeded all expectations. Infrastructure costs dropped by 60% in the first quarter alone, despite handling 5x the traffic volume. System uptime improved to 99.99%, effectively eliminating the downtime issues that were plaguing customer relationships.

Developer productivity skyrocketed - the team went from shipping updates once a week to multiple times per day. The automated testing caught issues before they reached production, and the ability to rapidly deploy meant customer-reported bugs were fixed within hours instead of days.

Most importantly, TechCorp retained their enterprise clients and closed three major deals that had been on hold due to infrastructure concerns. The CTO reported that the new architecture would support growth to 10x current scale without significant additional investment.`,

  metrics: [
    {
      metric: "60% cost reduction",
      quote: "We're handling 5x the traffic at 40% of the previous cost",
    },
    {
      metric: "99.99% uptime",
      quote: "We haven't had a single customer-impacting outage in 6 months",
    },
    {
      metric: "5x deployment speed",
      quote: "From 4 hours to 8 minutes - it completely changed how we ship",
    },
    {
      metric: "500% traffic growth",
      quote: "The system scales automatically now, we barely think about it",
    },
  ],

  keyQuotes: [
    "The new architecture completely transformed how we think about shipping code. We went from being terrified of deployments to doing them multiple times a day.",
    "Our AWS bill dropped by 60% in the first month. When I showed the board, they thought there was a mistake in the calculation.",
    "We retained three enterprise clients who were ready to leave due to reliability issues. The ROI on this project was immediate.",
    "The auto-scaling alone saved us during Black Friday. Previous years we'd crash within the first hour. This year we didn't even notice the traffic spike.",
    "Our engineering team is happier and more productive. No more late-night firefighting or weekend deployments.",
  ],

  keyTakeaways: [
    "Microservices architecture enables independent scaling of bottleneck components without over-provisioning the entire system",
    "Serverless + auto-scaling can reduce infrastructure costs by 50-70% for workloads with variable traffic patterns",
    "CI/CD automation isn't just about speed - it dramatically reduces deployment anxiety and improves team morale",
    "Modern cloud-native architecture can support 10x growth without proportional cost increases",
    "The biggest ROI often comes from improved reliability and customer retention, not just direct cost savings",
  ],

  customBranding: undefined,
};

export default function TemplatePreviewPage({
  params,
}: {
  params: { templateId: string };
}) {
  const template = TEMPLATES.find((t) => t.id === params.templateId);

  if (!template) {
    notFound();
  }

  const renderTemplate = () => {
    const props: TemplateProps = {
      caseStudy: PREVIEW_DATA,
      template: template,
    };

    switch (params.templateId) {
      case "professional":
        return <ProfessionalTemplate {...props} />;
      case "modern":
      default:
        return <ModernTemplate {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/templates">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Templates
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">{template.name}</h1>
                <Badge variant="secondary" className="capitalize">
                  {template.tier}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Preview Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Content */}
      <main>{renderTemplate()}</main>

      {/* Preview Footer */}
      <div className="border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              This is a preview with sample data. Your actual case study will
              use your project's content.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/templates">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Browse Templates
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
