// app/dashboard/casestudies/[id]/PublishToggle.tsx
"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Assuming you use sonner for notifications
import { updatePublishStatus } from "@/app/dashboard/case-studies/[id]/actions";

interface PublishToggleProps {
  caseStudyId: string;
  isPublished: boolean;
}

export function PublishToggle({
  caseStudyId,
  isPublished,
}: PublishToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(isPublished);

  const handleToggle = (checked: boolean) => {
    setCurrentStatus(checked); // Optimistic update
    startTransition(async () => {
      const result = await updatePublishStatus(caseStudyId, checked);

      if (result.success) {
        toast.success(
          checked ? "Case study published!" : "Case study unpublished."
        );
      } else {
        toast.error(result.error || "An error occurred.");
        setCurrentStatus(!checked); // Revert optimistic update on failure
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="publish-toggle"
        checked={currentStatus}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <Label htmlFor="publish-toggle" className="font-medium">
        {isPending ? "Updating..." : currentStatus ? "Published" : "Draft"}
      </Label>
    </div>
  );
}
