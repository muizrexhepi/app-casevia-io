"use client";

import { useCurrentPlan } from "../providers/subscription-provider";
import { UploadForm } from "./upload-form";

interface UploadFormWrapperProps {
  organizationId: string;
  initialLimits: any;
}

export function UploadFormWrapper({
  organizationId,
  initialLimits,
}: UploadFormWrapperProps) {
  // Get current plan from subscription provider
  const currentPlan = useCurrentPlan();

  return (
    <UploadForm
      organizationId={organizationId}
      currentPlan={currentPlan}
      limits={initialLimits}
    />
  );
}
