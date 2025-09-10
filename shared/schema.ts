import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const generationEnum = pgEnum('generation', ['gen_z', 'millennial', 'gen_x', 'boomer']);
export const organizationTypeEnum = pgEnum('organization_type', ['church', 'remote_team', 'smb']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['seeker', 'pioneer', 'visionary']);
export const developmentStageEnum = pgEnum('development_stage', ['r1', 'r2', 'r3', 'r4', 'r5', 'hidden_track']);
export const archetypeEnum = pgEnum('archetype', ['pioneer', 'organizer', 'builder', 'guardian']);

// User storage table (supports both Replit Auth and local auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(), // for local auth
  password: varchar("password"), // hashed password for local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  hebrewName: varchar("hebrew_name"),
  generation: generationEnum("generation"),
  archetype: archetypeEnum("archetype"),
  currentStage: developmentStageEnum("current_stage").default('r1'),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default('seeker'),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  organizationId: varchar("organization_id"),
  authType: varchar("auth_type").default('replit'), // 'replit' or 'local'
  isDemo: boolean("is_demo").default(false), // mark demo accounts
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: organizationTypeEnum("type").notNull(),
  size: varchar("size"),
  structure: jsonb("structure"), // ministry areas, departments, etc.
  settings: jsonb("settings"), // configuration options
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  organizationId: varchar("organization_id").notNull(),
  leaderId: varchar("leader_id").notNull(),
  generationalMix: jsonb("generational_mix"), // generation distribution
  pactDetails: jsonb("pact_details"), // team agreements and protocols
  status: varchar("status").default('forming'), // forming, active, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").default('member'), // leader, member, observer
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stage: developmentStageEnum("stage").notNull(),
  responses: jsonb("responses").notNull(),
  results: jsonb("results"), // calculated scores and insights
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyPractices = pgTable("daily_practices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  practiceType: varchar("practice_type").notNull(), // genesis_reflection, frequency_meditation, team_checkin
  completed: boolean("completed").default(false),
  duration: integer("duration"), // in minutes
  notes: text("notes"),
  generationAdaptation: jsonb("generation_adaptation"), // how practice was adapted
  createdAt: timestamp("created_at").defaultNow(),
});

export const progressMetrics = pgTable("progress_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  teamId: varchar("team_id"),
  metricType: varchar("metric_type").notNull(), // completion_rate, tribal_alignment, cross_gen_effectiveness
  value: integer("value").notNull(),
  period: varchar("period").notNull(), // daily, weekly, monthly
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  assessments: many(assessments),
  dailyPractices: many(dailyPractices),
  progressMetrics: many(progressMetrics),
  teamMemberships: many(teamMembers),
  ledTeams: many(teams, { relationName: "teamLeader" }),
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  teams: many(teams),
}));

export const teamRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
    relationName: "teamLeader",
  }),
  members: many(teamMembers),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const assessmentRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
}));

export const dailyPracticeRelations = relations(dailyPractices, ({ one }) => ({
  user: one(users, {
    fields: [dailyPractices.userId],
    references: [users.id],
  }),
}));

export const progressMetricRelations = relations(progressMetrics, ({ one }) => ({
  user: one(users, {
    fields: [progressMetrics.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [progressMetrics.teamId],
    references: [teams.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertDailyPracticeSchema = createInsertSchema(dailyPractices).omit({
  id: true,
  createdAt: true,
});

// Biblical Matrix Schema - The 5-Book Hebrew Letter Framework
export const sacredMatrix = pgTable("sacred_matrix", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterNumber: integer("chapter_number").notNull(),
  bookNumber: integer("book_number").notNull(),
  divineName: varchar("divine_name").notNull(), // Yod, Heh, Vav, Final Heh, YESHUA
  bookName: varchar("book_name").notNull(),
  bookTheme: text("book_theme").notNull(),
  chapterTitle: text("chapter_title").notNull(),
  geometryIcon: varchar("geometry_icon").notNull(), // Sacred geometry shape
  stone: varchar("stone").notNull(), // Precious stone
  element: varchar("element").notNull(), // Fire, Air, Water, Earth, Plasma
  templeSpace: varchar("temple_space").notNull(), // Altar, Holy Place, etc.
  storyStage: varchar("story_stage").notNull(), // Exposition, Rising Action, etc.
  dimension: varchar("dimension").notNull(), // 1 Glory, 2 Presence, etc.
  fractalGate: varchar("fractal_gate").notNull(), // Revelation, Internalization, etc.
  spiritualFrequency: varchar("spiritual_frequency").notNull(), // Frequency name
  bookColor: varchar("book_color").notNull(),
  tribe: varchar("tribe"),
  prophet: varchar("prophet"),
  apostle: varchar("apostle"),
  directionalMapping: varchar("directional_mapping"), // North, South, East, West, Center, Global
  createdAt: timestamp("created_at").defaultNow(),
});

// Biblical Matrix Relations
export const biblicalMatrixRelations = relations(sacredMatrix, ({ many }) => ({
  // Could relate to user assessments based on their current chapter/book
}));

export const insertSacredMatrixSchema = createInsertSchema(sacredMatrix).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type DailyPractice = typeof dailyPractices.$inferSelect;
export type ProgressMetric = typeof progressMetrics.$inferSelect;
export type SacredMatrixEntry = typeof sacredMatrix.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertDailyPractice = z.infer<typeof insertDailyPracticeSchema>;
export type InsertSacredMatrixEntry = z.infer<typeof insertSacredMatrixSchema>;
