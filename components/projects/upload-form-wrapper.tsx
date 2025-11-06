"use client";

import { useSubscription } from "../providers/subscription-provider";
import { UploadForm } from "./upload-form";
import { Loader2 } from "lucide-react";

interface UploadFormWrapperProps {
  organizationId: string;
  initialLimits: any;
}

export function UploadFormWrapper({
  organizationId,
  initialLimits,
}: UploadFormWrapperProps) {
  const { currentPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <UploadForm
      organizationId={organizationId}
      currentPlan={currentPlan}
      limits={initialLimits}
    />
  );
}
