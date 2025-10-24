"use client";

import { useState } from "react";
import { authClient, useActiveOrganization } from "@/lib/auth/client";
import { PLANS } from "@/lib/constants/plans";
import {
  Check,
  Loader2,
  ExternalLink,
  CreditCard,
  Calendar,
  Building2,
} from "lucide-react";
import {
  useSubscription,
  useCurrentPlan,
} from "@/components/providers/subscription-provider";

type BillingInterval = "monthly" | "yearly";

export default function BillingPage() {
  const { data: activeOrg } = useActiveOrganization();
  const { activeSubscription, customerState, isLoading, refresh } =
    useSubscription();
  const currentPlan = useCurrentPlan();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle plan upgrade/downgrade
  const handlePlanChange = async (planId: string) => {
    if (planId === currentPlan.id || !activeOrg?.id) return;
    setProcessingPlan(planId);

    try {
      const plan = PLANS.find((p) => p.id === planId);
      if (!plan?.slug) {
        throw new Error("Invalid plan");
      }

      const checkoutSlug = `${plan.slug}-${billingInterval}`;

      await authClient.checkout({
        slug: checkoutSlug,
        referenceId: activeOrg.id,
      });
    } catch (error) {
      console.error("Checkout failed:", error);
      setProcessingPlan(null);
    }
  };

  // Open customer portal
  const openCustomerPortal = async () => {
    try {
      await authClient.customer.portal();
    } catch (error) {
      console.error("Failed to open portal:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing preferences
        </p>
      </div>

      {/* Current Subscription Card */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-6">
          {/* Subscription Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <h2 className="text-xl font-semibold">{currentPlan.name}</h2>
                </div>
              </div>
            </div>
            <button
              onClick={openCustomerPortal}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              Manage billing
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subscription Details */}
          {activeSubscription && (
            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>Organization</span>
                </div>
                <p className="text-sm font-medium">
                  {activeOrg?.name || "Organization"}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Billing period</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(activeSubscription.currentPeriodStart)} —{" "}
                  {formatDate(activeSubscription.currentPeriodEnd)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>Amount</span>
                </div>
                <p className="text-sm font-medium">
                  ${(activeSubscription.amount / 100).toFixed(2)} /{" "}
                  {activeSubscription.recurringInterval}
                </p>
              </div>
            </div>
          )}

          {!activeSubscription && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                You're currently on the free plan. Upgrade to unlock more
                features.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plans Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Available plans</h2>
            <p className="text-sm text-muted-foreground">
              Choose a plan that works for you
            </p>
          </div>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center rounded-lg border bg-background p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "yearly"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] text-green-600 dark:text-green-500 font-semibold">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id;
            const price =
              billingInterval === "monthly"
                ? plan.priceMonthly
                : plan.priceYearly;
            const displayPrice =
              billingInterval === "yearly"
                ? `$${Math.round(price / 12)}`
                : plan.price;

            return (
              <div
                key={plan.id}
                className={`rounded-lg border bg-card transition-all ${
                  isCurrentPlan
                    ? "ring-2 ring-primary"
                    : "hover:border-foreground/20"
                }`}
              >
                <div className="p-5 space-y-5">
                  {/* Plan Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {plan.description}
                        </p>
                      </div>
                      {isCurrentPlan && (
                        <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold">
                        {displayPrice}
                      </span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>

                    {billingInterval === "yearly" && plan.id !== "free" && (
                      <p className="text-xs text-muted-foreground">
                        ${price} billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanChange(plan.id)}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    className={`w-full h-9 px-4 rounded-md text-sm font-medium transition-colors ${
                      isCurrentPlan
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {processingPlan === plan.id ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Processing...
                      </span>
                    ) : isCurrentPlan ? (
                      "Current plan"
                    ) : plan.id === "free" ? (
                      "Downgrade"
                    ) : plan.cta.includes("Contact") ? (
                      "Contact sales"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>

                  {/* Features List */}
                  <ul className="space-y-2 pt-2 border-t">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-muted-foreground pl-5">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
