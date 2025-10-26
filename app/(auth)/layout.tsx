import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  // const organizations = await auth.api.listOrganizations({
  //   headers: await headers(),
  // });

  // If user already has an organization, redirect to dashboard

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full p-6 max-w-md">
        {/* <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Casevia</h1>
        </div> */}
        {children}
      </div>
    </div>
  );
}
