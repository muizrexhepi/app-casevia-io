"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Check,
  Loader2,
  Sparkles,
  Building2,
  Rocket,
  Users,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";

type Step = "role" | "organization" | "subscription";
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
    slug: null,
    description: "Perfect for trying out",
    price: 0,
    features: ["1 case study/month", "Basic templates", "AI transcription"],
  },
  {
    id: "freelancer",
    name: "Freelancer",
    slug: "starter",
    description: "For individuals",
    price: 29,
    features: ["5 case studies", "30 min videos", "Custom branding"],
  },
  {
    id: "pro",
    name: "Pro",
    slug: "pro",
    description: "For small teams",
    price: 79,
    features: ["20 case studies", "Full analytics", "Priority support"],
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    slug: "agency",
    description: "For agencies",
    price: 149,
    features: ["50 case studies", "Unlimited seats", "Dedicated support"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<OnboardingData>({
    role: "",
    organizationName: "",
    organizationSlug: "",
    teamSize: "",
    usageFrequency: "",
    industry: "",
    selectedPlan: "free",
  });

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleOrgNameChange = (name: string) => {
    setData({
      ...data,
      organizationName: name,
      organizationSlug: generateSlug(name),
    });
  };

  const canProceed = () => {
    if (step === "role") return data.role !== "";
    if (step === "organization")
      return data.organizationName && data.organizationSlug;
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      toast.error("Please complete all required fields");
      return;
    }

    if (step === "role") {
      setStep("organization");
    } else if (step === "organization") {
      setStep("subscription");
    } else if (step === "subscription") {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    startTransition(async () => {
      try {
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

        await authClient.organization.setActive({
          organizationId: orgData.id,
        });

        await fetch("/api/user/update-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: data.role }),
        });

        if (data.selectedPlan !== "free") {
          const plan = PLANS.find((p) => p.id === data.selectedPlan);
          if (plan?.slug) {
            await authClient.checkout({
              slug: `${plan.slug}-monthly`,
              referenceId: orgData.id,
            });
            return;
          }
        }

        toast.success("Welcome to Casevia!");
        router.push("/dashboard/projects");
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong. Please try again.");
      }
    });
  };

  const roleOptions = [
    {
      value: "freelancer",
      label: "Freelancer",
      subtitle: "Individual consultant",
      icon: Users,
      emoji: "👤",
    },
    {
      value: "agency",
      label: "Agency",
      subtitle: "Creative or marketing team",
      icon: Building2,
      emoji: "🏢",
    },
    {
      value: "business",
      label: "Business",
      subtitle: "Startup or enterprise",
      icon: Rocket,
      emoji: "🚀",
    },
    {
      value: "other",
      label: "Other",
      subtitle: "Something else",
      icon: Sparkles,
      emoji: "✨",
    },
  ];

  const stepNumber = step === "role" ? 1 : step === "organization" ? 2 : 3;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold">Casevia</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={stepNumber >= 1 ? "text-gray-900 font-medium" : ""}>
            Role
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={stepNumber >= 2 ? "text-gray-900 font-medium" : ""}>
            Workspace
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={stepNumber >= 3 ? "text-gray-900 font-medium" : ""}>
            Plan
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px]">
          <div className="space-y-8">
            {/* Step 1: Role */}
            {step === "role" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    What best describes you?
                  </h1>
                  <p className="text-sm text-gray-500">
                    This helps us personalize your experience
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setData({ ...data, role: option.value as UserRole })
                      }
                      className={`group relative p-4 rounded-lg border text-left transition-all ${
                        data.role === option.value
                          ? "border-gray-900 bg-gray-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="text-2xl">{option.emoji}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-0.5">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.subtitle}
                          </div>
                        </div>
                      </div>
                      {data.role === option.value && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Organization */}
            {step === "organization" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Create your workspace
                  </h1>
                  <p className="text-sm text-gray-500">
                    You can always change this later
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Workspace name
                    </label>
                    <input
                      type="text"
                      value={data.organizationName}
                      onChange={(e) => handleOrgNameChange(e.target.value)}
                      placeholder="Acme Inc."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Workspace URL
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 whitespace-nowrap">
                        casevia.io/
                      </span>
                      <input
                        type="text"
                        value={data.organizationSlug}
                        onChange={(e) =>
                          setData({ ...data, organizationSlug: e.target.value })
                        }
                        placeholder="acme-inc"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Team size
                      </label>
                      <select
                        value={data.teamSize}
                        onChange={(e) =>
                          setData({
                            ...data,
                            teamSize: e.target.value as TeamSize,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="solo">Just me</option>
                        <option value="2-5">2-5 people</option>
                        <option value="6-20">6-20 people</option>
                        <option value="21+">21+ people</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Usage
                      </label>
                      <select
                        value={data.usageFrequency}
                        onChange={(e) =>
                          setData({
                            ...data,
                            usageFrequency: e.target.value as UsageFrequency,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="occasional">Occasionally</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Plan */}
            {step === "subscription" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Choose your plan
                  </h1>
                  <p className="text-sm text-gray-500">
                    You can upgrade or downgrade at any time
                  </p>
                </div>

                <div className="space-y-2">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() =>
                        setData({ ...data, selectedPlan: plan.id })
                      }
                      className={`group relative w-full p-4 rounded-lg border text-left transition-all ${
                        data.selectedPlan === plan.id
                          ? "border-gray-900 bg-gray-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {plan.name}
                            </span>
                            {plan.popular && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-900 text-white rounded">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            {plan.description}
                          </p>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-xl font-semibold text-gray-900">
                              ${plan.price}
                            </span>
                            <span className="text-xs text-gray-500">
                              /month
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {plan.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="text-xs text-gray-600 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-gray-400" />
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        {data.selectedPlan === plan.id && (
                          <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              {step !== "role" ? (
                <button
                  onClick={() => {
                    if (step === "organization") setStep("role");
                    else if (step === "subscription") setStep("organization");
                  }}
                  disabled={isPending}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed() || isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : step === "subscription" ? (
                  "Complete setup"
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
