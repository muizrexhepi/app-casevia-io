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
  Check,
  Loader2,
  X,
  Building2,
  Quote,
  TrendingUp,
  Globe,
  Calendar,
} from "lucide-react";
import { updateCaseStudyContent } from "../actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
        toast.success("Changes saved successfully");
      } else {
        toast.error(result.error || "Failed to save changes");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Helper for generating markdown content for copy/export
  const generateMarkdown = (): string => {
    // Logic placeholder matching your existing implementation
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
    const toastId = toast.loading(`Preparing ${type.toUpperCase()}...`);

    try {
      const {
        generateMarkdown: genMd,
        generateHTML,
        generatePDF,
        downloadFile,
      } = await import("@/lib/export-utils");

      const filename = caseStudy.publicSlug || "case-study";
      const caseStudyData = { ...caseStudy };

      if (type === "markdown") {
        const content = genMd(caseStudyData, isFreePlan);
        downloadFile(content, `${filename}.md`, "text/markdown");
      } else if (type === "html") {
        const content = generateHTML(caseStudyData, isFreePlan);
        downloadFile(content, `${filename}.html`, "text/html");
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
      }

      toast.success(`${type.toUpperCase()} downloaded successfully`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <button
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-0 py-2"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Project
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  AI Generated
                </span>
                {isEditing && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Edit3 className="w-3 h-3" />
                    Editing
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {caseStudy.title}
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl">
                Review, edit, and export your generated case study.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCaseStudy(initialCaseStudy);
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Save Changes
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
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleDownload("markdown")}
                      >
                        <FileText className="w-4 h-4 mr-2" /> Markdown (.md)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload("html")}>
                        <FileCode className="w-4 h-4 mr-2" /> HTML (.html)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                        <FileText className="w-4 h-4 mr-2" /> PDF (.pdf)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={() =>
                      router.push(`/dashboard/case-studies/${caseStudy.id}`)
                    }
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <div className="p-6 lg:p-8">
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
                        className="text-lg font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="summary">Executive Summary</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Client Name</Label>
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
                        <Label htmlFor="clientIndustry">Industry</Label>
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
                    className="prose prose-slate dark:prose-invert max-w-none"
                  >
                    {/* View Mode Content */}
                    <div className="not-prose mb-8 p-4 bg-muted/30 border rounded-lg">
                      <div className="flex flex-wrap gap-6">
                        {caseStudy.clientName && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Client
                              </p>
                              <p className="font-semibold text-foreground">
                                {caseStudy.clientName}
                              </p>
                            </div>
                          </div>
                        )}
                        {caseStudy.clientIndustry && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Industry
                              </p>
                              <p className="font-semibold text-foreground">
                                {caseStudy.clientIndustry}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                              Created
                            </p>
                            <p className="font-semibold text-foreground">
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-lg leading-relaxed text-muted-foreground mb-8">
                      {caseStudy.summary}
                    </div>

                    <h3>The Challenge</h3>
                    <div className="whitespace-pre-wrap mb-6">
                      {caseStudy.challenge}
                    </div>

                    <h3>The Solution</h3>
                    <div className="whitespace-pre-wrap mb-6">
                      {caseStudy.solution}
                    </div>

                    <h3>The Results</h3>
                    <div className="whitespace-pre-wrap mb-6">
                      {caseStudy.results}
                    </div>

                    {caseStudy.metrics && caseStudy.metrics.length > 0 && (
                      <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">
                        {caseStudy.metrics.map((metric: any, i: number) => (
                          <div
                            key={i}
                            className="bg-card border rounded-lg p-4 flex items-start gap-3 shadow-sm"
                          >
                            <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xl font-bold text-foreground">
                                {metric.metric}
                              </p>
                              <p className="text-sm text-muted-foreground leading-tight mt-1">
                                {metric.quote}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0 && (
                      <div className="not-prose my-8 space-y-4">
                        {caseStudy.keyQuotes.map((quote: string, i: number) => (
                          <div
                            key={i}
                            className="relative pl-6 border-l-4 border-primary/20 italic text-muted-foreground"
                          >
                            <Quote className="absolute -left-3 -top-3 w-6 h-6 text-muted-foreground/20 fill-current" />
                            "{quote}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions Widget */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <h3 className="font-medium text-sm text-foreground mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => handleCopy(generateMarkdown())}
                  className="w-full text-left group bg-muted/30 border border-transparent hover:border-border rounded-lg p-3 transition-all hover:shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="p-1.5 bg-background rounded-md shadow-sm border shrink-0 h-fit group-hover:text-primary transition-colors">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Copy Content
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Copy Markdown to clipboard
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    router.push(`/dashboard/projects/${project.id}/transcript`)
                  }
                  className="w-full text-left group bg-muted/30 border border-transparent hover:border-border rounded-lg p-3 transition-all hover:shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="p-1.5 bg-background rounded-md shadow-sm border shrink-0 h-fit group-hover:text-primary transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        View Transcript
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        See original interview text
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Publishing Widget */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-medium text-sm text-foreground">
                  Ready to Publish?
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                When you're happy with the draft, continue to the publishing
                flow to generate social assets.
              </p>

              <Button
                onClick={() =>
                  router.push(`/dashboard/case-studies/${caseStudy.id}`)
                }
                className="w-full"
                variant="default"
              >
                Continue to Publish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
