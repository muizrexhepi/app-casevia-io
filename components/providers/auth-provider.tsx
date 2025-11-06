"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/sign-in?callbackUrl=${callbackUrl}`);
    }
  }, [session, isPending, router, pathname]);

  return { session, isPending };
}
