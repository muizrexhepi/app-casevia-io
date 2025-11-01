"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { authClient, useActiveOrganization } from "@/lib/auth/client";
import { PLANS, type Plan } from "@/lib/constants/plans";

interface SubscriptionData {
  currentPlan: Plan;
  activeSubscription: any | null;
  customerState: any | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canAccess: {
    createCaseStudy: (currentCount: number) => boolean;
    uploadVideo: (durationMinutes: number) => boolean;
    useStorage: (usedMB: number) => boolean;
    hasFeature: (feature: keyof Plan["limits"]) => boolean;
  };
}

const SubscriptionContext = createContext<SubscriptionData | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: activeOrg, isPending: isOrgPending } = useActiveOrganization();
  const [customerState, setCustomerState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!activeOrg?.id) {
      setIsInitializing(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: state, error: fetchError } =
        await authClient.customer.state();

      if (fetchError) {
        console.error("Subscription fetch error:", fetchError);
        // Don't throw - just use free plan as fallback
        setCustomerState(null);
      } else {
        setCustomerState(state);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCustomerState(null);
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    if (isOrgPending) {
      return; // Wait for organization to load
    }

    if (activeOrg?.id) {
      fetchSubscription();
    } else {
      // No active org - set to initialized with free plan
      setIsInitializing(false);
      setIsLoading(false);
    }
  }, [activeOrg?.id, isOrgPending, fetchSubscription]);

  const activeSubscription = customerState?.activeSubscriptions?.[0] || null;

  const getCurrentPlan = useCallback((): Plan => {
    if (!activeSubscription) return PLANS[0];

    const productSlug = activeSubscription.product?.slug;
    if (productSlug) {
      const baseSlug = productSlug.replace(/-(monthly|yearly)$/, "");
      const planBySlug = PLANS.find((p) => p.slug === baseSlug);
      if (planBySlug) return planBySlug;
    }

    const amount = activeSubscription.amount || 0;
    const monthlyAmount =
      activeSubscription.recurringInterval === "year"
        ? Math.round(amount / 12)
        : amount;

    if (monthlyAmount >= 14900) return PLANS.find((p) => p.id === "agency")!;
    if (monthlyAmount >= 7900) return PLANS.find((p) => p.id === "pro")!;
    if (monthlyAmount >= 2900) return PLANS.find((p) => p.id === "freelancer")!;

    return PLANS[0];
  }, [activeSubscription]);

  const currentPlan = getCurrentPlan();

  const canAccess = {
    createCaseStudy: (currentCount: number) => {
      const limit = currentPlan.limits.caseStudies;
      return limit === -1 || currentCount < limit;
    },
    uploadVideo: (durationMinutes: number) => {
      const limit = currentPlan.limits.videoLength;
      return limit === -1 || durationMinutes <= limit;
    },
    useStorage: (usedMB: number) => {
      const limit = currentPlan.limits.storage;
      return limit === -1 || usedMB < limit;
    },
    hasFeature: (feature: keyof Plan["limits"]) => {
      const limit = currentPlan.limits[feature];
      return limit === -1 || limit > 0;
    },
  };

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        activeSubscription,
        customerState,
        isLoading,
        isInitializing,
        error,
        refresh: fetchSubscription,
        canAccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}

export function useCurrentPlan() {
  const { currentPlan, isInitializing } = useSubscription();
  return { plan: currentPlan, isLoading: isInitializing };
}

export function useCanAccess() {
  const { canAccess } = useSubscription();
  return canAccess;
}
