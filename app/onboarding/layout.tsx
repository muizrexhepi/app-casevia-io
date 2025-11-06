import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Must be authenticated to access onboarding
  if (!session) {
    redirect("/sign-in");
  }

  // If user already has an organization, redirect to dashboard
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (organizations && organizations.length > 0) {
    redirect("/dashboard/projects");
  }

  return <>{children}</>;
}
