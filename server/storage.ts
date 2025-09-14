import {
  users,
  organizations,
  teams,
  teamMembers,
  assessments,
  dailyPractices,
  progressMetrics,
  sacredMatrix,
  userProgress,
  gateProgress,
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
  type UserProgress,
  type UserProgressEntry,
  type InsertUserProgress,
  type GateProgress,
  type InsertGateProgress,
  type GameProgressResponse,
} from "@shared/schema";
import { 
  chapterProgress, 
  userGeneration, 
  chapterAssessments, 
  type ChapterProgress, 
  type NewChapterProgress, 
  type UserGeneration, 
  type NewUserGeneration, 
  type ChapterAssessment, 
  type NewChapterAssessment 
} from '@shared/schema';
import { db } from "./db";
import { eq, and, desc, gte, sql, asc } from "drizzle-orm";

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
  
  // User Progress operations
  getUserProgress(userId: string): Promise<UserProgress | null>;
  updateUserProgress(userId: string, progress: Partial<UserProgress>): Promise<UserProgress>;
  completeChapter(userId: string, chapterNumber: number): Promise<UserProgress>;
  unlockDimension(userId: string, dimension: string): Promise<UserProgress>;
  masterSacredShape(userId: string, shape: string): Promise<UserProgress>;
  
  // Game progression operations
  getUserGameProgress(userId: string): Promise<GameProgressResponse>;
  updateChapterProgress(userId: string, chapterId: string): Promise<UserProgressEntry>;
  completeChapterWithXP(userId: string, chapterNumber: number): Promise<{ user: User; progress: UserProgressEntry; xpGained: number; levelUp: boolean }>;
  getAvailableChapters(userId: string): Promise<SacredMatrixEntry[]>;
  unlockNextChapter(userId: string): Promise<number[]>;
  
  // Gate progression operations
  getGateStatus(userId: string): Promise<GateProgress[]>;
  completeGate(userId: string, gateType: string, chapterNumber: number): Promise<GateProgress>;
  initializeUserGates(userId: string): Promise<void>;
  
  // XP and Level operations
  calculateLevel(experiencePoints: number): number;
  getXPForNextLevel(currentLevel: number): number;
  awardExperience(userId: string, xpAmount: number): Promise<{ user: User; levelUp: boolean }>;
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

  // User Progress operations
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const [progressEntry] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    if (!progressEntry) {
      // Create initial progress entry
      const [newProgress] = await db
        .insert(userProgress)
        .values({
          userId,
          currentBook: 1,
          completedChapters: [],
          unlockedDimensions: [],
          sacredShapesMastered: [],
          totalChaptersCompleted: 0,
        })
        .returning();

      return {
        currentBook: newProgress.currentBook as 1 | 2 | 3 | 4 | 5,
        completedChapters: newProgress.completedChapters as number[],
        archetype: user.archetype as 'pioneer' | 'organizer' | 'builder' | 'guardian',
        generation: user.generation as 'gen-z' | 'millennial' | 'gen-x' | 'boomer',
        unlockedDimensions: newProgress.unlockedDimensions as string[],
        sacredShapesMastered: newProgress.sacredShapesMastered as string[],
      };
    }

    return {
      currentBook: progressEntry.currentBook as 1 | 2 | 3 | 4 | 5,
      completedChapters: progressEntry.completedChapters as number[],
      archetype: user.archetype as 'pioneer' | 'organizer' | 'builder' | 'guardian',
      generation: user.generation as 'gen-z' | 'millennial' | 'gen-x' | 'boomer',
      unlockedDimensions: progressEntry.unlockedDimensions as string[],
      sacredShapesMastered: progressEntry.sacredShapesMastered as string[],
    };
  }

  async updateUserProgress(userId: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    const existingProgress = await this.getUserProgress(userId);
    if (!existingProgress) {
      throw new Error('User progress not found');
    }

    const updateData: Partial<InsertUserProgress> = {};
    
    if (progress.currentBook !== undefined) {
      updateData.currentBook = progress.currentBook;
    }
    if (progress.completedChapters !== undefined) {
      updateData.completedChapters = progress.completedChapters;
      updateData.totalChaptersCompleted = progress.completedChapters.length;
      updateData.lastChapterCompleted = Math.max(...progress.completedChapters);
    }
    if (progress.unlockedDimensions !== undefined) {
      updateData.unlockedDimensions = progress.unlockedDimensions;
    }
    if (progress.sacredShapesMastered !== undefined) {
      updateData.sacredShapesMastered = progress.sacredShapesMastered;
    }

    const [updatedProgress] = await db
      .update(userProgress)
      .set(updateData)
      .where(eq(userProgress.userId, userId))
      .returning();

    return await this.getUserProgress(userId) as UserProgress;
  }

  async completeChapter(userId: string, chapterNumber: number): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress(userId);
    if (!currentProgress) {
      throw new Error('User progress not found');
    }

    const completedChapters = [...currentProgress.completedChapters];
    if (!completedChapters.includes(chapterNumber)) {
      completedChapters.push(chapterNumber);
      completedChapters.sort((a, b) => a - b);
    }

    // Get the chapter's geometry icon from biblical matrix
    const chapterMatrixEntry = await this.getBiblicalMatrixByChapter(chapterNumber);
    let sacredShapesMastered = [...currentProgress.sacredShapesMastered];
    
    if (chapterMatrixEntry && chapterMatrixEntry.geometryIcon) {
      // Add the geometry icon to mastered shapes if not already present
      if (!sacredShapesMastered.includes(chapterMatrixEntry.geometryIcon)) {
        sacredShapesMastered.push(chapterMatrixEntry.geometryIcon);
      }
    }

    // Determine current book based on chapter
    let currentBook = 1;
    if (chapterNumber >= 21) currentBook = 5;
    else if (chapterNumber >= 16) currentBook = 4;
    else if (chapterNumber >= 11) currentBook = 3;
    else if (chapterNumber >= 6) currentBook = 2;

    return await this.updateUserProgress(userId, {
      currentBook: currentBook as 1 | 2 | 3 | 4 | 5,
      completedChapters,
      sacredShapesMastered,
    });
  }

  async unlockDimension(userId: string, dimension: string): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress(userId);
    if (!currentProgress) {
      throw new Error('User progress not found');
    }

    const unlockedDimensions = [...currentProgress.unlockedDimensions];
    if (!unlockedDimensions.includes(dimension)) {
      unlockedDimensions.push(dimension);
    }

    return await this.updateUserProgress(userId, {
      unlockedDimensions,
    });
  }

  async masterSacredShape(userId: string, shape: string): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress(userId);
    if (!currentProgress) {
      throw new Error('User progress not found');
    }

    const sacredShapesMastered = [...currentProgress.sacredShapesMastered];
    if (!sacredShapesMastered.includes(shape)) {
      sacredShapesMastered.push(shape);
    }

    return await this.updateUserProgress(userId, {
      sacredShapesMastered,
    });
  }

  // Generation detection and management
  async setUserGeneration(userId: string, birthYear: number): Promise<UserGeneration> {
    const generation = this.determineGeneration(birthYear);
    
    const [result] = await db.insert(userGeneration).values({
      userId,
      birthYear,
      generation,
    }).onConflictDoUpdate({
      target: userGeneration.userId,
      set: { birthYear, generation, detectedAt: new Date() }
    }).returning();
    
    return result;
  }

  async getUserGeneration(userId: string): Promise<UserGeneration | null> {
    const [result] = await db.select()
      .from(userGeneration)
      .where(eq(userGeneration.userId, userId))
      .limit(1);
    
    return result || null;
  }

  private determineGeneration(birthYear: number): string {
    if (birthYear >= 1997) return 'gen-z';
    if (birthYear >= 1981) return 'millennial';
    if (birthYear >= 1965) return 'gen-x';
    if (birthYear >= 1946) return 'boomer';
    return 'silent';
  }

  // Chapter progression management
  async getUserChapterProgress(userId: string): Promise<ChapterProgress[]> {
    return await db.select()
      .from(chapterProgress)
      .where(eq(chapterProgress.userId, userId))
      .orderBy(asc(chapterProgress.chapterNumber));
  }


  async unlockChapter(userId: string, chapterNumber: number): Promise<ChapterProgress> {
    // Check if already exists
    const [existing] = await db.select()
      .from(chapterProgress)
      .where(and(
        eq(chapterProgress.userId, userId),
        eq(chapterProgress.chapterNumber, chapterNumber)
      ))
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    // Create new progress entry
    const [result] = await db.insert(chapterProgress).values({
      userId,
      chapterNumber,
      completed: false,
    }).returning();
    
    return result;
  }

  async completeChapterProgress(
    userId: string, 
    chapterNumber: number, 
    assessmentScore: number = 0,
    practiceMinutes: number = 0
  ): Promise<ChapterProgress> {
    const [result] = await db.update(chapterProgress)
      .set({
        completed: true,
        completedAt: new Date(),
        assessmentScore,
        practiceMinutes,
        updatedAt: new Date(),
      })
      .where(and(
        eq(chapterProgress.userId, userId),
        eq(chapterProgress.chapterNumber, chapterNumber)
      ))
      .returning();
    
    if (!result) {
      // Create if doesn't exist
      const [newResult] = await db.insert(chapterProgress).values({
        userId,
        chapterNumber,
        completed: true,
        completedAt: new Date(),
        assessmentScore,
        practiceMinutes,
      }).returning();
      return newResult;
    }
    
    return result;
  }

  // Chapter assessments
  async createChapterAssessment(
    userId: string,
    chapterNumber: number,
    responses: any,
    score: number,
    passed: boolean
  ): Promise<ChapterAssessment> {
    const [result] = await db.insert(chapterAssessments).values({
      userId,
      chapterNumber,
      responses,
      score,
      passed,
    }).returning();
    
    return result;
  }

  async getChapterAssessments(userId: string, chapterNumber?: number): Promise<ChapterAssessment[]> {
    const conditions = [eq(chapterAssessments.userId, userId)];
    
    if (chapterNumber) {
      conditions.push(eq(chapterAssessments.chapterNumber, chapterNumber));
    }
    
    return await db.select()
      .from(chapterAssessments)
      .where(and(...conditions))
      .orderBy(desc(chapterAssessments.completedAt));
  }

  // Book progression helpers
  async getUserBookProgress(userId: string): Promise<{
    book1: { completed: number; total: number; unlocked: boolean };
    book2: { completed: number; total: number; unlocked: boolean };
    book3: { completed: number; total: number; unlocked: boolean };
    book4: { completed: number; total: number; unlocked: boolean };
    book5: { completed: number; total: number; unlocked: boolean };
  }> {
    const progress = await this.getUserChapterProgress(userId);
    const completed = progress.filter(p => p.completed).map(p => p.chapterNumber);
    
    const book1Completed = completed.filter(c => c >= 1 && c <= 5).length;
    const book2Completed = completed.filter(c => c >= 6 && c <= 10).length;
    const book3Completed = completed.filter(c => c >= 11 && c <= 15).length;
    const book4Completed = completed.filter(c => c >= 16 && c <= 20).length;
    const book5Completed = completed.filter(c => c >= 21 && c <= 27).length;
    
    return {
      book1: { completed: book1Completed, total: 5, unlocked: true },
      book2: { completed: book2Completed, total: 5, unlocked: book1Completed >= 5 },
      book3: { completed: book3Completed, total: 5, unlocked: book2Completed >= 5 },
      book4: { completed: book4Completed, total: 5, unlocked: book3Completed >= 5 },
      book5: { completed: book5Completed, total: 7, unlocked: book4Completed >= 5 },
    };
  }

  // Game progression operations
  async getUserGameProgress(userId: string): Promise<GameProgressResponse> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    // Get the actual database entry instead of the interface
    const [progressEntry] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const gates = await this.getGateStatus(userId);
    const availableChapters = await this.getAvailableChapters(userId);

    // Find next milestone
    const completedChapters = progressEntry?.completedChapters as number[] || [];
    const nextMilestone = this.findNextMilestone(completedChapters);

    return {
      user: {
        id: user.id,
        experiencePoints: user.experiencePoints || 0,
        level: user.level || 1,
        currentChapterId: user.currentChapterId || progressEntry?.currentChapterId || undefined,
      },
      progress: {
        currentBook: progressEntry?.currentBook || 1,
        currentChapterId: progressEntry?.currentChapterId || undefined,
        completedChapters,
        unlockedChapters: progressEntry?.unlockedChapters as number[] || [1],
        totalChaptersCompleted: progressEntry?.totalChaptersCompleted || 0,
      },
      gates,
      availableChapters,
      nextMilestone,
    };
  }

  async updateChapterProgress(userId: string, chapterId: string): Promise<UserProgressEntry> {
    const [result] = await db
      .update(userProgress)
      .set({
        currentChapterId: chapterId,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.userId, userId))
      .returning();

    if (!result) {
      // Create if doesn't exist
      const [newResult] = await db.insert(userProgress).values({
        userId,
        currentChapterId: chapterId,
        currentBook: 1,
        completedChapters: [],
        unlockedChapters: [1],
        unlockedDimensions: [],
        sacredShapesMastered: [],
        totalChaptersCompleted: 0,
      }).returning();
      return newResult;
    }

    return result;
  }

  async completeChapterWithXP(
    userId: string, 
    chapterNumber: number
  ): Promise<{ user: User; progress: UserProgressEntry; xpGained: number; levelUp: boolean }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const currentLevel = user.level || 1;
    const xpGained = 50; // Standard XP per chapter
    const newXP = (user.experiencePoints || 0) + xpGained;
    const newLevel = this.calculateLevel(newXP);
    const levelUp = newLevel > currentLevel;

    // Update user XP and level
    const [updatedUser] = await db
      .update(users)
      .set({
        experiencePoints: newXP,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Update progress by calling the existing complete chapter logic
    const progressResult = await this.completeChapter(userId, chapterNumber);
    
    // Get the actual UserProgressEntry from database 
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    return {
      user: updatedUser,
      progress: progress,
      xpGained,
      levelUp,
    };
  }

  async getAvailableChapters(userId: string): Promise<SacredMatrixEntry[]> {
    const [progressEntry] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    const unlockedChapters = progressEntry?.unlockedChapters as number[] || [1];

    return await db
      .select()
      .from(sacredMatrix)
      .where(sql`${sacredMatrix.chapterNumber} = ANY(${unlockedChapters})`)
      .orderBy(asc(sacredMatrix.chapterNumber));
  }

  async unlockNextChapter(userId: string): Promise<number[]> {
    const [progressEntry] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    const completedChapters = progressEntry?.completedChapters as number[] || [];
    const unlockedChapters = progressEntry?.unlockedChapters as number[] || [1];

    // Golden Path logic: sequential unlocking
    const nextChapter = Math.max(...completedChapters) + 1;
    
    if (nextChapter <= 27 && !unlockedChapters.includes(nextChapter)) {
      const newUnlockedChapters = [...unlockedChapters, nextChapter];
      
      await db
        .update(userProgress)
        .set({
          unlockedChapters: newUnlockedChapters,
          updatedAt: new Date(),
        })
        .where(eq(userProgress.userId, userId));

      return newUnlockedChapters;
    }

    return unlockedChapters;
  }

  // Gate progression operations
  async getGateStatus(userId: string): Promise<GateProgress[]> {
    return await db
      .select()
      .from(gateProgress)
      .where(eq(gateProgress.userId, userId))
      .orderBy(asc(gateProgress.chapterNumber));
  }

  async completeGate(userId: string, gateType: string, chapterNumber: number): Promise<GateProgress> {
    const [result] = await db
      .update(gateProgress)
      .set({
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(gateProgress.userId, userId),
        eq(gateProgress.gateType, gateType as any),
        eq(gateProgress.chapterNumber, chapterNumber)
      ))
      .returning();

    if (!result) {
      const [newResult] = await db.insert(gateProgress).values({
        userId,
        gateType: gateType as any,
        chapterNumber,
        unlocked: true,
        completed: true,
        completedAt: new Date(),
        experienceGained: 100,
      }).returning();
      
      // Award bonus XP for gate completion
      await this.awardExperience(userId, 100);
      
      return newResult;
    }

    // Award bonus XP for gate completion
    await this.awardExperience(userId, 100);

    return result;
  }

  async initializeUserGates(userId: string): Promise<void> {
    const gateChapters = [
      { gateType: 'identity_mirror', chapterNumber: 1 },
      { gateType: 'shofar_convergence', chapterNumber: 25 },
      { gateType: 'network_multiplication', chapterNumber: 26 },
      { gateType: 'twelve_gate_convergence', chapterNumber: 27 },
    ];

    for (const gate of gateChapters) {
      const existing = await db
        .select()
        .from(gateProgress)
        .where(and(
          eq(gateProgress.userId, userId),
          eq(gateProgress.gateType, gate.gateType as any),
          eq(gateProgress.chapterNumber, gate.chapterNumber)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(gateProgress).values({
          userId,
          gateType: gate.gateType as any,
          chapterNumber: gate.chapterNumber,
          unlocked: gate.chapterNumber === 1, // Only chapter 1 starts unlocked
          completed: false,
          experienceGained: 100,
        });
      }
    }
  }

  // XP and Level operations
  calculateLevel(experiencePoints: number): number {
    return 1 + Math.floor(experiencePoints / 100);
  }

  getXPForNextLevel(currentLevel: number): number {
    return currentLevel * 100;
  }

  async awardExperience(userId: string, xpAmount: number): Promise<{ user: User; levelUp: boolean }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const currentLevel = user.level || 1;
    const newXP = (user.experiencePoints || 0) + xpAmount;
    const newLevel = this.calculateLevel(newXP);
    const levelUp = newLevel > currentLevel;

    const [updatedUser] = await db
      .update(users)
      .set({
        experiencePoints: newXP,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return { user: updatedUser, levelUp };
  }

  // Helper method for finding next milestone
  private findNextMilestone(completedChapters: number[]): { chapterNumber: number; isGate: boolean; title: string } | undefined {
    const milestones = [5, 10, 15, 20, 25, 26, 27];
    const gates = [1, 25, 26, 27];
    
    for (const milestone of milestones) {
      if (!completedChapters.includes(milestone)) {
        return {
          chapterNumber: milestone,
          isGate: gates.includes(milestone),
          title: gates.includes(milestone) ? `Gate ${milestone}` : `Chapter ${milestone} Milestone`,
        };
      }
    }
    
    return undefined;
  }
}

export const storage = new DatabaseStorage();
