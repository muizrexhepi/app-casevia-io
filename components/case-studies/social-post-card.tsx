"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialPostCardProps {
  post: {
    id: string;
    platform: string;
    content: string;
    status: string;
    createdAt: Date;
  };
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  const [copied, setCopied] = useState(false);

  const isLinkedIn = post.platform === "linkedin";
  const isX = post.platform === "x";

  // Parse X thread content
  const postContent = isX ? JSON.parse(post.content) : post.content;

  const handleCopy = () => {
    const textToCopy = isX ? postContent.join("\n\n") : post.content;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Copied to clipboard!");

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg",
                isLinkedIn ? "bg-blue-600" : "bg-black dark:bg-white"
              )}
            >
              <span className={isLinkedIn ? "" : "dark:text-black"}>
                {isLinkedIn ? "in" : "𝕏"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isLinkedIn ? "LinkedIn" : "X (Twitter)"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isX
                  ? `${postContent.length} tweet thread`
                  : "Ready to publish"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
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

        <div className="bg-muted rounded-lg p-4">
          {isX ? (
            <div className="space-y-4">
              {postContent.map((tweet: string, idx: number) => (
                <div
                  key={idx}
                  className="pb-4 border-b last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Tweet {idx + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {tweet.length} characters
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {tweet}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          )}
        </div>

        {isX && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> Post these tweets as a thread on X. Copy
              each tweet individually or use the "Copy" button to get all tweets
              at once.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
