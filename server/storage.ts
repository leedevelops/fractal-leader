import {
  users,
  organizations,
  teams,
  teamMembers,
  assessments,
  dailyPractices,
  progressMetrics,
  sacredMatrix,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Team,
  type InsertTeam,
  type TeamMember,
  type Assessment,
  type InsertAssessment,
  type DailyPractice,
  type InsertDailyPractice,
  type ProgressMetric,
  type SacredMatrixEntry,
  type InsertSacredMatrixEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser, userId?: string): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  
  // Demo account initialization
  initializeDemoAccounts(): Promise<void>;
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganization(userId: string): Promise<Organization | undefined>;
  
  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
  getOrganizationTeams(orgId: string): Promise<Team[]>;
  addTeamMember(teamId: string, userId: string, role?: string): Promise<TeamMember>;
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]>;
  
  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getUserAssessments(userId: string): Promise<Assessment[]>;
  getLatestAssessment(userId: string, stage: string): Promise<Assessment | undefined>;
  completeAssessment(id: string, results: any): Promise<Assessment>;
  
  // Daily practice operations
  createDailyPractice(practice: InsertDailyPractice): Promise<DailyPractice>;
  getUserDailyPractices(userId: string, startDate: Date, endDate: Date): Promise<DailyPractice[]>;
  completeDailyPractice(id: string, duration?: number, notes?: string): Promise<DailyPractice>;
  
  // Progress metrics operations
  getUserProgressMetrics(userId: string, metricType?: string): Promise<ProgressMetric[]>;
  getTeamProgressMetrics(teamId: string, metricType?: string): Promise<ProgressMetric[]>;
  calculateUserProgress(userId: string): Promise<any>;
  calculateTeamEffectiveness(teamId: string): Promise<any>;
  
  // Biblical Matrix operations
  getBiblicalMatrix(): Promise<SacredMatrixEntry[]>;
  getBiblicalMatrixByBook(bookNumber: number): Promise<SacredMatrixEntry[]>;
  getBiblicalMatrixByChapter(chapterNumber: number): Promise<SacredMatrixEntry | undefined>;
  initializeBiblicalMatrix(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser, userId?: string): Promise<User> {
    if (userId) {
      // True upsert: insert with conflict resolution
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          id: userId,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } else {
      // Insert new user without specific ID
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async initializeDemoAccounts(): Promise<void> {
    try {
      // Check if demo accounts already exist
      const existingDemo = await db.select().from(users).where(eq(users.isDemo, true)).limit(1);
      if (existingDemo.length > 0) {
        console.log("Demo accounts already exist, skipping initialization");
        return;
      }

      const demoAccounts = [
        {
          username: 'pioneer_demo',
          password: 'demo123', // In production, this would be hashed
          firstName: 'David',
          lastName: 'Pioneer',
          email: 'pioneer@demo.fractalleader.com',
          hebrewName: 'דוד',
          generation: 'millennial' as const,
          archetype: 'pioneer' as const,
          currentStage: 'r2' as const,
          subscriptionTier: 'pioneer' as const,
          authType: 'local',
          isDemo: true,
          profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        },
        {
          username: 'organizer_demo',
          password: 'demo123',
          firstName: 'Sarah',
          lastName: 'Organizer',
          email: 'organizer@demo.fractalleader.com',
          hebrewName: 'שרה',
          generation: 'gen_x' as const,
          archetype: 'organizer' as const,
          currentStage: 'r3' as const,
          subscriptionTier: 'visionary' as const,
          authType: 'local',
          isDemo: true,
          profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b130?w=150'
        },
        {
          username: 'builder_demo',
          password: 'demo123',
          firstName: 'Michael',
          lastName: 'Builder',
          email: 'builder@demo.fractalleader.com',
          hebrewName: 'מיכאל',
          generation: 'gen_z' as const,
          archetype: 'builder' as const,
          currentStage: 'r1' as const,
          subscriptionTier: 'seeker' as const,
          authType: 'local',
          isDemo: true,
          profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        },
        {
          username: 'guardian_demo',
          password: 'demo123',
          firstName: 'Ruth',
          lastName: 'Guardian',
          email: 'guardian@demo.fractalleader.com',
          hebrewName: 'רות',
          generation: 'boomer' as const,
          archetype: 'guardian' as const,
          currentStage: 'r4' as const,
          subscriptionTier: 'pioneer' as const,
          authType: 'local',
          isDemo: true,
          profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
        }
      ];

      for (const account of demoAccounts) {
        await this.createUser(account);
        console.log(`Created demo account: ${account.username} (${account.archetype})`);
      }

      console.log("Demo accounts initialized successfully");
    } catch (error) {
      console.error("Failed to initialize demo accounts:", error);
    }
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async getUserOrganization(userId: string): Promise<Organization | undefined> {
    const user = await this.getUser(userId);
    if (!user?.organizationId) return undefined;
    return this.getOrganization(user.organizationId);
  }

  // Team operations
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const userTeams = await db
      .select({ team: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));
    
    return userTeams.map(row => row.team);
  }

  async getOrganizationTeams(orgId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.organizationId, orgId));
  }

  async addTeamMember(teamId: string, userId: string, role: string = 'member'): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values({
      teamId,
      userId,
      role,
    }).returning();
    return member;
  }

  async getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]> {
    const members = await db
      .select()
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    
    return members.map(row => ({ ...row.team_members, user: row.users }));
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db.insert(assessments).values(assessment).returning();
    return newAssessment;
  }

  async getUserAssessments(userId: string): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
  }

  async getLatestAssessment(userId: string, stage: string): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.userId, userId), eq(assessments.stage, stage as any)))
      .orderBy(desc(assessments.createdAt))
      .limit(1);
    return assessment;
  }

  async completeAssessment(id: string, results: any): Promise<Assessment> {
    const [assessment] = await db
      .update(assessments)
      .set({
        results,
        completedAt: new Date(),
      })
      .where(eq(assessments.id, id))
      .returning();
    return assessment;
  }

  // Daily practice operations
  async createDailyPractice(practice: InsertDailyPractice): Promise<DailyPractice> {
    const [newPractice] = await db.insert(dailyPractices).values(practice).returning();
    return newPractice;
  }

  async getUserDailyPractices(userId: string, startDate: Date, endDate: Date): Promise<DailyPractice[]> {
    return await db
      .select()
      .from(dailyPractices)
      .where(
        and(
          eq(dailyPractices.userId, userId),
          gte(dailyPractices.date, startDate),
          gte(dailyPractices.date, endDate)
        )
      )
      .orderBy(desc(dailyPractices.date));
  }

  async completeDailyPractice(id: string, duration?: number, notes?: string): Promise<DailyPractice> {
    const [practice] = await db
      .update(dailyPractices)
      .set({
        completed: true,
        duration,
        notes,
      })
      .where(eq(dailyPractices.id, id))
      .returning();
    return practice;
  }

  // Progress metrics operations
  async getUserProgressMetrics(userId: string, metricType?: string): Promise<ProgressMetric[]> {
    const conditions = [eq(progressMetrics.userId, userId)];
    if (metricType) {
      conditions.push(eq(progressMetrics.metricType, metricType));
    }
    
    return await db
      .select()
      .from(progressMetrics)
      .where(and(...conditions))
      .orderBy(desc(progressMetrics.calculatedAt));
  }

  async getTeamProgressMetrics(teamId: string, metricType?: string): Promise<ProgressMetric[]> {
    const conditions = [eq(progressMetrics.teamId, teamId)];
    if (metricType) {
      conditions.push(eq(progressMetrics.metricType, metricType));
    }
    
    return await db
      .select()
      .from(progressMetrics)
      .where(and(...conditions))
      .orderBy(desc(progressMetrics.calculatedAt));
  }

  async calculateUserProgress(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const assessments = await this.getUserAssessments(userId);
    const practices = await this.getUserDailyPractices(
      userId, 
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
      new Date()
    );

    const completedStages = assessments
      .filter(a => a.completedAt)
      .map(a => a.stage);

    const weeklyCompletion = practices.filter(p => p.completed).length / 7;
    
    return {
      currentStage: user.currentStage,
      completedStages,
      weeklyCompletion: Math.round(weeklyCompletion * 100),
      tribalAlignment: this.calculateTribalAlignment(user, assessments),
    };
  }

  async calculateTeamEffectiveness(teamId: string): Promise<any> {
    const members = await this.getTeamMembers(teamId);
    const team = await this.getTeam(teamId);
    
    if (!team || members.length === 0) return null;

    // Calculate generational distribution
    const generationalMix = members.reduce((acc, member) => {
      const gen = member.user.generation || 'unknown';
      acc[gen] = (acc[gen] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate cross-generational effectiveness score
    const generations = Object.keys(generationalMix).length;
    const baseEffectiveness = generations > 2 ? 1.2 : 1.0; // Bonus for generational diversity

    const memberProgressPromises = members.map(member => 
      this.calculateUserProgress(member.user.id)
    );
    const memberProgress = await Promise.all(memberProgressPromises);
    
    const avgCompletion = memberProgress.reduce((sum, progress) => 
      sum + (progress?.weeklyCompletion || 0), 0) / members.length;

    return {
      teamId,
      generationalMix,
      crossGenEffectiveness: Math.round(avgCompletion * baseEffectiveness),
      memberCount: members.length,
      avgWeeklyCompletion: Math.round(avgCompletion),
    };
  }

  private calculateTribalAlignment(user: User, assessments: Assessment[]): number {
    // Simplified tribal alignment calculation based on archetype consistency
    const completedAssessments = assessments.filter(a => a.completedAt);
    if (completedAssessments.length === 0) return 0;
    
    // Mock calculation - in real implementation, this would analyze response patterns
    return Math.floor(Math.random() * 20) + 80; // 80-100% range
  }

  // Biblical Matrix operations  
  async getBiblicalMatrix(): Promise<SacredMatrixEntry[]> {
    return await db.select().from(sacredMatrix).orderBy(sacredMatrix.chapterNumber);
  }

  async getBiblicalMatrixByBook(bookNumber: number): Promise<SacredMatrixEntry[]> {
    return await db
      .select()
      .from(sacredMatrix)
      .where(eq(sacredMatrix.bookNumber, bookNumber))
      .orderBy(sacredMatrix.chapterNumber);
  }

  async getBiblicalMatrixByChapter(chapterNumber: number): Promise<SacredMatrixEntry | undefined> {
    const [entry] = await db
      .select()
      .from(sacredMatrix)
      .where(eq(sacredMatrix.chapterNumber, chapterNumber));
    return entry;
  }

  async initializeBiblicalMatrix(): Promise<void> {
    const { sacredMatrixData } = await import('./sacred-matrix-data');
    
    // Check if data already exists
    const existingData = await db.select().from(sacredMatrix);
    if (existingData.length > 0) {
      return; // Data already initialized
    }

    // Insert all biblical matrix data
    await db.insert(sacredMatrix).values(sacredMatrixData);
  }
}

export const storage = new DatabaseStorage();
