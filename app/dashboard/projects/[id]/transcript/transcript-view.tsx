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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const wordCount = project.transcript.split(/\s+/).length;

  return (
    <div className="container mx-auto max-w-6xl py-8">
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

        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                <MessageSquare className="w-3 h-3 mr-1" />
                Transcript
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {project.title}
            </h1>
            <p className="text-muted-foreground">
              Full transcript with speaker identification
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("txt")}
            >
              <Download className="w-4 h-4 mr-2" />
              TXT
            </Button>
            {hasUtterances && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("json")}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatDuration(project.durationSeconds || 0)}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Word Count</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {wordCount.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Speakers</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {speakerCount || "N/A"}
            </p>
          </div>
        </div>

        {/* Search */}
        {hasUtterances && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Transcript Content */}
      <div className="rounded-xl border bg-card p-8 mb-6">
        {hasUtterances ? (
          <div className="space-y-8">
            {(searchTerm ? filteredUtterances : utterances).map(
              (utterance: any, idx: number) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                        idx % 2 === 0
                          ? "bg-gradient-to-br from-blue-500 to-blue-600"
                          : "bg-gradient-to-br from-purple-500 to-purple-600"
                      )}
                    >
                      {utterance.speaker}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        Speaker {utterance.speaker}
                      </span>
                      {utterance.start && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(utterance.start)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {utterance.text}
                    </p>
                  </div>
                </div>
              )
            )}

            {searchTerm && filteredUtterances.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No results found for "{searchTerm}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">
              {project.transcript}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-6">
        <div>
          <h3 className="font-semibold mb-1">View the case study</h3>
          <p className="text-sm text-muted-foreground">
            See how this transcript was transformed into a professional case
            study
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(`/dashboard/projects/${project.id}/case-study`)
          }
        >
          <Eye className="w-4 h-4 mr-2" />
          View Case Study
        </Button>
      </div>
    </div>
  );
}
