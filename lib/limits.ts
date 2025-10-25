// lib/limits.ts
import { db } from "@/lib/drizzle";
import { planLimits, project, organization } from "@/lib/auth/schema";
import { eq, and, sql } from "drizzle-orm";
import { PLANS } from "./constants/plans";

export async function checkPlanLimits(organizationId: string) {
  // Get organization's plan limits
  const [limits] = await db
    .select()
    .from(planLimits)
    .where(eq(planLimits.organizationId, organizationId));

  if (!limits) {
    throw new Error("Plan limits not found");
  }

  const plan = PLANS.find((p) => p.id === limits.planId);
  if (!plan) {
    throw new Error("Invalid plan");
  }

  // Check if we need to reset monthly limits
  const now = new Date();
  if (now >= limits.resetAt) {
    await resetMonthlyLimits(organizationId);
    // Refresh limits after reset
    const [refreshedLimits] = await db
      .select()
      .from(planLimits)
      .where(eq(planLimits.organizationId, organizationId));
    return { limits: refreshedLimits, plan };
  }

  return { limits, plan };
}

export async function canUploadFile(
  organizationId: string,
  fileSizeMb: number,
  durationMinutes: number
) {
  const { limits, plan } = await checkPlanLimits(organizationId);

  // Check case study limit
  if (limits.caseStudiesUsed >= plan.limits.caseStudies) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${plan.limits.caseStudies} case studies. Upgrade to continue.`,
      limitType: "caseStudies" as const,
    };
  }

  // Check storage limit
  const newStorageUsed = limits.storageUsedMb + fileSizeMb;
  if (newStorageUsed > plan.limits.storage) {
    return {
      allowed: false,
      reason: `This upload would exceed your storage limit of ${plan.limits.storage} MB. Upgrade for more storage.`,
      limitType: "storage" as const,
    };
  }

  // Check video length limit
  if (durationMinutes > plan.limits.videoLength) {
    return {
      allowed: false,
      reason: `Video length (${durationMinutes} min) exceeds your plan limit of ${plan.limits.videoLength} minutes.`,
      limitType: "videoLength" as const,
    };
  }

  return { allowed: true };
}

export async function incrementUsage(
  organizationId: string,
  fileSizeMb: number
) {
  await db
    .update(planLimits)
    .set({
      caseStudiesUsed: sql`${planLimits.caseStudiesUsed} + 1`,
      storageUsedMb: sql`${planLimits.storageUsedMb} + ${fileSizeMb}`,
      updatedAt: new Date(),
    })
    .where(eq(planLimits.organizationId, organizationId));
}

async function resetMonthlyLimits(organizationId: string) {
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1);
  nextReset.setDate(1); // Reset on 1st of next month
  nextReset.setHours(0, 0, 0, 0);

  await db
    .update(planLimits)
    .set({
      caseStudiesUsed: 0,
      socialPostsUsed: 0,
      lastResetAt: new Date(),
      resetAt: nextReset,
      updatedAt: new Date(),
    })
    .where(eq(planLimits.organizationId, organizationId));
}

// Helper to get video duration from file
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const durationMinutes = Math.ceil(video.duration / 60);
      resolve(durationMinutes);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}

// Helper to get audio duration (similar approach)
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src);
      const durationMinutes = Math.ceil(audio.duration / 60);
      resolve(durationMinutes);
    };

    audio.onerror = () => {
      reject(new Error("Failed to load audio metadata"));
    };

    audio.src = URL.createObjectURL(file);
  });
}

export async function syncPlanWithDB(organizationId: string, planId: string) {
  await db
    .update(planLimits)
    .set({ planId })
    .where(eq(planLimits.organizationId, organizationId));
}
