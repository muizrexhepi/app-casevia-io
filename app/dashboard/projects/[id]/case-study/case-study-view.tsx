"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Copy,
  Share2,
  Edit3,
  Sparkles,
  FileText,
  FileCode,
  Save,
  Loader2,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import { updateCaseStudyContent } from "../actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSubscription } from "@/components/providers/subscription-provider";
import { cn } from "@/lib/utils";

interface CaseStudyViewProps {
  project: any;
  caseStudy: any;
}

export function CaseStudyView({
  project,
  caseStudy: initialCaseStudy,
}: CaseStudyViewProps) {
  const router = useRouter();
  const { currentPlan } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [caseStudy, setCaseStudy] = useState(initialCaseStudy);
  const previewRef = useRef<HTMLDivElement>(null);

  const isFreePlan = currentPlan?.id === "free";

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await updateCaseStudyContent(caseStudy.id, {
        title: caseStudy.title,
        summary: caseStudy.summary,
        clientName: caseStudy.clientName,
        clientIndustry: caseStudy.clientIndustry,
        challenge: caseStudy.challenge,
        solution: caseStudy.solution,
        results: caseStudy.results,
        keyQuotes: caseStudy.keyQuotes,
        metrics: caseStudy.metrics,
        keyTakeaways: caseStudy.keyTakeaways,
      });

      if (result.success) {
        setIsEditing(false);
        router.refresh();
        toast.success("Case study saved successfully!");
      } else {
        toast.error(result.error || "Failed to save case study");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const generateMarkdown = (): string => {
    // Use the export-utils version for consistency
    const { generateMarkdown: genMd } = require("@/lib/export-utils");
    return genMd(
      {
        title: caseStudy.title,
        summary: caseStudy.summary,
        clientName: caseStudy.clientName,
        clientIndustry: caseStudy.clientIndustry,
        challenge: caseStudy.challenge,
        solution: caseStudy.solution,
        results: caseStudy.results,
        metrics: caseStudy.metrics,
        keyQuotes: caseStudy.keyQuotes,
        keyTakeaways: caseStudy.keyTakeaways,
        publicSlug: caseStudy.publicSlug,
      },
      isFreePlan
    );
  };

  const handleDownload = async (type: "markdown" | "html" | "pdf") => {
    setIsExporting(true);

    try {
      const {
        generateMarkdown: genMd,
        generateHTML,
        generatePDF,
        downloadFile,
      } = await import("@/lib/export-utils");
      const filename = caseStudy.publicSlug || "case-study";

      // Prepare case study data
      const caseStudyData = {
        title: caseStudy.title,
        summary: caseStudy.summary,
        clientName: caseStudy.clientName,
        clientIndustry: caseStudy.clientIndustry,
        challenge: caseStudy.challenge,
        solution: caseStudy.solution,
        results: caseStudy.results,
        metrics: caseStudy.metrics,
        keyQuotes: caseStudy.keyQuotes,
        keyTakeaways: caseStudy.keyTakeaways,
        publicSlug: caseStudy.publicSlug,
      };

      if (type === "markdown") {
        const content = genMd(caseStudyData, isFreePlan);
        downloadFile(content, `${filename}.md`, "text/markdown");
        toast.success("Markdown file downloaded!");
      } else if (type === "html") {
        const content = generateHTML(caseStudyData, isFreePlan);
        downloadFile(content, `${filename}.html`, "text/html");
        toast.success("HTML file downloaded!");
      } else if (type === "pdf") {
        const blob = await generatePDF(caseStudyData, isFreePlan);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PDF file downloaded!");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePublish = () => {
    // Navigate to the case study detail page where they can actually publish
    router.push(`/dashboard/case-studies/${caseStudy.id}`);
  };

  return (
    <div className="container mx-auto max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
              {isEditing && (
                <Badge variant="outline">
                  <Edit3 className="w-3 h-3 mr-1" />
                  Editing
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {caseStudy.title}
            </h1>
            <p className="text-muted-foreground">
              Review and edit your case study draft
            </p>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCaseStudy(initialCaseStudy);
                    setIsEditing(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDownload("markdown")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("html")}>
                      <FileCode className="w-4 h-4 mr-2" />
                      HTML (.html)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handlePublish}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Continue to Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-8">
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={caseStudy.title}
                    onChange={(e) =>
                      setCaseStudy({ ...caseStudy, title: e.target.value })
                    }
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={caseStudy.summary}
                    onChange={(e) =>
                      setCaseStudy({
                        ...caseStudy,
                        summary: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-xs">
                      Client Name
                    </Label>
                    <Input
                      id="clientName"
                      value={caseStudy.clientName || ""}
                      onChange={(e) =>
                        setCaseStudy({
                          ...caseStudy,
                          clientName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientIndustry" className="text-xs">
                      Industry
                    </Label>
                    <Input
                      id="clientIndustry"
                      value={caseStudy.clientIndustry || ""}
                      onChange={(e) =>
                        setCaseStudy({
                          ...caseStudy,
                          clientIndustry: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenge">The Challenge</Label>
                  <Textarea
                    id="challenge"
                    value={caseStudy.challenge}
                    onChange={(e) =>
                      setCaseStudy({
                        ...caseStudy,
                        challenge: e.target.value,
                      })
                    }
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solution">The Solution</Label>
                  <Textarea
                    id="solution"
                    value={caseStudy.solution}
                    onChange={(e) =>
                      setCaseStudy({
                        ...caseStudy,
                        solution: e.target.value,
                      })
                    }
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="results">The Results</Label>
                  <Textarea
                    id="results"
                    value={caseStudy.results}
                    onChange={(e) =>
                      setCaseStudy({
                        ...caseStudy,
                        results: e.target.value,
                      })
                    }
                    rows={6}
                  />
                </div>
              </div>
            ) : (
              <div
                ref={previewRef}
                className="prose dark:prose-invert max-w-none"
              >
                <h1 className="text-3xl font-bold mb-4">{caseStudy.title}</h1>
                <p className="text-lg text-muted-foreground lead mb-8">
                  {caseStudy.summary}
                </p>

                {(caseStudy.clientName || caseStudy.clientIndustry) && (
                  <div className="not-prose bg-muted rounded-lg p-5 my-8 border">
                    <div className="grid grid-cols-2 gap-4">
                      {caseStudy.clientName && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Client
                          </p>
                          <p className="text-sm font-semibold">
                            {caseStudy.clientName}
                          </p>
                        </div>
                      )}
                      {caseStudy.clientIndustry && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Industry
                          </p>
                          <p className="text-sm font-semibold">
                            {caseStudy.clientIndustry}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <h2>The Challenge</h2>
                <p className="whitespace-pre-wrap">{caseStudy.challenge}</p>

                <h2>The Solution</h2>
                <p className="whitespace-pre-wrap">{caseStudy.solution}</p>

                <h2>The Results</h2>
                <p className="whitespace-pre-wrap">{caseStudy.results}</p>

                {caseStudy.metrics && caseStudy.metrics.length > 0 && (
                  <>
                    <h2>Key Metrics</h2>
                    <div className="not-prose grid gap-4 my-6">
                      {caseStudy.metrics.map((metric: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5"
                        >
                          <p className="text-2xl font-bold text-primary mb-2">
                            {metric.metric}
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            "{metric.quote}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0 && (
                  <>
                    <h2>Customer Quotes</h2>
                    {caseStudy.keyQuotes.map((quote: string, idx: number) => (
                      <blockquote key={idx}>"{quote}"</blockquote>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleCopy(generateMarkdown())}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Content
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}/transcript`)
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                View Transcript
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
            </div>
          </div>

          {/* Publishing Info */}
          <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-5">
            <h3 className="font-semibold mb-3">Ready to Publish?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              When you're done editing, continue to the publishing page to make
              your case study live and generate social posts.
            </p>
            <Button className="w-full" onClick={handlePublish}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Continue to Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
