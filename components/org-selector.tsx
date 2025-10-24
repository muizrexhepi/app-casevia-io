"use client";

import { useEffect } from "react";
import { authClient, useActiveOrganization } from "@/lib/auth/client";

export function OrganizationAutoSelector() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    async function autoSelectOrganization() {
      // Only run if user is logged in and no active org is set
      if (session?.user && !activeOrg) {
        const { data: orgs } = await authClient.organization.list();

        if (orgs && orgs.length > 0) {
          // Set the first organization as active
          await authClient.organization.setActive({
            organizationId: orgs[0].id,
          });
        }
      }
    }

    autoSelectOrganization();
  }, [session, activeOrg]);

  return null;
}
