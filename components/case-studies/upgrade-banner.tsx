// app/dashboard/case-studies/UpgradeBanner.tsx
"use client";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

interface UpgradeBannerProps {
  planName: string;
  limit: number;
}

export function UpgradeBanner({ planName, limit }: UpgradeBannerProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-800">
            Case Study Limit Reached
          </h3>
          <p className="text-sm text-red-700">
            You have used all {limit} case studies included in your {planName}{" "}
            plan. Please upgrade to create more.
          </p>
        </div>
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shrink-0"
        >
          Upgrade Plan <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
