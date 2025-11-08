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
import { useSubscription } from "@/components/providers/subscription-provider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BillingInterval = "monthly" | "yearly";

export default function BillingPage() {
  const { data: activeOrg } = useActiveOrganization();
  const { currentPlan, activeSubscription, isLoading, refresh } =
    useSubscription();
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

    // Special handling for free plan (downgrade)
    if (planId === "free") {
      toast.info("Please contact support to downgrade to the free plan");
      return;
    }

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

      // The checkout redirects to Polar, so we don't need to handle success here
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Failed to start checkout. Please try again.");
      setProcessingPlan(null);
    }
  };

  // Open customer portal
  const openCustomerPortal = async () => {
    try {
      const result = await authClient.customer.portal();
      if (result.error) {
        toast.error("Failed to open billing portal");
      }
    } catch (error) {
      console.error("Failed to open portal:", error);
      toast.error("Failed to open billing portal");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading billing information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing preferences
        </p>
      </div>

      {/* Current Subscription Card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6 space-y-6">
          {/* Subscription Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <CreditCard className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentPlan.name}
                  </h2>
                </div>
              </div>
            </div>
            {activeSubscription && (
              <Button onClick={openCustomerPortal}>
                Manage billing
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Subscription Details */}
          {activeSubscription ? (
            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t ">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>Organization</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {activeOrg?.name || "Organization"}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Billing period</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(activeSubscription.currentPeriodStart)} —{" "}
                  {formatDate(activeSubscription.currentPeriodEnd)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>Amount</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  ${(activeSubscription.amount / 100).toFixed(2)} /{" "}
                  {activeSubscription.recurringInterval}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-background">
              <p className="text-sm text-gray-600">
                You're currently on the free plan. Upgrade to unlock more
                features and capabilities.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plans Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Available plans
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose a plan that works for you
            </p>
          </div>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center rounded-lg border bg-card p-1">
            <Button
              onClick={() => setBillingInterval("monthly")}
              variant={billingInterval === "monthly" ? "default" : "ghost"}
            >
              Monthly
            </Button>
            <Button
              onClick={() => setBillingInterval("yearly")}
              variant={billingInterval !== "monthly" ? "default" : "ghost"}
            >
              Yearly
              <span className="ml-1.5 text-[10px] text-green-600 font-semibold">
                Save 17%
              </span>
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id;
            const price =
              billingInterval === "monthly"
                ? plan.priceMonthly
                : plan.priceYearly;
            const displayPrice =
              billingInterval === "yearly" && plan.id !== "free"
                ? `$${Math.round(price / 12)}`
                : plan.price;

            return (
              <div
                key={plan.id}
                className={`rounded-lg border bg-card transition-all ${
                  isCurrentPlan
                    ? "ring-foreground border-border"
                    : "hover:shadow-sm"
                } ${plan.popular ? "relative" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-muted text-foreground text-xs font-medium">
                      <Check className="w-3 h-3" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-5">
                  {/* Plan Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {plan.description}
                        </p>
                      </div>
                      {isCurrentPlan && (
                        <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-background text-foreground text-xs font-medium">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-foreground">
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
                  <Button
                    onClick={() => handlePlanChange(plan.id)}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    variant={isCurrentPlan ? "outline" : "default"}
                    className="w-full"
                    // className={`w-full h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                    //   isCurrentPlan
                    //     ? "bg-background text-muted-foreground cursor-not-allowed"
                    //     : plan.popular
                    //     ? "bg-foreground text-foreground hover:bg-background/90"
                    //     : "border bg-background hover:bg-background/90 text-foreground"
                    // }`}
                  >
                    {processingPlan === plan.id ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Processing...
                      </span>
                    ) : isCurrentPlan ? (
                      "Current plan"
                    ) : plan.id === "free" ? (
                      "Contact support"
                    ) : plan.cta.includes("Contact") ? (
                      "Contact sales"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>

                  {/* Features List */}
                  <ul className="space-y-2 pt-2 border-t border-background">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
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

      {/* Additional Info */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-medium text-foreground mb-3">Need help?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Have questions about plans or billing? Our team is here to help.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:support@casevia.io"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border bg-background text-sm font-medium transition-colors"
          >
            Contact support
          </a>
          <a
            href="/docs/billing"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            View documentation
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
