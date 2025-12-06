"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Search,
  Clock,
  MessageSquare,
  FileText,
  Eye,
  X,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is available

interface TranscriptViewProps {
  project: any;
}

export function TranscriptView({ project }: TranscriptViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const utterances = project.speakerLabels || [];
  const hasUtterances = utterances.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(project.transcript);
    toast.success("Transcript copied to clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (type: "txt" | "json") => {
    if (type === "txt") {
      const blob = new Blob([project.transcript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title}-transcript.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = {
        title: project.title,
        transcript: project.transcript,
        utterances: utterances,
        duration: project.durationSeconds,
        createdAt: project.createdAt,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title}-transcript.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Downloaded as ${type.toUpperCase()}`);
  };

  const formatTimestamp = (ms: number) => {
    if (ms === undefined || ms === null) return "--:--";
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const filteredUtterances = hasUtterances
    ? utterances.filter((u: any) =>
        u.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const speakerCount = hasUtterances
    ? new Set(utterances.map((u: any) => u.speaker)).size
    : 0;

  const wordCount = project.transcript.split(/\s+/).filter(Boolean).length;

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
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50"
                  variant="default"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Transcript
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {project.title}
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl">
                The full, timestamped interview transcript with speaker
                identification.
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("txt")}
                className="text-sm font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                TXT
              </Button>
              {hasUtterances && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("json")}
                  className="text-sm font-medium hidden sm:inline-flex"
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats and Search Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stat Cards */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Duration
              </p>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {formatDuration(project.durationSeconds || 0)}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Word Count
              </p>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {wordCount.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Speakers
              </p>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {speakerCount || "N/A"}
            </p>
          </div>

          {/* Search Input */}
          <div className="rounded-xl border bg-card p-4 shadow-sm md:col-span-1 flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-10 border-none bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Transcript Content Card */}
        <div className="border rounded-xl bg-card shadow-sm p-6 lg:p-8">
          <div className="space-y-6">
            {hasUtterances ? (
              (searchTerm ? filteredUtterances : utterances).map(
                (utterance: any, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-4 group",
                      searchTerm &&
                        utterance.text
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                        ? "bg-primary/5 p-3 -mx-3 rounded-lg"
                        : "p-0"
                    )}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md",
                          // Use consistent color scheme, e.g., Primary/Accent for differentiation
                          utterance.speaker === 1
                            ? "bg-primary" // Main speaker
                            : "bg-accent/80 text-accent-foreground" // Other speaker
                        )}
                      >
                        S{utterance.speaker}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          Speaker {utterance.speaker}
                        </span>
                        {utterance.start !== undefined && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(utterance.start)}
                          </span>
                        )}
                      </div>
                      <p className="text-base text-foreground/90 leading-relaxed">
                        {utterance.text}
                      </p>
                    </div>
                  </div>
                )
              )
            ) : (
              // Plain text fallback
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {project.transcript}
              </div>
            )}
          </div>

          {/* Search Empty State */}
          {searchTerm && filteredUtterances.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground mb-4">
                No results found for **"{searchTerm}"**
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear search
              </Button>
            </div>
          )}

          {/* No Utterances Info */}
          {!hasUtterances && (
            <div className="mt-6">
              <div className="flex items-center gap-3 text-sm text-amber-600 dark:text-amber-400 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Info className="w-4 h-4 shrink-0" />
                <p>
                  Speaker labels are unavailable for this file. The full
                  transcript is displayed as plain text.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer Bar (styled like a hoverable sidebar item) */}
        <div className="bg-muted/30 border border-transparent hover:border-border rounded-xl p-6 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                View the Case Study Draft
              </h3>
              <p className="text-sm text-muted-foreground">
                See how this interview was transformed into a professional,
                actionable case study.
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/projects/${project.id}/case-study`)
              }
              className="shrink-0"
            >
              <Eye className="w-4 h-4 mr-2" />
              Review Case Study
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
