"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Loader2,
  Sparkles,
  Building2,
  Rocket,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type Step = "role" | "organization" | "subscription" | "complete";
type UserRole = "freelancer" | "agency" | "business" | "other";
type TeamSize = "solo" | "2-5" | "6-20" | "21+";
type UsageFrequency = "occasional" | "weekly" | "daily";

interface OnboardingData {
  role: UserRole | "";
  organizationName: string;
  organizationSlug: string;
  teamSize: TeamSize | "";
  usageFrequency: UsageFrequency | "";
  industry: string;
  selectedPlan: string;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    features: ["1 case study/month", "Basic templates", "AI transcription"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    price: 49,
    features: [
      "10 case studies/month",
      "Premium templates",
      "Priority support",
      "Custom branding",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For agencies & teams",
    price: 149,
    features: [
      "Unlimited case studies",
      "Team collaboration",
      "White-label",
      "API access",
    ],
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solution",
    price: 499,
    features: [
      "Everything in Business",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    popular: false,
  },
];

// Import these from your actual auth setup

export default function EnhancedOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animateIn, setAnimateIn] = useState(true);

  const { data: organizations, isPending: organizationsLoading } =
    authClient.useListOrganizations();
  const [data, setData] = useState<OnboardingData>({
    role: "",
    organizationName: "",
    organizationSlug: "",
    teamSize: "",
    usageFrequency: "",
    industry: "",
    selectedPlan: "free",
  });

  useEffect(() => {
    if (!organizationsLoading && organizations) {
      if (organizations.length > 0) {
        router.push("/dashboard");
      }
    }
  }, [organizations, organizationsLoading, router]);

  useEffect(() => {
    setAnimateIn(false);
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleOrganizationNameChange = (name: string) => {
    setData({
      ...data,
      organizationName: name,
      organizationSlug: generateSlug(name),
    });
  };

  const handleNext = async () => {
    setError("");

    if (currentStep === "role") {
      if (!data.role) {
        setError("Please select your role");
        return;
      }
      setCurrentStep("organization");
    } else if (currentStep === "organization") {
      if (!data.organizationName || !data.organizationSlug) {
        setError("Please provide organization details");
        return;
      }
      setCurrentStep("subscription");
    } else if (currentStep === "subscription") {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError("");

    try {
      // Create organization using Better Auth
      const { data: orgData, error: orgError } =
        await authClient.organization.create({
          name: data.organizationName,
          slug: data.organizationSlug,
          metadata: {
            teamSize: data.teamSize,
            usageFrequency: data.usageFrequency,
            industry: data.industry,
            userRole: data.role,
          },
        });

      if (orgError || !orgData) {
        throw new Error(orgError?.message || "Failed to create organization");
      }

      // Update user role via API
      await fetch("/api/user/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: data.role }),
      });

      // If not free plan, initiate Polar checkout
      if (data.selectedPlan !== "free") {
        await authClient.checkout({
          slug: data.selectedPlan,
          referenceId: orgData.id,
        });
        return;
      }

      // Redirect to dashboard if free plan
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.message || "Failed to complete onboarding. Please try again."
      );
      setLoading(false);
    }
  };

  if (organizationsLoading || (organizations && organizations.length > 0)) {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{ minHeight: "60vh" }}
      >
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const roleOptions = [
    {
      value: "freelancer",
      label: "Freelancer",
      subtitle: "Individual consultant",
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      value: "agency",
      label: "Agency",
      subtitle: "Creative or marketing team",
      icon: Building2,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      value: "business",
      label: "Business",
      subtitle: "Startup or enterprise",
      icon: Rocket,
      gradient: "from-orange-500 to-red-500",
    },
    {
      value: "other",
      label: "Other",
      subtitle: "Something else",
      icon: Sparkles,
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const stepNumber =
    currentStep === "role" ? 1 : currentStep === "organization" ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Casevia
          </h1>
          <p className="text-gray-600">
            Let's get your workspace ready in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    step < stepNumber
                      ? "bg-blue-600 text-white"
                      : step === stepNumber
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step < stepNumber ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div className="flex-1 h-1 mx-3">
                    <div className="h-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-blue-600 transition-all duration-500 ${
                          step < stepNumber ? "w-full" : "w-0"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span
              className={stepNumber === 1 ? "text-blue-600 font-medium" : ""}
            >
              Your Role
            </span>
            <span
              className={stepNumber === 2 ? "text-blue-600 font-medium" : ""}
            >
              Workspace
            </span>
            <span
              className={stepNumber === 3 ? "text-blue-600 font-medium" : ""}
            >
              Plan
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 text-xs">!</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content Card */}
        <div
          className={`bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 md:p-12 transition-all duration-500 ${
            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Step 1: Role Selection */}
          {currentStep === "role" && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                What best describes you?
              </h2>
              <p className="text-gray-600 mb-8">
                Help us tailor your experience to your needs
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = data.role === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setData({ ...data, role: option.value as UserRole })
                      }
                      className={`group relative p-6 rounded-xl text-left transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-500 shadow-lg shadow-blue-500/10"
                          : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg"
                      }`}
                    >
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${
                          option.gradient
                        } transition-transform duration-300 ${
                          isSelected ? "scale-110" : "group-hover:scale-105"
                        }`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-600">{option.subtitle}</p>

                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Organization Setup */}
          {currentStep === "organization" && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Set up your workspace
              </h2>
              <p className="text-gray-600 mb-8">
                Create your organization to start building case studies
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={data.organizationName}
                    onChange={(e) =>
                      handleOrganizationNameChange(e.target.value)
                    }
                    placeholder="Acme Inc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization URL
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                      casevia.io/
                    </span>
                    <input
                      type="text"
                      value={data.organizationSlug}
                      onChange={(e) =>
                        setData({ ...data, organizationSlug: e.target.value })
                      }
                      placeholder="acme-inc"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This will be your organization's unique URL
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Size
                    </label>
                    <select
                      value={data.teamSize}
                      onChange={(e) =>
                        setData({
                          ...data,
                          teamSize: e.target.value as TeamSize,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                    >
                      <option value="">Select size</option>
                      <option value="solo">Just me</option>
                      <option value="2-5">2-5 people</option>
                      <option value="6-20">6-20 people</option>
                      <option value="21+">21+ people</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Frequency
                    </label>
                    <select
                      value={data.usageFrequency}
                      onChange={(e) =>
                        setData({
                          ...data,
                          usageFrequency: e.target.value as UsageFrequency,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                    >
                      <option value="">Select frequency</option>
                      <option value="occasional">Occasionally</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={data.industry}
                    onChange={(e) =>
                      setData({ ...data, industry: e.target.value })
                    }
                    placeholder="e.g., Marketing, SaaS, Consulting"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Subscription Selection */}
          {currentStep === "subscription" && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Choose your plan
              </h2>
              <p className="text-gray-600 mb-8">
                Start free, upgrade anytime. No credit card required.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {PLANS.map((plan) => {
                  const isSelected = data.selectedPlan === plan.id;

                  return (
                    <button
                      key={plan.id}
                      onClick={() =>
                        setData({ ...data, selectedPlan: plan.id })
                      }
                      className={`relative p-6 rounded-xl text-left transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-500 shadow-lg shadow-blue-500/10 scale-105"
                          : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-102"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                          Popular
                        </span>
                      )}

                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-600 text-sm">/mo</span>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start text-xs text-gray-600"
                          >
                            <Check className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">💡 Pro tip:</span> Start with
                  the free plan to explore all features. Upgrade anytime as your
                  needs grow.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-100">
            <button
              onClick={() => {
                if (currentStep === "organization") setCurrentStep("role");
                else if (currentStep === "subscription")
                  setCurrentStep("organization");
              }}
              disabled={currentStep === "role"}
              className="px-6 py-2.5 text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : currentStep === "subscription" ? (
                "Complete Setup"
              ) : (
                "Continue →"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:support@casevia.io"
              className="text-blue-600 hover:text-blue-700"
            >
              support@casevia.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
