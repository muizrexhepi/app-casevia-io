"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authClient, useActiveOrganization } from "@/lib/auth/client";
import { PLANS, type PlanId } from "@/lib/constants/plans";

interface SubscriptionData {
  currentPlan: PlanId;
  activeSubscription: any | null;
  customerState: any | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionData | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: activeOrg } = useActiveOrganization();
  const [customerState, setCustomerState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!activeOrg?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: state } = await authClient.customer.state();
      setCustomerState(state);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      setCustomerState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [activeOrg?.id]);

  // Get active subscription
  const activeSubscription = customerState?.activeSubscriptions?.[0] || null;

  // Determine current plan based on subscription amount
  const getCurrentPlan = (): PlanId => {
    if (!activeSubscription) return "free";

    const amount = activeSubscription.amount;

    // Match based on price (amounts are in cents)
    if (amount >= 14900) return "agency"; // $149+
    if (amount >= 7900) return "pro"; // $79+
    if (amount >= 2900) return "freelancer"; // $29+

    return "free";
  };

  const currentPlan = getCurrentPlan();

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        activeSubscription,
        customerState,
        isLoading,
        refresh: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// Custom hook to use subscription data
export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }

  return context;
}

// Helper hook to get current plan details
export function useCurrentPlan() {
  const { currentPlan } = useSubscription();
  return PLANS.find((p) => p.id === currentPlan) || PLANS[0];
}

// Helper hook to check if user can access a feature
export function useCanAccess() {
  const { currentPlan } = useSubscription();
  const plan = PLANS.find((p) => p.id === currentPlan);

  return {
    canCreateCaseStudy: (currentCount: number) => {
      if (!plan) return false;
      return currentCount < plan.limits.caseStudies;
    },
    canUploadVideo: (durationMinutes: number) => {
      if (!plan) return false;
      return durationMinutes <= plan.limits.videoLength;
    },
    canUseStorage: (usedMB: number) => {
      if (!plan) return false;
      return usedMB < plan.limits.storage;
    },
    hasFeature: (feature: keyof typeof plan.limits) => {
      if (!plan) return false;
      const limit = plan.limits[feature];
      return limit === -1 || limit > 0;
    },
    limits: plan?.limits || PLANS[0].limits,
  };
}
