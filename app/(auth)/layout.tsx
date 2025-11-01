import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { Sparkles } from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const organizations = await auth.api.listOrganizations({
      headers: await headers(),
    });

    if (organizations && organizations.length > 0) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal branding header */}
      <div className="flex items-center gap-2 px-6 py-4">
        <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold">Casevia</span>
      </div>

      {/* Centered auth forms */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center text-xs text-gray-500">
        © 2024 Casevia. All rights reserved.
      </div>
    </div>
  );
}
