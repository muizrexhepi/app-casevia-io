// app/dashboard/projects/[id]/case-study/case-study-view.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Share2,
  Eye,
  Edit3,
  Sparkles,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaseStudyViewProps {
  project: any;
  caseStudy: any;
  socialPosts: any[];
}

export function CaseStudyView({
  project,
  caseStudy,
  socialPosts,
}: CaseStudyViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const generateMarkdown = () => {
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
    ? `
## Key Metrics

${caseStudy.metrics
  .map((m: any) => `- **${m.metric}**\n  > "${m.quote}"`)
  .join("\n\n")}
`
    : ""
}

${
  caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0
    ? `
## Customer Quotes

${caseStudy.keyQuotes.map((q: string) => `> "${q}"`).join("\n\n")}
`
    : ""
}

${
  caseStudy.keyTakeaways && caseStudy.keyTakeaways.length > 0
    ? `
## Key Takeaways

${caseStudy.keyTakeaways
  .map((t: string, i: number) => `${i + 1}. ${t}`)
  .join("\n")}
`
    : ""
}

---
*Generated with Casevia*
`;
  };

  return (
    <div className="min-h- p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">
                  AI Generated
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Case Study
              </h1>
              <p className="text-muted-foreground">
                Review and publish your generated case study
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size={"lg"}
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}/transcript`)
                }
              >
                <FileText className="w-4 h-4" />
                Transcript
              </Button>
              <Button
                size={"lg"}
                variant={"outline"}
                onClick={handleDownloadMarkdown}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                size={"lg"}
                variant={"secondary"}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("preview")}
                className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "preview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab("social")}
                className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "social"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Share2 className="w-4 h-4 inline mr-2" />
                Social Posts ({socialPosts.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === "preview" ? (
          <div className="bg-card rounded-xl shadow-sm border p-8">
            {/* Title */}
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {caseStudy.title}
            </h2>

            {/* Summary */}
            <p className="text-lg text-muted-foreground mb-6 pb-6 border-b">
              {caseStudy.summary}
            </p>

            {/* Client Info */}
            {(caseStudy.clientName || caseStudy.clientIndustry) && (
              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-muted rounded-lg">
                {caseStudy.clientName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Client</p>
                    <p className="font-semibold text-foreground">
                      {caseStudy.clientName}
                    </p>
                  </div>
                )}
                {caseStudy.clientIndustry && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Industry
                    </p>
                    <p className="font-semibold text-foreground">
                      {caseStudy.clientIndustry}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Challenge */}
            {caseStudy.challenge && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  The Challenge
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {caseStudy.challenge}
                </p>
              </div>
            )}

            {/* Solution */}
            {caseStudy.solution && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  The Solution
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {caseStudy.solution}
                </p>
              </div>
            )}

            {/* Key Metrics */}
            {caseStudy.metrics && caseStudy.metrics.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Key Results
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {caseStudy.metrics.map((metric: any, idx: number) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg border">
                      <p className="text-2xl font-bold text-accent-foreground mb-2">
                        {metric.metric}
                      </p>
                      <p className="text-sm text-muted-foreground italic">
                        "{metric.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {caseStudy.results && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  The Results
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {caseStudy.results}
                </p>
              </div>
            )}

            {/* Key Quotes */}
            {caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  What They Said
                </h3>
                <div className="space-y-4">
                  {caseStudy.keyQuotes.map((quote: string, idx: number) => (
                    <div
                      key={idx}
                      className="pl-4 border-l-4 border-blue-600 py-2"
                    >
                      <p className="text-lg text-muted-foreground italic">
                        "{quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {caseStudy.keyTakeaways && caseStudy.keyTakeaways.length > 0 && (
              <div className="mb-8 p-6 bg-muted rounded-lg">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Key Takeaways
                </h3>
                <ul className="space-y-2">
                  {caseStudy.keyTakeaways.map(
                    (takeaway: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground">
                          {takeaway}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {socialPosts.length === 0 ? (
              <div className="bg-muted rounded-xl shadow-sm border p-12 text-center">
                <Share2 className="w-12 h-12 mx-auto mb-4 text-foreground" />
                <p className="text-muted-foreground">
                  No social posts generated yet
                </p>
              </div>
            ) : (
              socialPosts.map((post, idx) => (
                <div
                  key={idx}
                  className="bg-muted rounded-xl shadow-sm border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          post.platform === "linkedin"
                            ? "bg-blue-600"
                            : "bg-slate-900"
                        }`}
                      >
                        <span className="text-white font-bold text-sm">
                          {post.platform === "linkedin" ? "in" : "X"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground capitalize">
                          {post.platform === "linkedin"
                            ? "LinkedIn"
                            : "X (Twitter)"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Ready to publish
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        handleCopy(
                          post.platform === "x"
                            ? JSON.parse(post.content).join("\n\n")
                            : post.content
                        )
                      }
                      variant={"outline"}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-background rounded-lg p-4">
                    {post.platform === "x" ? (
                      <div className="space-y-3">
                        {JSON.parse(post.content).map(
                          (tweet: string, tweetIdx: number) => (
                            <div
                              key={tweetIdx}
                              className="pb-3 border-b last:border-b-0 last:pb-0"
                            >
                              <span className="text-xs text-muted-foreground mb-1 block">
                                Tweet {tweetIdx + 1}
                              </span>
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                {tweet}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {post.content}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
