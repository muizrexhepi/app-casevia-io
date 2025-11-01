"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
import { SubscriptionProvider } from "./subscription-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SubscriptionProvider>
          {children}
          <Toaster />
        </SubscriptionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
