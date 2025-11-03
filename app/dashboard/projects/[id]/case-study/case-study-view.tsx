"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Copy,
  Share2,
  Eye,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  socialPosts: any[];
}

export function CaseStudyView({
  project,
  caseStudy: initialCaseStudy,
  socialPosts,
}: CaseStudyViewProps) {
  const router = useRouter();
  const { currentPlan } = useSubscription();
  const [activeTab, setActiveTab] = useState("content");
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
    return `# ${caseStudy.title}

${caseStudy.summary}

## Client Information
- **Company:** ${caseStudy.clientName || "N/A"}
- **Industry:** ${caseStudy.clientIndustry || "N/A"}

## The Challenge
${caseStudy.challenge}

## The Solution
${caseStudy.solution}

## The Results
${caseStudy.results}

${
  caseStudy.metrics?.length > 0
    ? `## Key Metrics\n${caseStudy.metrics
        .map((m: any) => `- **${m.metric}**\n  > "${m.quote}"`)
        .join("\n")}`
    : ""
}

${isFreePlan ? "\n---\n*Generated with Casevia*" : ""}`;
  };

  const handleDownload = (type: "markdown" | "html" | "pdf") => {
    if (type === "markdown") {
      const content = generateMarkdown();
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${caseStudy.publicSlug || "case-study"}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
    // Add other export handlers as needed
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
              Review, edit, and publish your case study
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
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
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
                    <DropdownMenuItem disabled={isEditing || isExporting}>
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button>
                  <Share2 className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="w-4 h-4 mr-2" />
            Social Posts
            {socialPosts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {socialPosts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
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
                    <h1 className="text-3xl font-bold mb-4">
                      {caseStudy.title}
                    </h1>
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
                        {caseStudy.keyQuotes.map(
                          (quote: string, idx: number) => (
                            <blockquote key={idx}>"{quote}"</blockquote>
                          )
                        )}
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
                      router.push(
                        `/dashboard/projects/${project.id}/transcript`
                      )
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Transcript
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      router.push(`/dashboard/projects/${project.id}`)
                    }
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Project
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="rounded-xl border bg-muted/50 p-5">
                <h3 className="font-semibold mb-3">Publishing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Make your case study public and share it with your audience.
                </p>
                <Button className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Publish Case Study
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <div className="grid gap-4">
            {socialPosts.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-12 text-center">
                <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No social posts generated yet
                </p>
              </div>
            ) : (
              socialPosts.map((post, idx) => {
                const isLinkedIn = post.platform === "linkedin";
                const isX = post.platform === "x";
                const postContent = isX
                  ? JSON.parse(post.content).join("\n\n")
                  : post.content;

                return (
                  <div key={idx} className="rounded-xl border bg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                            isLinkedIn
                              ? "bg-blue-600"
                              : "bg-black dark:bg-white"
                          )}
                        >
                          <span className={isLinkedIn ? "" : "dark:text-black"}>
                            {isLinkedIn ? "in" : "𝕏"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {isLinkedIn ? "LinkedIn" : "X (Twitter)"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Ready to publish
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(postContent)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      {isX ? (
                        <div className="space-y-3">
                          {JSON.parse(post.content).map(
                            (tweet: string, tweetIdx: number) => (
                              <div
                                key={tweetIdx}
                                className="pb-3 border-b last:border-b-0 last:pb-0"
                              >
                                <span className="text-xs text-muted-foreground block mb-1">
                                  Tweet {tweetIdx + 1}
                                </span>
                                <p className="whitespace-pre-wrap">{tweet}</p>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
