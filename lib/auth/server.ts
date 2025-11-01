import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Polar } from "@polar-sh/sdk";
import { polar, checkout, portal, usage } from "@polar-sh/better-auth";
import { db } from "../drizzle";
import * as schema from "./schema";
import { admin, anonymous, organization } from "better-auth/plugins";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
});

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      // // attach anything useful to customers
      // customerMetadataResolver: async ({ user, session }) => ({
      //   userId: user.id,
      //   activeOrgId: session?.activeOrganizationId ?? null,
      // }),
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_PRICE_STARTER_MONTHLY!,
              slug: "starter-monthly",
            },
            {
              productId: process.env.POLAR_PRICE_STARTER_YEARLY!,
              slug: "starter-yearly",
            },
            {
              productId: process.env.POLAR_PRICE_PRO_MONTHLY!,
              slug: "pro-monthly",
            },
            {
              productId: process.env.POLAR_PRICE_PRO_YEARLY!,
              slug: "pro-yearly",
            },
            {
              productId: process.env.POLAR_PRICE_AGENCY_MONTHLY!,
              slug: "agency-monthly",
            },
            {
              productId: process.env.POLAR_PRICE_AGENCY_YEARLY!,
              slug: "agency-yearly",
            },
          ],
          successUrl: `${process.env.BETTER_AUTH_URL}/billing?checkout=success&checkout_id={CHECKOUT_ID}`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
      ],
    }),
    admin(),
    anonymous(),
    organization(),
  ],
});
