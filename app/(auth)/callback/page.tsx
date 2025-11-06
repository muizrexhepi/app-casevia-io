"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a bit for the session to be established
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check if user has organizations
        const { data: orgs } = await authClient.organization.list();

        if (orgs && orgs.length > 0) {
          // User has organizations, go to dashboard
          router.push("/dashboard/projects");
        } else {
          // User needs to complete onboarding
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Callback error:", error);
        // On error, redirect to sign in
        router.push("/sign-in");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        <p className="text-sm text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
}
