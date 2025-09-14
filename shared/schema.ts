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
export const generationEnum = pgEnum('generation', ['gen_z', 'millennial', 'gen_x', 'boomer', 'silent']);
export const organizationTypeEnum = pgEnum('organization_type', ['church', 'remote_team', 'smb']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['seeker', 'pioneer', 'visionary']);
export const developmentStageEnum = pgEnum('development_stage', ['r1', 'r2', 'r3', 'r4', 'r5', 'hidden_track']);
export const archetypeEnum = pgEnum('archetype', ['pioneer', 'organizer', 'builder', 'guardian']);
export const gateTypeEnum = pgEnum('gate_type', ['identity_mirror', 'shofar_convergence', 'network_multiplication', 'twelve_gate_convergence']);

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
  // Game progression fields
  experiencePoints: integer("experience_points").default(0),
  level: integer("level").default(1),
  currentChapterId: varchar("current_chapter_id"), // Points to sacredMatrix entry
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
  progress: one(userProgress),
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

// Stripe request validation schemas
export const createSubscriptionSchema = z.object({
  tier: z.enum(['seeker', 'pioneer', 'visionary']),
});

export const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().optional().default(true),
});

export const updateTierSchema = z.object({
  newTier: z.enum(['seeker', 'pioneer', 'visionary']),
});

export const webhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  created: z.number(),
  livemode: z.boolean(),
});

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

// User progression tracking
export interface UserProgress {
  currentBook: 1 | 2 | 3 | 4 | 5;
  completedChapters: number[];
  archetype: 'pioneer' | 'organizer' | 'builder' | 'guardian';
  generation: 'gen-z' | 'millennial' | 'gen-x' | 'boomer';
  unlockedDimensions: string[];
  sacredShapesMastered: string[];
}

// User Progress Table for Biblical Matrix tracking
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  currentBook: integer("current_book").notNull().default(1),
  currentChapterId: varchar("current_chapter_id"), // Points to sacredMatrix entry
  completedChapters: jsonb("completed_chapters").notNull().default('[]'),
  unlockedChapters: jsonb("unlocked_chapters").notNull().default('[1]'), // Start with chapter 1 unlocked
  unlockedDimensions: jsonb("unlocked_dimensions").notNull().default('[]'),
  sacredShapesMastered: jsonb("sacred_shapes_mastered").notNull().default('[]'),
  lastChapterCompleted: integer("last_chapter_completed"),
  totalChaptersCompleted: integer("total_chapters_completed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gate Progress Table for Special Gates
export const gateProgress = pgTable("gate_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gateType: gateTypeEnum("gate_type").notNull(),
  chapterNumber: integer("chapter_number").notNull(), // 1, 25, 26, 27
  unlocked: boolean("unlocked").default(false),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  experienceGained: integer("experience_gained").default(100), // Special gates give more XP
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Progress Relations
export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
}));

export const gateProgressRelations = relations(gateProgress, ({ one }) => ({
  user: one(users, {
    fields: [gateProgress.userId],
    references: [users.id],
  }),
}));

// Insert schema for user progress
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schema for gate progress
export const insertGateProgressSchema = createInsertSchema(gateProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type UserProgressEntry = typeof userProgress.$inferSelect;
export type GateProgress = typeof gateProgress.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertDailyPractice = z.infer<typeof insertDailyPracticeSchema>;
export type InsertSacredMatrixEntry = z.infer<typeof insertSacredMatrixSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertGateProgress = z.infer<typeof insertGateProgressSchema>;

// Stripe request types
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionSchema>;
export type CancelSubscriptionRequest = z.infer<typeof cancelSubscriptionSchema>;
export type UpdateTierRequest = z.infer<typeof updateTierSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;

// Chapter progression tables
export const chapterProgress = pgTable('chapter_progress', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  completed: boolean('completed').default(false),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  assessmentScore: integer('assessment_score'),
  practiceMinutes: integer('practice_minutes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userGeneration = pgTable('user_generation', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().unique(),
  birthYear: integer('birth_year'),
  generation: varchar('generation').notNull(), // 'gen-z', 'millennial', 'gen-x', 'boomer'
  detectedAt: timestamp('detected_at').defaultNow(),
});

export const chapterAssessments = pgTable('chapter_assessments', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  responses: jsonb('responses').notNull(),
  score: integer('score').notNull(),
  passed: boolean('passed').default(false),
  completedAt: timestamp('completed_at').defaultNow(),
});

// Chapter progression relations
export const chapterProgressRelations = relations(chapterProgress, ({ one }) => ({
  user: one(users, {
    fields: [chapterProgress.userId],
    references: [users.id],
  }),
}));

export const userGenerationRelations = relations(userGeneration, ({ one }) => ({
  user: one(users, {
    fields: [userGeneration.userId],
    references: [users.id],
  }),
}));

export const chapterAssessmentRelations = relations(chapterAssessments, ({ one }) => ({
  user: one(users, {
    fields: [chapterAssessments.userId],
    references: [users.id],
  }),
}));

// Insert schemas for new tables
export const insertChapterProgressSchema = createInsertSchema(chapterProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserGenerationSchema = createInsertSchema(userGeneration).omit({
  id: true,
  detectedAt: true,
});

export const insertChapterAssessmentSchema = createInsertSchema(chapterAssessments).omit({
  id: true,
  completedAt: true,
});

// Types for new tables
export type ChapterProgress = typeof chapterProgress.$inferSelect;
export type NewChapterProgress = typeof chapterProgress.$inferInsert;
export type UserGeneration = typeof userGeneration.$inferSelect;
export type NewUserGeneration = typeof userGeneration.$inferInsert;
export type ChapterAssessment = typeof chapterAssessments.$inferSelect;
export type NewChapterAssessment = typeof chapterAssessments.$inferInsert;

export type InsertChapterProgress = z.infer<typeof insertChapterProgressSchema>;
export type InsertUserGeneration = z.infer<typeof insertUserGenerationSchema>;
export type InsertChapterAssessment = z.infer<typeof insertChapterAssessmentSchema>;

// Game progression response types for API
export interface GameProgressResponse {
  user: {
    id: string;
    experiencePoints: number;
    level: number;
    currentChapterId?: string;
  };
  progress: {
    currentBook: number;
    currentChapterId?: string;
    completedChapters: number[];
    unlockedChapters: number[];
    totalChaptersCompleted: number;
  };
  gates: GateProgress[];
  availableChapters: SacredMatrixEntry[];
  nextMilestone?: {
    chapterNumber: number;
    isGate: boolean;
    title: string;
  };
}

// Chapter interface for matrix map - unified from all components
export interface Chapter {
  ch: number;
  book: string;
  divineName: string;
  bookName: string;
  bookTheme: string;
  chapterTitle: string;
  geometryIcon: string;
  stone: string;
  element: string;
  templeSpace: string;
  storyStage: string;
  dimension: string;
  fractalGate: string;
  spiritualFrequency: string;
  bookColor: string;
  tribe: string;
  prophet: string;
  prophet2: string;
  apostle: string;
  directionalMapping: string;
}

// Complete 27-chapter matrix data with directional mappings
export const CHAPTERS: Chapter[] = [
  { ch: 1, book: "Book 1", divineName: "Yod", bookName: "Becoming Rooted", bookTheme: "Identity, Calling, and the Formation of Glory", chapterTitle: "Leadership Begins at the Altar", geometryIcon: "Square", stone: "Sardius", element: "Fire", templeSpace: "Altar", storyStage: "Exposition", dimension: "1 Glory", fractalGate: "Revelation", spiritualFrequency: "Deep Stillness", bookColor: "Red", tribe: "Reuben", prophet: "Hosea", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 2, book: "Book 1", divineName: "Yod", bookName: "Becoming Rooted", bookTheme: "Identity, Calling, and the Formation of Glory", chapterTitle: "The Tripartite Leader: Spirit, Soul, and Body", geometryIcon: "Equilateral Triangle", stone: "Topaz", element: "Fire", templeSpace: "Altar", storyStage: "Rising Action", dimension: "6 Image", fractalGate: "Internalization", spiritualFrequency: "Triune Tone", bookColor: "Red", tribe: "Simeon", prophet: "Joel", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 3, book: "Book 1", divineName: "Yod", bookName: "Becoming Rooted", bookTheme: "Identity, Calling, and the Formation of Glory", chapterTitle: "Why We Had to Leave Eden", geometryIcon: "2D Spiral", stone: "Emerald", element: "Fire", templeSpace: "Altar", storyStage: "Climax", dimension: "2 Presence", fractalGate: "Embodiment", spiritualFrequency: "Exilic Echo", bookColor: "Red", tribe: "Levi", prophet: "Amos", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 4, book: "Book 1", divineName: "Yod", bookName: "Becoming Rooted", bookTheme: "Identity, Calling, and the Formation of Glory", chapterTitle: "Formation in Exile: The Purpose of the Fall", geometryIcon: "Isometric Cube", stone: "Carbuncle", element: "Fire", templeSpace: "Altar", storyStage: "Falling Action", dimension: "4 Word", fractalGate: "Integration", spiritualFrequency: "Structure Hum", bookColor: "Red", tribe: "Judah", prophet: "Obadiah", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 5, book: "Book 1", divineName: "Yod", bookName: "Becoming Rooted", bookTheme: "Identity, Calling, and the Formation of Glory", chapterTitle: "The Seed Hidden in the Dust", geometryIcon: "Monad Unity Point", stone: "Onyx", element: "Fire", templeSpace: "Altar", storyStage: "Resolution", dimension: "7 Name", fractalGate: "Hidden (North)", spiritualFrequency: "Subterranean Hum", bookColor: "Red", tribe: "Dan", prophet: "Jonah", prophet2: "", apostle: "", directionalMapping: "North" },
  { ch: 6, book: "Book 2", divineName: "Heh", bookName: "Becoming Aligned", bookTheme: "Patterns and the Spiritual Core of Leadership", chapterTitle: "Jesus as the Tree of Life, the Flaming Sword, and the Cosmic Unifier", geometryIcon: "Tetrahedron + Rays", stone: "Sapphire", element: "Air", templeSpace: "Holy Place", storyStage: "Exposition", dimension: "6 Image", fractalGate: "Revelation", spiritualFrequency: "Tree Flame Pulse", bookColor: "Blue", tribe: "Naphtali", prophet: "Micah", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 7, book: "Book 2", divineName: "Heh", bookName: "Becoming Aligned", bookTheme: "Patterns and the Spiritual Core of Leadership", chapterTitle: "The Divine Pattern: YHWH Structure and the Wings of Wisdom", geometryIcon: "Hexagonal Mandala", stone: "Diamond", element: "Air", templeSpace: "Holy Place", storyStage: "Rising Action", dimension: "4 Word", fractalGate: "Internalization", spiritualFrequency: "Wings of Wisdom Vibration", bookColor: "Blue", tribe: "Gad", prophet: "Nahum", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 8, book: "Book 2", divineName: "Heh", bookName: "Becoming Aligned", bookTheme: "Patterns and the Spiritual Core of Leadership", chapterTitle: "The Pattern Keeper: Heaven Interface and Leadership Design", geometryIcon: "Octahedron", stone: "Ligure", element: "Air", templeSpace: "Holy Place", storyStage: "Climax", dimension: "2 Presence", fractalGate: "Embodiment", spiritualFrequency: "Guardian Harmonic", bookColor: "Blue", tribe: "Asher", prophet: "Habakkuk", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 9, book: "Book 2", divineName: "Heh", bookName: "Becoming Aligned", bookTheme: "Patterns and the Spiritual Core of Leadership", chapterTitle: "The Fractal Pattern of Leadership", geometryIcon: "Fibonacci Spiral", stone: "Agate", element: "Air", templeSpace: "Holy Place", storyStage: "Falling Action", dimension: "5 Spirit", fractalGate: "Integration", spiritualFrequency: "Recursive Tone", bookColor: "Blue", tribe: "Issachar", prophet: "Zephaniah", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 10, book: "Book 2", divineName: "Heh", bookName: "Becoming Aligned", bookTheme: "Patterns and the Spiritual Core of Leadership", chapterTitle: "The Invisible Root System of Authority", geometryIcon: "Fractal Tree", stone: "Amethyst", element: "Air", templeSpace: "Holy Place", storyStage: "Resolution", dimension: "7 Name", fractalGate: "Hidden (South)", spiritualFrequency: "Root Resonance", bookColor: "Blue", tribe: "Zebulun", prophet: "Haggai", prophet2: "", apostle: "", directionalMapping: "South" },
  { ch: 11, book: "Book 3", divineName: "Vav", bookName: "Becoming Clear", bookTheme: "Vision, Emotional Intelligence, and the Inner Compass", chapterTitle: "Vision of God: The First Call of Every Leader", geometryIcon: "Icosahedron", stone: "Beryl", element: "Water", templeSpace: "Inner Light", storyStage: "Exposition", dimension: "1 Glory", fractalGate: "Revelation", spiritualFrequency: "Visionary Call", bookColor: "Teal", tribe: "Joseph (Ephraim)", prophet: "Zechariah", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 12, book: "Book 3", divineName: "Vav", bookName: "Becoming Clear", bookTheme: "Vision, Emotional Intelligence, and the Inner Compass", chapterTitle: "Vision of Self: Emotional Tools and Soul Awareness", geometryIcon: "Hexagonal Prism", stone: "Onyx (2)", element: "Water", templeSpace: "Inner Light", storyStage: "Rising Action", dimension: "3 Voice", fractalGate: "Internalization", spiritualFrequency: "Soul Frequency", bookColor: "Teal", tribe: "Benjamin", prophet: "Malachi", prophet2: "", apostle: "", directionalMapping: "" },
  { ch: 13, book: "Book 3", divineName: "Vav", bookName: "Becoming Clear", bookTheme: "Vision, Emotional Intelligence, and the Inner Compass", chapterTitle: "Vision of Mission: Discovering Your Divine Measure", geometryIcon: "Golden Ratio Spiral", stone: "Jasper", element: "Water", templeSpace: "Inner Light", storyStage: "Climax", dimension: "4 Word", fractalGate: "Embodiment", spiritualFrequency: "Mission Tuning", bookColor: "Teal", tribe: "", prophet: "John the Baptist", prophet2: "", apostle: "Peter", directionalMapping: "" },
  { ch: 14, book: "Book 3", divineName: "Vav", bookName: "Becoming Clear", bookTheme: "Vision, Emotional Intelligence, and the Inner Compass", chapterTitle: "The Wounded Visionary: Leading Through Inner Conflict", geometryIcon: "Mobius Strip", stone: "Sapphire", element: "Water", templeSpace: "Inner Light", storyStage: "Falling Action", dimension: "6 Image", fractalGate: "Integration", spiritualFrequency: "Wounded Harmony", bookColor: "Teal", tribe: "", prophet: "Elijah", prophet2: "", apostle: "James (Zebedee)", directionalMapping: "" },
  { ch: 15, book: "Book 3", divineName: "Vav", bookName: "Becoming Clear", bookTheme: "Vision, Emotional Intelligence, and the Inner Compass", chapterTitle: "Sacred Sight: From Revelation to Discernment", geometryIcon: "Metatron Cube", stone: "Chalcedony", element: "Water", templeSpace: "Inner Light", storyStage: "Resolution", dimension: "7 Name", fractalGate: "Hidden (East)", spiritualFrequency: "Sight Pulse", bookColor: "Teal", tribe: "", prophet: "John the Revelator", prophet2: "", apostle: "John", directionalMapping: "East" },
  { ch: 16, book: "Book 4", divineName: "Final Heh", bookName: "Becoming Embodied", bookTheme: "Walking in Wisdom, Spirit, and Glory", chapterTitle: "Emotional Intelligence and Passion", geometryIcon: "3D Pentagon", stone: "Emerald (2)", element: "Earth", templeSpace: "Holy of Holies", storyStage: "Exposition", dimension: "5 Spirit", fractalGate: "Revelation", spiritualFrequency: "Passion Current", bookColor: "Green", tribe: "", prophet: "Samuel", prophet2: "", apostle: "Andrew", directionalMapping: "" },
  { ch: 17, book: "Book 4", divineName: "Final Heh", bookName: "Becoming Embodied", bookTheme: "Walking in Wisdom, Spirit, and Glory", chapterTitle: "Intelligent Action: Decision-Making in Alignment with the Spirit", geometryIcon: "Tetrahedron", stone: "Sardonyx", element: "Earth", templeSpace: "Holy of Holies", storyStage: "Rising Action", dimension: "4 Word", fractalGate: "Internalization", spiritualFrequency: "Aligned Decision Pulse", bookColor: "Green", tribe: "", prophet: "Nathan", prophet2: "", apostle: "Philip", directionalMapping: "" },
  { ch: 18, book: "Book 4", divineName: "Final Heh", bookName: "Becoming Embodied", bookTheme: "Walking in Wisdom, Spirit, and Glory", chapterTitle: "Embodied Leadership: Why Your Body Matters", geometryIcon: "Isometric Grid", stone: "Carnelian", element: "Earth", templeSpace: "Holy of Holies", storyStage: "Climax", dimension: "6 Image", fractalGate: "Embodiment", spiritualFrequency: "Embodied Presence", bookColor: "Green", tribe: "", prophet: "Gad", prophet2: "", apostle: "Bartholomew", directionalMapping: "" },
  { ch: 19, book: "Book 4", divineName: "Final Heh", bookName: "Becoming Embodied", bookTheme: "Walking in Wisdom, Spirit, and Glory", chapterTitle: "Mentors and Mirrors: Leading Like Jesus in a Fractured World", geometryIcon: "Reflection Diagram", stone: "Chrysolite", element: "Earth", templeSpace: "Holy of Holies", storyStage: "Falling Action", dimension: "2 Presence", fractalGate: "Integration", spiritualFrequency: "Mirror Tone", bookColor: "Green", tribe: "", prophet: "David", prophet2: "", apostle: "Matthew", directionalMapping: "" },
  { ch: 20, book: "Book 4", divineName: "Final Heh", bookName: "Becoming Embodied", bookTheme: "Walking in Wisdom, Spirit, and Glory", chapterTitle: "The Body of Christ: Flesh Made Flame", geometryIcon: "Flower of Life", stone: "Beryl (2)", element: "Earth", templeSpace: "Holy of Holies", storyStage: "Resolution", dimension: "7 Name", fractalGate: "Hidden (West)", spiritualFrequency: "Radiant Bloom", bookColor: "Green", tribe: "", prophet: "Isaiah", prophet2: "", apostle: "Thomas", directionalMapping: "West" },
  { ch: 21, book: "Book 5", divineName: "YESHUA", bookName: "The Pattern Manifesto", bookTheme: "Jesus, the Fractal Fulfillment, and the Apostolic Flame", chapterTitle: "Yeshua: The Embodiment of YHWH", geometryIcon: "Star of David", stone: "Topaz (2)", element: "Plasma", templeSpace: "Ark", storyStage: "Exposition", dimension: "7 Name", fractalGate: "Revelation", spiritualFrequency: "Incarnational Wave", bookColor: "Gold/White", tribe: "", prophet: "Jeremiah", prophet2: "", apostle: "James (Alphaeus)", directionalMapping: "" },
  { ch: 22, book: "Book 5", divineName: "YESHUA", bookName: "The Pattern Manifesto", bookTheme: "Jesus, the Fractal Fulfillment, and the Apostolic Flame", chapterTitle: "The Father Pattern: Perfect Leadership Modeled", geometryIcon: "Vesica Piscis", stone: "Jacinth", element: "Plasma", templeSpace: "Ark", storyStage: "Rising Action", dimension: "1 Glory", fractalGate: "Internalization", spiritualFrequency: "Paternal Resonance", bookColor: "Gold/White", tribe: "", prophet: "Ezekiel", prophet2: "", apostle: "Simon the Zealot", directionalMapping: "" },
  { ch: 23, book: "Book 5", divineName: "YESHUA", bookName: "The Pattern Manifesto", bookTheme: "Jesus, the Fractal Fulfillment, and the Apostolic Flame", chapterTitle: "The Spirit Pattern: Power and Transformation", geometryIcon: "Torus", stone: "Agate (2)", element: "Plasma", templeSpace: "Ark", storyStage: "Climax", dimension: "5 Spirit", fractalGate: "Embodiment", spiritualFrequency: "Spirit Wind", bookColor: "Gold/White", tribe: "", prophet: "Daniel", prophet2: "", apostle: "Judas Iscariot", directionalMapping: "" },
  { ch: 24, book: "Book 5", divineName: "YESHUA", bookName: "The Pattern Manifesto", bookTheme: "Jesus, the Fractal Fulfillment, and the Apostolic Flame", chapterTitle: "The Son Pattern: Sacrifice and Resurrection", geometryIcon: "Cross + Circle", stone: "Amethyst (2)", element: "Plasma", templeSpace: "Ark", storyStage: "Falling Action", dimension: "6 Image", fractalGate: "Integration", spiritualFrequency: "Resurrectional Pulse", bookColor: "Gold/White", tribe: "", prophet: "Hosea (2)", prophet2: "", apostle: "Matthias", directionalMapping: "" },
  { ch: 25, book: "Book 5", divineName: "YESHUA", bookName: "The Pattern Manifesto", bookTheme: "Jesus, the Fractal Fulfillment, and the Apostolic Flame", chapterTitle: "The Bride Pattern: Unity and Glory", geometryIcon: "Wedding Ring", stone: "Chrysoprasus", element: "Plasma", templeSpace: "Ark", storyStage: "Resolution", dimension: "2 Presence", fractalGate: "Hidden (Center)", spiritualFrequency: "Bridal Harmony", bookColor: "Gold/White", tribe: "", prophet: "Song of Songs", prophet2: "", apostle: "Mary Magdalene", directionalMapping: "Center" },
  { ch: 26, book: "Book 6", divineName: "CHRIST", bookName: "The Christ Anointing", bookTheme: "The Pattern Replicated in Leadership", chapterTitle: "Becoming Christ: The Anointed Leader", geometryIcon: "Mandala", stone: "Sardius (2)", element: "Spirit", templeSpace: "Throne", storyStage: "Exposition", dimension: "7 Name", fractalGate: "Revelation", spiritualFrequency: "Anointing Flow", bookColor: "Pure Light", tribe: "", prophet: "Moses", prophet2: "", apostle: "Paul", directionalMapping: "" },
  { ch: 27, book: "Book 6", divineName: "CHRIST", bookName: "The Christ Anointing", bookTheme: "The Pattern Replicated in Leadership", chapterTitle: "The Ripple Effect: Multiplying Christ-like Leaders", geometryIcon: "Ripple Pattern", stone: "Jasper (2)", element: "Spirit", templeSpace: "Throne", storyStage: "Resolution", dimension: "3 Voice", fractalGate: "Multiplication", spiritualFrequency: "Ripple Wave", bookColor: "Pure Light", tribe: "", prophet: "Elisha", prophet2: "", apostle: "Timothy", directionalMapping: "" }
];
