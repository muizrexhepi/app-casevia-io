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
} from "lucide-react";

import { updateCaseStudyContent } from "../actions";
import { toast } from "sonner"; // Using sonner for toasts

// Shadcn/ui Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentPlan } from "@/components/providers/subscription-provider";

// Assuming a custom hook for plan management

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
  const currentPlan = useCurrentPlan();
  const [activeTab, setActiveTab] = useState("preview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [caseStudy, setCaseStudy] = useState(initialCaseStudy);
  const [showExportFooter, setShowExportFooter] = useState(false); // For PDF export
  const previewRef = useRef<HTMLDivElement>(null);

  const isFreePlan = currentPlan?.id === "free";

  const handleSave = async () => {
    setIsSaving(true);
    const savePromise = updateCaseStudyContent(caseStudy.id, {
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

    toast.promise(savePromise, {
      loading: "Saving case study...",
      success: (result) => {
        if (result.success) {
          setIsEditing(false);
          router.refresh(); // Re-fetch server data
          return "Case study saved successfully!";
        } else {
          // This will be caught by the error state
          throw new Error(result.error || "Failed to save case study.");
        }
      },
      error: (error) => error.message || "An unexpected error occurred.",
      finally: () => {
        setIsSaving(false);
      },
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // --- Content Generation Functions ---

  const generateMarkdown = (): string => {
    const footer = isFreePlan ? `\n\n---\n*Generated with Casevia*` : "";

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
  caseStudy.metrics && caseStudy.metrics.length > 0
    ? `## Key Metrics\n\n${caseStudy.metrics
        .map((m: any) => `- **${m.metric}**\n  > "${m.quote}"`)
        .join("\n\n")}`
    : ""
}

${
  caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0
    ? `## Customer Quotes\n\n${caseStudy.keyQuotes
        .map((q: string) => `> "${q}"`)
        .join("\n\n")}`
    : ""
}
${footer}
`;
  };

  const generateHTML = (): string => {
    const metricsHtml =
      caseStudy.metrics && caseStudy.metrics.length > 0
        ? `<h2>Key Metrics</h2>
           <div class="metrics-container">
             ${caseStudy.metrics
               .map(
                 (m: any) => `<div class="metric-card">
                   <h3>${m.metric}</h3>
                   <p>"${m.quote}"</p>
                 </div>`
               )
               .join("")}
           </div>`
        : "";

    const quotesHtml =
      caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0
        ? `<h2>Customer Quotes</h2>
           ${caseStudy.keyQuotes
             .map((q: string) => `<blockquote>"${q}"</blockquote>`)
             .join("")}`
        : "";

    const footerHtml = isFreePlan
      ? `
    <footer>
      <p><em>Generated with Casevia</em></p>
    </footer>`
      : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${caseStudy.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; }
        h2 { font-size: 1.8em; margin-top: 1.5em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        .summary { font-size: 1.2em; color: #666; margin-bottom: 2em; }
        .client-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .metric-card { background: #f4f6ff; border: 1px solid #e0e6fc; padding: 20px; border-radius: 8px; margin-bottom: 10px; }
        .metric-card h3 { margin-top: 0; color: #4338ca; }
        blockquote { border-left: 4px solid #667eea; padding-left: 20px; margin: 20px 0; font-style: italic; color: #555; }
        footer { margin-top: 2em; text-align: center; color: #999; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>${caseStudy.title}</h1>
    <p class="summary">${caseStudy.summary}</p>
    <div class="client-info">
        <strong>Client:</strong> ${caseStudy.clientName || "N/A"}<br>
        <strong>Industry:</strong> ${caseStudy.clientIndustry || "N/A"}
    </div>
    <h2>The Challenge</h2>
    <p>${caseStudy.challenge}</p>
    <h2>The Solution</h2>
    <p>${caseStudy.solution}</p>
    <h2>The Results</h2>
    <p>${caseStudy.results}</p>
    
    ${metricsHtml}
    ${quotesHtml}
    ${footerHtml}
</body>
</html>`;
  };

  // --- Export Handlers ---

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdown();
    const element = document.createElement("a");
    const file = new Blob([markdown], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${caseStudy.publicSlug || "case-study"}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadHTML = () => {
    const html = generateHTML();
    const element = document.createElement("a");
    const file = new Blob([html], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = `${caseStudy.publicSlug || "case-study"}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) {
      toast.error(
        "Cannot export PDF while in edit mode. Save your changes first."
      );
      return;
    }

    setIsExporting(true);
    if (isFreePlan) {
      setShowExportFooter(true); // Show footer for PDF screenshot
    }

    const pdfToast = toast.loading("Generating PDF...", {
      description: "This may take a moment...",
    });

    // Wait for next tick for React to render footer if needed
    setTimeout(async () => {
      try {
        // Dynamically import libraries on demand
        const { default: jsPDF } = await import("jspdf");
        const { default: html2canvas } = await import("html2canvas");

        const canvas = await html2canvas(previewRef.current!, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          // FIX: Provide a solid background color to prevent parsing errors like 'lab' color function
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const pdf = new jsPDF("p", "mm", "a4");
        let position = 0; // y-position on the PDF

        // Add the first page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add new pages if content is longer than one page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight; // Go "up" from the bottom of the image
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${caseStudy.publicSlug || "case-study"}.pdf`);

        toast.success("PDF generated successfully!", { id: pdfToast });
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        toast.error("Failed to generate PDF.", { id: pdfToast });
      } finally {
        setIsExporting(false);
        if (isFreePlan) {
          setShowExportFooter(false); // Hide footer after screenshot
        }
      }
    }, 0);
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            className="text-sm text-muted-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">
                  AI Generated
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Edit Case Study
              </h1>
              <p className="text-muted-foreground">
                Review and refine your generated case study
              </p>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCaseStudy(initialCaseStudy);
                      setIsEditing(false);
                    }}
                  >
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
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleDownloadMarkdown}>
                        <FileText className="w-4 h-4 mr-2" />
                        Markdown (.md)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadHTML}>
                        <FileCode className="w-4 h-4 mr-2" />
                        HTML (.html)
                      </DropdownMenuItem>{" "}
                      {/* Fixed typo here */}
                      <DropdownMenuItem
                        onClick={handleDownloadPDF}
                        disabled={isEditing || isExporting}
                      >
                        {isExporting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4 mr-2" />
                        )}
                        PDF (.pdf)
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

        {/* Tabs */}
        <Tabs
          defaultValue="preview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="w-4 h-4 mr-2" />
              Social Posts ({socialPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="preview">
            <Card>
              <CardContent className="p-8">
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
                      <Label htmlFor="challenge">Challenge</Label>
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
                      <Label htmlFor="solution">Solution</Label>
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
                      <Label htmlFor="results">Results</Label>
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
                  // This is the preview div we capture for the PDF
                  <div
                    ref={previewRef}
                    className="prose dark:prose-invert max-w-none"
                  >
                    <h1 className="text-3xl font-semibold mb-4">
                      {caseStudy.title}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {caseStudy.summary}
                    </p>

                    {(caseStudy.clientName || caseStudy.clientIndustry) && (
                      <div className="bg-muted p-4 rounded-lg my-6 not-prose">
                        {caseStudy.clientName && (
                          <p>
                            <strong>Client:</strong> {caseStudy.clientName}
                          </p>
                        )}
                        {caseStudy.clientIndustry && (
                          <p>
                            <strong>Industry:</strong>{" "}
                            {caseStudy.clientIndustry}
                          </p>
                        )}
                      </div>
                    )}

                    <h2 className="font-semibold text-2xl mb-3">
                      The Challenge
                    </h2>
                    <p className="whitespace-pre-wrap">{caseStudy.challenge}</p>

                    <h2 className="font-semibold text-2xl my-3">
                      The Solution
                    </h2>
                    <p className="whitespace-pre-wrap">{caseStudy.solution}</p>

                    <h2 className="font-semibold text-2xl my-3">The Results</h2>
                    <p className="whitespace-pre-wrap">{caseStudy.results}</p>

                    {caseStudy.metrics && caseStudy.metrics.length > 0 && (
                      <>
                        <h2 className="font-semibold text-2xl my-3">
                          Key Metrics
                        </h2>
                        <div className="not-prose space-y-4">
                          {caseStudy.metrics.map((metric: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4 rounded-lg"
                            >
                              <p className="text-2xl font-bold text-primary">
                                {metric.metric}
                              </p>
                              <p className="text-sm italic text-muted-foreground">
                                "{metric.quote}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0 && (
                      <>
                        <h2 className="font-semibold text-2xl my-3">
                          Customer Quotes
                        </h2>
                        {caseStudy.keyQuotes.map(
                          (quote: string, idx: number) => (
                            <blockquote key={idx}>"{quote}"</blockquote>
                          )
                        )}
                      </>
                    )}

                    {/* This footer will only appear during PDF export on free plan */}
                    {showExportFooter && (
                      <footer className="not-prose text-center text-sm text-gray-500 pt-8 mt-8 border-t">
                        <em>Generated with Casevia</em>
                      </footer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social">
            <div className="space-y-6">
              {socialPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      No social posts generated yet
                    </p>{" "}
                    {/* Fixed typo here */}
                  </CardContent>
                </Card>
              ) : (
                socialPosts.map((post, idx) => {
                  const isLinkedIn = post.platform === "linkedin";
                  const isX = post.platform === "x";
                  const postContent = isX
                    ? JSON.parse(post.content).join("\n\n")
                    : post.content;

                  return (
                    <Card key={idx}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isLinkedIn ? "bg-blue-600" : "bg-foreground"
                            }`}
                          >
                            <span className="text-white font-bold text-sm">
                              {isLinkedIn ? "in" : "X"}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {isLinkedIn ? "LinkedIn" : "X (Twitter)"}
                            </CardTitle>
                            <CardDescription>Ready to publish</CardDescription>
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
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted rounded-lg p-4">
                          {isX ? (
                            <div className="space-y-3">
                              {JSON.parse(post.content).map(
                                (tweet: string, tweetIdx: number) => (
                                  <div
                                    key={tweetIdx}
                                    className="pb-3 border-b border-background last:border-b-0 last:pb-0"
                                  >
                                    <span className="text-xs text-muted-foreground mb-1 block">
                                      Tweet {tweetIdx + 1}
                                    </span>
                                    <p className="text-foreground whitespace-pre-wrap">
                                      {tweet}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-foreground whitespace-pre-wrap">
                              {post.content}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
