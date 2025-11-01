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
          <p className="text-sm text-gray-500">
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
        <p className="text-sm text-gray-500">
          Manage your subscription and billing preferences
        </p>
      </div>

      {/* Current Subscription Card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="p-6 space-y-6">
          {/* Subscription Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current plan</p>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentPlan.name}
                  </h2>
                </div>
              </div>
            </div>
            {activeSubscription && (
              <button
                onClick={openCustomerPortal}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Manage billing
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Subscription Details */}
          {activeSubscription ? (
            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>Organization</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {activeOrg?.name || "Organization"}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Billing period</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(activeSubscription.currentPeriodStart)} —{" "}
                  {formatDate(activeSubscription.currentPeriodEnd)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CreditCard className="w-4 h-4" />
                  <span>Amount</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  ${(activeSubscription.amount / 100).toFixed(2)} /{" "}
                  {activeSubscription.recurringInterval}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-100">
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
            <h2 className="text-lg font-semibold text-gray-900">
              Available plans
            </h2>
            <p className="text-sm text-gray-500">
              Choose a plan that works for you
            </p>
          </div>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] text-green-600 font-semibold">
                Save 17%
              </span>
            </button>
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
                className={`rounded-lg border bg-white transition-all ${
                  isCurrentPlan
                    ? "ring-2 ring-gray-900 border-gray-900"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                } ${plan.popular ? "relative" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-gray-900 text-white text-xs font-medium">
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
                        <h3 className="font-semibold text-gray-900">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {plan.description}
                        </p>
                      </div>
                      {isCurrentPlan && (
                        <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-gray-100 text-gray-900 text-xs font-medium">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-gray-900">
                        {displayPrice}
                      </span>
                      <span className="text-sm text-gray-500">/mo</span>
                    </div>

                    {billingInterval === "yearly" && plan.id !== "free" && (
                      <p className="text-xs text-gray-500">
                        ${price} billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanChange(plan.id)}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    className={`w-full h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : plan.popular
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-900"
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
                      "Contact support"
                    ) : plan.cta.includes("Contact") ? (
                      "Contact sales"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>

                  {/* Features List */}
                  <ul className="space-y-2 pt-2 border-t border-gray-100">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-600 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-gray-500 pl-5">
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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="font-medium text-gray-900 mb-3">Need help?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Have questions about plans or billing? Our team is here to help.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:support@casevia.io"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Contact support
          </a>
          <a
            href="/docs/billing"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            View documentation
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
