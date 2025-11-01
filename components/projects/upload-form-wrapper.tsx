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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500">Loading...</p>
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
