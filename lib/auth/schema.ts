import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  isAnonymous: boolean("is_anonymous"),
  hasOnboarded: boolean("has_onboarded").default(false).notNull(), // 👈 new field
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  activeOrganizationId: text("active_organization_id"),
  hasOnboarded: boolean("has_onboarded").default(false).notNull(), // 👈 new field
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").default("member").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const project = pgTable("project", {
  id: text("id").primaryKey(), // Using text for consistency with your schema
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("uploading"), // uploading | transcribing | analyzing | ready | failed
  durationSeconds: integer("duration_seconds"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  transcript: text("transcript"),
  assemblyAiId: text("assembly_ai_id"), // Store AssemblyAI transcript ID
  speakerLabels: jsonb("speaker_labels"), // Store speaker diarization data
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const caseStudy = pgTable("case_study", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Core content
  title: text("title").notNull(),
  summary: text("summary"),
  clientName: text("client_name"),
  clientIndustry: text("client_industry"),

  // Structured narrative
  challenge: text("challenge"),
  solution: text("solution"),
  results: text("results"),

  // AI-extracted data
  keyQuotes:
    jsonb("key_quotes").$type<
      Array<{ text: string; speaker: string; timestamp?: number }>
    >(),
  metrics: jsonb("metrics").$type<Array<{ metric: string; quote: string }>>(),
  keyTakeaways: jsonb("key_takeaways").$type<string[]>(),

  // Publishing
  published: boolean("published").default(false).notNull(),
  publicSlug: text("public_slug").unique(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),

  // Branding (Pro/Agency plans)
  customBranding: jsonb("custom_branding").$type<{
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  }>(),

  // Template
  templateUsed: text("template_used").default("default"),

  // Analytics
  viewCount: integer("view_count").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const socialPost = pgTable("social_post", {
  id: text("id").primaryKey(),
  caseStudyId: text("case_study_id")
    .notNull()
    .references(() => caseStudy.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // linkedin | x | email
  content: text("content").notNull(),
  status: text("status").default("draft").notNull(), // draft | published
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const planLimits = pgTable("plan_limits", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull(), // free | freelancer | pro | agency

  // Usage tracking
  caseStudiesUsed: integer("case_studies_used").default(0).notNull(),
  storageUsedMb: integer("storage_used_mb").default(0).notNull(),
  socialPostsUsed: integer("social_posts_used").default(0).notNull(),

  // Reset tracking
  resetAt: timestamp("reset_at").notNull(), // When the monthly limit resets
  lastResetAt: timestamp("last_reset_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Analytics table (optional for later)
export const analytics = pgTable("analytics", {
  id: text("id").primaryKey(),
  caseStudyId: text("case_study_id")
    .notNull()
    .references(() => caseStudy.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // view | share | export
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
