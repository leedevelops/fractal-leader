import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAssessmentSchema, insertDailyPracticeSchema, insertTeamSchema, insertOrganizationSchema, createSubscriptionSchema, cancelSubscriptionSchema, updateTierSchema, webhookEventSchema } from "@shared/schema";
import { provideBiblicalGuidance, generateReflectionQuestions } from "./claude";
import { uploadProjectToGitHub } from "./github-upload";
import { z } from "zod";

// Generation determination function - returns hyphenated format to match frontend
function determineGeneration(birthYear: number, culturalMarkers?: string[], workStyle?: string): string {
  if (birthYear >= 1997) return 'gen-z';
  if (birthYear >= 1981) return 'millennial';
  if (birthYear >= 1965) return 'gen-x';
  if (birthYear >= 1946) return 'boomer';
  return 'silent';
}

// Helper function for calculating archetype from responses
function calculateArchetypeFromResponses(responses: Record<string, string>): string {
  const scores = {
    pioneer: 0,
    organizer: 0,
    builder: 0,
    guardian: 0,
  };
  
  Object.values(responses).forEach(response => {
    switch (response) {
      case 'vision':
      case 'pioneering':
      case 'innovation':
        scores.pioneer++;
        break;
      case 'relationships':
      case 'collaboration':
      case 'collaborative_agreements':
        scores.organizer++;
        break;
      case 'analysis':
      case 'building':
      case 'execution':
        scores.builder++;
        break;
      case 'clear_expectations':
      case 'flexible_guidelines':
        scores.guardian++;
        break;
    }
  });
  
  return Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
  )[0];
}

// Calculate archetype results from assessment responses
function calculateArchetypeResults(responses: any[]) {
  const scores = {
    pioneer: 0,
    organizer: 0,
    builder: 0,
    guardian: 0
  };

  // Score each response based on archetype alignment
  responses.forEach((response, index) => {
    switch(index) {
      case 0: // Leadership approach
        if (response.includes('vision') || response.includes('innovative')) scores.pioneer += 3;
        if (response.includes('organize') || response.includes('structure')) scores.organizer += 3;
        if (response.includes('build') || response.includes('develop')) scores.builder += 3;
        if (response.includes('protect') || response.includes('maintain')) scores.guardian += 3;
        break;
      case 1: // Decision making
        if (response.includes('quick') || response.includes('instinct')) scores.pioneer += 2;
        if (response.includes('analyze') || response.includes('process')) scores.organizer += 2;
        if (response.includes('consensus') || response.includes('team')) scores.builder += 2;
        if (response.includes('careful') || response.includes('thorough')) scores.guardian += 2;
        break;
      case 2: // Conflict resolution
        if (response.includes('direct') || response.includes('confront')) scores.pioneer += 2;
        if (response.includes('systematic') || response.includes('procedure')) scores.organizer += 2;
        if (response.includes('mediate') || response.includes('bridge')) scores.builder += 2;
        if (response.includes('preserve') || response.includes('stability')) scores.guardian += 2;
        break;
      case 3: // Team motivation
        if (response.includes('inspire') || response.includes('challenge')) scores.pioneer += 3;
        if (response.includes('clear goals') || response.includes('metrics')) scores.organizer += 3;
        if (response.includes('support') || response.includes('develop')) scores.builder += 3;
        if (response.includes('values') || response.includes('tradition')) scores.guardian += 3;
        break;
    }
  });

  // Determine primary archetype
  const primaryArchetype = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
  )[0];

  return {
    archetype: primaryArchetype,
    scores,
    responses
  };
}

// Assessment tools function
async function getAssessmentTools(generation: string, archetype: string) {
  const tools = {
    generation,
    archetype,
    recommendedPractices: [] as any[],
    frequencySettings: {} as any,
    matrixConfiguration: {} as any,
    teamFormationTips: [] as string[],
    developmentPath: {} as any
  };

  // Generation-specific recommendations
  switch (generation) {
    case 'gen-z':
      tools.recommendedPractices = [
        { name: 'Daily Micro-Meditation', duration: '5-10 minutes', frequency: '396Hz' },
        { name: 'Social Leadership Challenge', format: 'gamified', peer: true },
        { name: 'Instant Reflection', type: 'quick-quiz', immediate: true }
      ];
      tools.frequencySettings = { primary: '396Hz', secondary: '528Hz', tertiary: '852Hz' };
      break;
      
    case 'millennial':
      tools.recommendedPractices = [
        { name: 'Collaborative Prayer Session', duration: '15-20 minutes', group: true },
        { name: 'Weekly Leadership Sync', format: 'peer-driven', frequency: 'weekly' },
        { name: 'Video Testimony Practice', type: 'sharing', social: true }
      ];
      tools.frequencySettings = { primary: '528Hz', secondary: '741Hz', tertiary: '963Hz' };
      break;
      
    case 'gen-x':
      tools.recommendedPractices = [
        { name: 'Practical Scripture Study', duration: '20-30 minutes', tools: 'study-guides' },
        { name: 'Milestone-Based Assessment', format: 'structured', quarterly: true },
        { name: 'Email Devotional Series', type: 'written', professional: true }
      ];
      tools.frequencySettings = { primary: '741Hz', secondary: '528Hz', tertiary: '396Hz' };
      break;
      
    case 'boomer':
      tools.recommendedPractices = [
        { name: 'Deep Contemplative Prayer', duration: '30-45 minutes', traditional: true },
        { name: 'Comprehensive Life Review', format: 'thorough', comprehensive: true },
        { name: 'Mentorship Preparation', type: 'wisdom-sharing', legacy: true }
      ];
      tools.frequencySettings = { primary: '963Hz', secondary: '852Hz', tertiary: '741Hz' };
      break;
  }

  // Archetype-specific recommendations
  switch (archetype) {
    case 'pioneer':
      tools.teamFormationTips = [
        'Lead with vision and inspiration',
        'Create space for innovation and risk-taking',
        'Balance boldness with wisdom from Scripture'
      ];
      tools.developmentPath = {
        stage1: 'Vision Clarity',
        stage2: 'Risk Assessment',
        stage3: 'Team Inspiration',
        stage4: 'Kingdom Innovation',
        stage5: 'Legacy Building'
      };
      break;
      
    case 'organizer':
      tools.teamFormationTips = [
        'Structure teams for maximum efficiency',
        'Implement clear processes and accountability',
        'Balance order with grace and flexibility'
      ];
      tools.developmentPath = {
        stage1: 'System Design',
        stage2: 'Process Optimization',
        stage3: 'Team Coordination',
        stage4: 'Strategic Execution',
        stage5: 'Organizational Legacy'
      };
      break;
      
    case 'builder':
      tools.teamFormationTips = [
        'Focus on sustainable growth and development',
        'Create lasting foundations for ministry',
        'Invest in long-term discipleship relationships'
      ];
      tools.developmentPath = {
        stage1: 'Foundation Setting',
        stage2: 'Skill Development',
        stage3: 'Team Building',
        stage4: 'Ministry Expansion',
        stage5: 'Generational Impact'
      };
      break;
      
    case 'guardian':
      tools.teamFormationTips = [
        'Protect and preserve team unity',
        'Maintain doctrinal integrity and values',
        'Provide stability during challenging seasons'
      ];
      tools.developmentPath = {
        stage1: 'Value Establishment',
        stage2: 'Protective Systems',
        stage3: 'Team Stability',
        stage4: 'Crisis Leadership',
        stage5: 'Wisdom Transfer'
      };
      break;
  }

  // Matrix configuration based on generation + archetype
  tools.matrixConfiguration = {
    complexity: generation === 'boomer' || generation === 'gen-x' ? 'detailed' : 'simplified',
    visualization: generation === 'gen-z' || generation === 'millennial' ? 'interactive' : 'static',
    progression: archetype === 'pioneer' ? 'breakthrough' : archetype === 'organizer' ? 'systematic' : 
                archetype === 'builder' ? 'foundational' : 'protective',
    timeframe: generation === 'gen-z' ? 'immediate' : generation === 'millennial' ? 'weekly' :
               generation === 'gen-x' ? 'monthly' : 'seasonal'
  };

  return tools;
}

// Generational tools function for biblical mapping
function getGenerationalTools(generation: string, archetype: string) {
  const toolsMatrix = {
    books: [] as string[],
    chapter: 1,
    tools: [] as any[]
  };

  // Archetype-specific biblical book mapping
  const archetypeBooks = {
    pioneer: ['Genesis', 'Joshua', 'Acts', 'Hebrews'],
    organizer: ['Leviticus', 'Nehemiah', '1 Corinthians', 'Ephesians'], 
    builder: ['Exodus', 'Ezra', '2 Corinthians', 'Colossians'],
    guardian: ['Deuteronomy', 'Psalms', '1 Timothy', '1 Peter']
  };

  // Generation-specific starting chapters and approaches
  const generationSettings = {
    'gen-z': { startChapter: 1, approach: 'micro-learning' },
    'millennial': { startChapter: 3, approach: 'collaborative' },
    'gen-x': { startChapter: 5, approach: 'practical' },
    'boomer': { startChapter: 1, approach: 'comprehensive' },
    'silent': { startChapter: 1, approach: 'traditional' }
  };

  // Set books and chapter based on archetype and generation
  toolsMatrix.books = archetypeBooks[archetype as keyof typeof archetypeBooks] || archetypeBooks.pioneer;
  toolsMatrix.chapter = generationSettings[generation as keyof typeof generationSettings]?.startChapter || 1;

  // Generation-specific tools
  switch (generation) {
    case 'gen-z':
      toolsMatrix.tools = [
        { name: 'Biblical Micro-Learning', duration: '5-10 min', format: 'bite-sized' },
        { name: 'Gamified Scripture Study', type: 'interactive', frequency: 'daily' },
        { name: 'Social Leadership Challenge', format: 'peer-competition', sharing: true }
      ];
      break;
      
    case 'millennial':
      toolsMatrix.tools = [
        { name: 'Group Bible Study', duration: '30-45 min', format: 'collaborative' },
        { name: 'Video Devotional Series', type: 'multimedia', frequency: 'weekly' },
        { name: 'Peer Leadership Circles', format: 'discussion-based', community: true }
      ];
      break;
      
    case 'gen-x':
      toolsMatrix.tools = [
        { name: 'Practical Leadership Study', duration: '20-30 min', format: 'application-focused' },
        { name: 'Email Devotional Series', type: 'written', frequency: 'daily' },
        { name: 'Milestone-Based Assessment', format: 'structured', quarterly: true }
      ];
      break;
      
    case 'boomer':
      toolsMatrix.tools = [
        { name: 'Deep Scriptural Meditation', duration: '45-60 min', format: 'contemplative' },
        { name: 'Comprehensive Biblical Commentary', type: 'thorough', depth: 'scholarly' },
        { name: 'Mentorship Preparation Guide', format: 'wisdom-sharing', legacy: true }
      ];
      break;
      
    case 'silent':
      toolsMatrix.tools = [
        { name: 'Traditional Bible Reading', duration: '60+ min', format: 'sequential' },
        { name: 'Prayer and Reflection Journal', type: 'written', personal: true },
        { name: 'Wisdom Literature Study', format: 'traditional', depth: 'foundational' }
      ];
      break;
  }

  // Archetype-specific tool additions
  switch (archetype) {
    case 'pioneer':
      toolsMatrix.tools.push(
        { name: 'Prophetic Vision Exercises', type: 'spiritual', focus: 'breakthrough' },
        { name: 'Risk Assessment Framework', type: 'practical', decision: 'faith-based' }
      );
      break;
      
    case 'organizer':
      toolsMatrix.tools.push(
        { name: 'Team Unity Building', type: 'relational', focus: 'harmony' },
        { name: 'Communication Templates', type: 'practical', efficiency: 'high' }
      );
      break;
      
    case 'builder':
      toolsMatrix.tools.push(
        { name: 'Project Planning Templates', type: 'systematic', focus: 'execution' },
        { name: 'Ministry Development Guide', type: 'strategic', growth: 'sustainable' }
      );
      break;
      
    case 'guardian':
      toolsMatrix.tools.push(
        { name: 'Value Protection Strategies', type: 'defensive', focus: 'preservation' },
        { name: 'Shepherding Techniques', type: 'nurturing', care: 'pastoral' }
      );
      break;
  }

  return toolsMatrix;
}

// Enhanced Stripe configuration for biblical leadership tiers
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

// Webhook event idempotency storage (in-memory for now)
const processedEvents = new Set<string>();
const eventExpiryTime = 24 * 60 * 60 * 1000; // 24 hours
const processedEventTimestamps = new Map<string, number>();

// Security logging function
function logSecurityEvent(event: string, details: any, isSuccess = true) {
  const timestamp = new Date().toISOString();
  const logLevel = isSuccess ? 'INFO' : 'WARN';
  console.log(`[${logLevel}] [${timestamp}] STRIPE_SECURITY: ${event}`, JSON.stringify(details, null, 2));
}

// Biblical Leadership Subscription Tiers with Stripe Price IDs
const SUBSCRIPTION_TIERS = {
  seeker: {
    name: "Seeker",
    price: 0,
    interval: "month",
    priceId: process.env.STRIPE_SEEKER_PRICE_ID || null, // Free tier, no Stripe needed
    features: [
      "Access to first 5 biblical chapters",
      "Basic archetype assessment",
      "Community access"
    ]
  },
  pioneer: {
    name: "Pioneer", 
    price: 4500, // $45.00 in cents
    interval: "month",
    priceId: process.env.STRIPE_PIONEER_PRICE_ID || "price_pioneer_default",
    features: [
      "Full 27-chapter biblical framework access",
      "AI biblical coaching with Claude",
      "Advanced progress tracking",
      "Team formation tools",
      "Frequency meditation guides"
    ]
  },
  visionary: {
    name: "Visionary",
    price: 9900, // $99.00 in cents  
    interval: "month",
    priceId: process.env.STRIPE_VISIONARY_PRICE_ID || "price_visionary_default",
    features: [
      "Everything in Pioneer tier",
      "Advanced analytics and insights",
      "Multi-generational team optimization",
      "Custom organizational assessments",
      "Priority coaching and support",
      "Early access to new features"
    ]
  }
} as const;

// Helper function to validate subscription tier
function validateSubscriptionTier(tier: string): tier is keyof typeof SUBSCRIPTION_TIERS {
  return tier in SUBSCRIPTION_TIERS;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize biblical matrix data and demo accounts
  try {
    await storage.initializeBiblicalMatrix();
    console.log("Biblical matrix initialized successfully");
    
    await storage.initializeDemoAccounts();
    console.log("Demo accounts initialized successfully");
  } catch (error) {
    console.error("Failed to initialize data:", error);
  }

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId;
      
      // Check for session-based auth (demo accounts)
      if ((req.session as any)?.userId) {
        userId = (req.session as any).userId;
      } 
      // Check for Replit Auth
      else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Include additional user data
      const progress = await storage.calculateUserProgress(userId);
      const organization = await storage.getUserOrganization(userId);
      const teams = await storage.getUserTeams(userId);

      res.json({
        ...user,
        progress,
        organization,
        teams,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Demo account login
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || !user.isDemo) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user ID in session
      (req.session as any).userId = user.id;
      (req.session as any).authType = 'demo';
      
      res.json({ message: "Login successful", user: { id: user.id, username: user.username, firstName: user.firstName } });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Demo account logout
  app.post('/api/auth/demo-logout', async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Demo logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Organization routes
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgData = insertOrganizationSchema.parse(req.body);
      
      const organization = await storage.createOrganization(orgData);
      
      // Update user's organization
      await storage.upsertUser({
        organizationId: organization.id,
      }, userId);

      res.json(organization);
    } catch (error: any) {
      console.error("Error creating organization:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Team routes
  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teamData = insertTeamSchema.parse({
        ...req.body,
        leaderId: userId,
      });
      
      const team = await storage.createTeam(teamData);
      await storage.addTeamMember(team.id, userId, 'leader');

      res.json(team);
    } catch (error: any) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const members = await storage.getTeamMembers(team.id);
      const effectiveness = await storage.calculateTeamEffectiveness(team.id);

      res.json({
        ...team,
        members,
        effectiveness,
      });
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post('/api/teams/:id/members', isAuthenticated, async (req, res) => {
    try {
      const { userId, role = 'member' } = req.body;
      const member = await storage.addTeamMember(req.params.id, userId, role);
      res.json(member);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  // Assessment routes
  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        userId,
      });
      
      const assessment = await storage.createAssessment(assessmentData);
      res.json(assessment);
    } catch (error: any) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/assessments/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const { results } = req.body;
      const assessment = await storage.completeAssessment(req.params.id, results);
      
      // Update user's current stage if this was a progression assessment
      if (assessment.stage && assessment.results) {
        const userId = assessment.userId;
        await storage.upsertUser({
          currentStage: assessment.stage,
        }, userId);
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error completing assessment:", error);
      res.status(500).json({ message: "Failed to complete assessment" });
    }
  });

  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessments = await storage.getUserAssessments(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  // Daily practice routes
  app.post('/api/practices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const practiceData = insertDailyPracticeSchema.parse({
        ...req.body,
        userId,
      });
      
      const practice = await storage.createDailyPractice(practiceData);
      res.json(practice);
    } catch (error: any) {
      console.error("Error creating practice:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/practices/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const { duration, notes } = req.body;
      const practice = await storage.completeDailyPractice(req.params.id, duration, notes);
      res.json(practice);
    } catch (error) {
      console.error("Error completing practice:", error);
      res.status(500).json({ message: "Failed to complete practice" });
    }
  });

  app.get('/api/practices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const practices = await storage.getUserDailyPractices(userId, start, end);
      res.json(practices);
    } catch (error) {
      console.error("Error fetching practices:", error);
      res.status(500).json({ message: "Failed to fetch practices" });
    }
  });

  // Progress metrics routes
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.calculateUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error calculating progress:", error);
      res.status(500).json({ message: "Failed to calculate progress" });
    }
  });

  // User progress route - used by home page and matrix page
  app.get('/api/user-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userProgress = await storage.getUserProgress(userId);
      if (!userProgress) {
        return res.status(404).json({ message: "User progress not found" });
      }

      res.json(userProgress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get('/api/teams/:id/effectiveness', isAuthenticated, async (req, res) => {
    try {
      const effectiveness = await storage.calculateTeamEffectiveness(req.params.id);
      res.json(effectiveness);
    } catch (error) {
      console.error("Error calculating team effectiveness:", error);
      res.status(500).json({ message: "Failed to calculate team effectiveness" });
    }
  });

  // Gate completion routes for biblical leadership milestones
  app.post('/api/gates/:gateType/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub || (req.session as any)?.userId;
      const { gateType } = req.params;
      const { responses, reflections } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Validate gate type
      const validGateTypes = ['identity_mirror', 'shofar_convergence', 'network_multiplication', 'twelve_gate_convergence'];
      if (!validGateTypes.includes(gateType)) {
        return res.status(400).json({ message: "Invalid gate type" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate XP reward based on gate type
      const gateRewards = {
        'identity_mirror': { xp: 100, chapter: 2 },
        'shofar_convergence': { xp: 100, chapter: 26 },
        'network_multiplication': { xp: 100, chapter: 27 }, 
        'twelve_gate_convergence': { xp: 150, chapter: null } // Final gate
      };

      const reward = gateRewards[gateType as keyof typeof gateRewards];
      const newXP = (user.experiencePoints || 0) + reward.xp;
      const newLevel = Math.floor(newXP / 100) + 1;

      // Update user progress and XP
      await storage.upsertUser({
        experiencePoints: newXP,
        level: newLevel,
        currentChapterId: reward.chapter ? `chapter-${reward.chapter}` : user.currentChapterId
      }, userId);

      // Mark gate completion in daily practices instead
      // Progress will be tracked through practice records

      // Create a practice record for the gate challenge
      await storage.createDailyPractice({
        userId,
        date: new Date(),
        practiceType: `gate_challenge_${gateType}`,
        completed: true,
        duration: 30, // Estimated 30 minutes for gate challenge
        notes: reflections ? JSON.stringify(reflections) : null,
        generationAdaptation: null
      });

      res.json({
        success: true,
        gateType,
        xpEarned: reward.xp,
        totalXP: newXP,
        newLevel,
        unlockedChapter: reward.chapter,
        completedAt: new Date().toISOString(),
        message: getGateCompletionMessage(gateType)
      });

    } catch (error) {
      console.error("Error completing gate:", error);
      res.status(500).json({ message: "Failed to complete gate challenge" });
    }
  });

  // Get gate progress and status
  app.get('/api/gates/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub || (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get completed gates from progress metrics
      const gateTypes = ['identity_mirror', 'shofar_convergence', 'network_multiplication', 'twelve_gate_convergence'];
      const completedGates = [];

      for (const gateType of gateTypes) {
        const practices = await storage.getUserDailyPractices(
          userId,
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
          new Date()
        );
        const gateCompleted = practices.some(p => 
          p.practiceType === `gate_challenge_${gateType}` && p.completed
        );
        if (gateCompleted) {
          completedGates.push(gateType);
        }
      }

      // Determine available gates based on current progress
      const currentChapter = user.currentChapterId ? parseInt(user.currentChapterId.replace('chapter-', '')) : 1;
      const availableGates = [];

      if (currentChapter >= 1) availableGates.push('identity_mirror');
      if (currentChapter >= 25) availableGates.push('shofar_convergence');
      if (currentChapter >= 26) availableGates.push('network_multiplication');
      if (currentChapter >= 27) availableGates.push('twelve_gate_convergence');

      res.json({
        completedGates,
        availableGates,
        currentLevel: user.level || 1,
        totalXP: user.experiencePoints || 0
      });

    } catch (error) {
      console.error("Error fetching gate progress:", error);
      res.status(500).json({ message: "Failed to fetch gate progress" });
    }
  });

  // Helper function for gate completion messages
  function getGateCompletionMessage(gateType: string): string {
    const messages = {
      'identity_mirror': "Congratulations! You have discovered your identity at the Altar. The foundation of biblical leadership begins with knowing who you are in Christ.",
      'shofar_convergence': "Well done! You understand the commissioning pattern. Like the disciples, you are now prepared to be sent with divine authority.",
      'network_multiplication': "Excellent! You grasp the power of apostolic multiplication. Your network will now expand the Kingdom through intentional relationships.",
      'twelve_gate_convergence': "Outstanding! You have completed the full biblical leadership pattern. You are now equipped to lead with the wisdom of all 12 gates of the city."
    };
    return messages[gateType as keyof typeof messages] || "Gate completed successfully!";
  }

  // Enhanced Stripe subscription routes for biblical leadership platform
  
  // Get available subscription tiers
  app.get('/api/subscription/tiers', async (req, res) => {
    try {
      const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
        id: key,
        name: tier.name,
        price: tier.price,
        interval: tier.interval,
        features: tier.features,
        isActive: key === 'seeker' || !!tier.priceId
      }));
      
      res.json(tiers);
    } catch (error: any) {
      console.error("Error fetching subscription tiers:", error);
      res.status(500).json({ error: { message: "Failed to fetch subscription tiers" } });
    }
  });

  // Create subscription for specific tier
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        error: { message: "Payment processing not configured. Please contact support." }
      });
    }

    let tier: string | undefined;
    let userId: string | undefined;
    
    try {
      // Validate request body with Zod schema for security
      const validatedData = createSubscriptionSchema.parse(req.body);
      tier = validatedData.tier;
      userId = req.user?.claims?.sub || (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: { message: "User not authenticated" } });
      }

      if (!tier || !validateSubscriptionTier(tier)) {
        return res.status(400).json({ 
          error: { message: "Invalid subscription tier. Must be one of: seeker, pioneer, visionary" }
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: { message: "User not found" } });
      }

      const selectedTier = SUBSCRIPTION_TIERS[tier];

      // Handle free tier (Seeker)
      if (tier === 'seeker') {
        await storage.upsertUser({
          subscriptionTier: 'seeker',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        }, userId);

        return res.json({
          success: true,
          tier: 'seeker',
          message: "Successfully subscribed to Seeker tier",
          requiresPayment: false
        });
      }

      if (!selectedTier.priceId) {
        return res.status(400).json({
          error: { message: `${selectedTier.name} tier is not configured for payment processing` }
        });
      }

      if (!user.email) {
        return res.status(400).json({ 
          error: { message: "User email is required for paid subscriptions" }
        });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        try {
          const existingSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
            return res.status(400).json({
              error: { message: "User already has an active subscription. Please cancel current subscription first." }
            });
          }
        } catch (error) {
          console.log("Existing subscription not found, proceeding with new subscription");
        }
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: {
            userId: userId,
            archetype: user.archetype || 'unknown',
            generation: user.generation || 'unknown'
          }
        });
        customerId = customer.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: selectedTier.priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          tier: tier,
          archetype: user.archetype || 'unknown',
          generation: user.generation || 'unknown'
        }
      });

      // Update user with Stripe information
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
      
      const latestInvoice = subscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret || null;

      res.json({
        success: true,
        subscriptionId: subscription.id,
        clientSecret,
        tier: tier,
        requiresPayment: true,
        message: `Successfully created ${selectedTier.name} subscription`
      });

    } catch (error: any) {
      logSecurityEvent('SUBSCRIPTION_CREATION_FAILED', {
        userId: userId || req.user?.claims?.sub || (req.session as any)?.userId,
        tier: tier || 'unknown',
        error: error.message,
        stripeError: error.type || 'unknown'
      }, false);
      
      // Determine appropriate error message based on error type
      let errorMessage = "Failed to create subscription. Please try again.";
      if (error.type === 'StripeCardError') {
        errorMessage = "Your card was declined. Please check your payment information.";
      } else if (error.type === 'StripeInvalidRequestError') {
        errorMessage = "Invalid request. Please contact support.";
      } else if (error.message?.includes('price')) {
        errorMessage = "Subscription tier is currently unavailable. Please contact support.";
      }
      
      res.status(400).json({ 
        error: { 
          message: errorMessage,
          type: 'payment_error'
        }
      });
    }
  });

  // Get current subscription status
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: { message: "User not authenticated" } });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: { message: "User not found" } });
      }

      // Default response for free tier
      const response: any = {
        currentTier: user.subscriptionTier || 'seeker',
        tierInfo: SUBSCRIPTION_TIERS[user.subscriptionTier || 'seeker'],
        isActive: true,
        isPaid: false
      };

      // If user has Stripe subscription, get detailed status
      if (user.stripeSubscriptionId && stripe) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          response.stripeStatus = subscription.status;
          response.isActive = ['active', 'trialing'].includes(subscription.status);
          response.isPaid = subscription.status === 'active';
          response.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
          response.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          
          if (subscription.latest_invoice) {
            const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
            response.nextPaymentAmount = invoice.amount_due;
            response.nextPaymentDate = new Date(invoice.due_date ? invoice.due_date * 1000 : (subscription as any).current_period_end * 1000);
          }
        } catch (error) {
          console.error("Error fetching subscription status:", error);
          // If Stripe subscription doesn't exist, update user to free tier
          await storage.upsertUser({
            subscriptionTier: 'seeker',
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          }, userId);
          response.currentTier = 'seeker';
          response.tierInfo = SUBSCRIPTION_TIERS.seeker;
        }
      }

      res.json(response);

    } catch (error: any) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ 
        error: { message: "Failed to fetch subscription status" }
      });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        error: { message: "Payment processing not configured. Please contact support." }
      });
    }

    let userId: string | undefined;
    let user: any;
    
    try {
      // Validate request body with Zod schema for security
      const validatedData = cancelSubscriptionSchema.parse(req.body);
      userId = req.user?.claims?.sub || (req.session as any)?.userId;
      const { cancelAtPeriodEnd } = validatedData;
      
      if (!userId) {
        return res.status(401).json({ error: { message: "User not authenticated" } });
      }

      user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: { message: "User not found" } });
      }

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ 
          error: { message: "No active subscription to cancel" }
        });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
        metadata: {
          ...((await stripe.subscriptions.retrieve(user.stripeSubscriptionId)).metadata),
          cancellation_requested: new Date().toISOString(),
          cancelled_by_user: 'true'
        }
      });

      // If immediate cancellation, update user to free tier
      if (!cancelAtPeriodEnd) {
        await storage.upsertUser({
          subscriptionTier: 'seeker',
          stripeSubscriptionId: null,
        }, userId);
      }

      res.json({
        success: true,
        message: cancelAtPeriodEnd 
          ? "Subscription will be cancelled at the end of the current billing period"
          : "Subscription cancelled immediately",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
        }
      });

    } catch (error: any) {
      logSecurityEvent('SUBSCRIPTION_CANCELLATION_FAILED', {
        userId: userId || 'unknown',
        subscriptionId: user?.stripeSubscriptionId || 'unknown',
        error: error.message,
        stripeError: error.type || 'unknown'
      }, false);
      
      res.status(500).json({ 
        error: { 
          message: "Failed to cancel subscription. Please try again.",
          type: 'cancellation_error'
        }
      });
    }
  });

  // Update subscription tier
  app.post('/api/subscription/update-tier', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        error: { message: "Payment processing not configured. Please contact support." }
      });
    }

    let newTier: string | undefined;
    let userId: string | undefined;
    let user: any;
    
    try {
      // Validate request body with Zod schema for security
      const validatedData = updateTierSchema.parse(req.body);
      newTier = validatedData.newTier;
      userId = req.user?.claims?.sub || (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: { message: "User not authenticated" } });
      }

      if (!newTier || !validateSubscriptionTier(newTier)) {
        return res.status(400).json({ 
          error: { message: "Invalid subscription tier. Must be one of: seeker, pioneer, visionary" }
        });
      }

      user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: { message: "User not found" } });
      }

      const currentTier = user.subscriptionTier || 'seeker';
      if (currentTier === newTier) {
        return res.status(400).json({
          error: { message: `Already subscribed to ${SUBSCRIPTION_TIERS[newTier].name} tier` }
        });
      }

      const targetTier = SUBSCRIPTION_TIERS[newTier];

      // Handle downgrade to free tier (seeker)
      if (newTier === 'seeker') {
        if (user.stripeSubscriptionId) {
          await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: true,
            metadata: {
              downgrade_to: 'seeker',
              downgrade_requested: new Date().toISOString()
            }
          });
        }

        await storage.upsertUser({
          subscriptionTier: 'seeker',
        }, userId);

        return res.json({
          success: true,
          message: "Successfully downgraded to Seeker tier. Paid subscription will end at current period.",
          newTier: 'seeker'
        });
      }

      // Handle upgrade/change to paid tier
      if (!targetTier.priceId) {
        return res.status(400).json({
          error: { message: `${targetTier.name} tier is not configured for payment processing` }
        });
      }

      // If user has existing subscription, update it
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          // Update existing subscription
          const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
            items: [{
              id: subscription.items.data[0].id,
              price: targetTier.priceId,
            }],
            proration_behavior: 'create_prorations',
            metadata: {
              ...subscription.metadata,
              previous_tier: currentTier,
              new_tier: newTier,
              tier_change_date: new Date().toISOString()
            }
          });

          await storage.upsertUser({
            subscriptionTier: newTier,
          }, userId);

          return res.json({
            success: true,
            message: `Successfully updated to ${targetTier.name} tier`,
            newTier: newTier,
            subscription: {
              id: updatedSubscription.id,
              status: updatedSubscription.status
            }
          });
        }
      }

      // If no active subscription, create new one
      if (!user.email) {
        return res.status(400).json({ 
          error: { message: "User email is required for paid subscriptions" }
        });
      }

      // Create or retrieve customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: {
            userId: userId,
            archetype: user.archetype || 'unknown',
            generation: user.generation || 'unknown'
          }
        });
        customerId = customer.id;
      }

      // Create new subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: targetTier.priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          tier: newTier,
          previous_tier: currentTier,
          archetype: user.archetype || 'unknown',
          generation: user.generation || 'unknown'
        }
      });

      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
      
      const latestInvoice = subscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret || null;

      res.json({
        success: true,
        message: `Successfully created ${targetTier.name} subscription`,
        newTier: newTier,
        subscriptionId: subscription.id,
        clientSecret,
        requiresPayment: true
      });

    } catch (error: any) {
      logSecurityEvent('SUBSCRIPTION_UPDATE_FAILED', {
        userId: userId || 'unknown',
        currentTier: user?.subscriptionTier || 'unknown',
        newTier: newTier || 'unknown',
        error: error.message,
        stripeError: error.type || 'unknown'
      }, false);
      
      let errorMessage = "Failed to update subscription tier. Please try again.";
      if (error.type === 'StripeCardError') {
        errorMessage = "Payment failed. Please update your payment method.";
      } else if (error.message?.includes('price')) {
        errorMessage = "The selected subscription tier is currently unavailable.";
      }
      
      res.status(500).json({ 
        error: { 
          message: errorMessage,
          type: 'update_error'
        }
      });
    }
  });

  // Stripe webhook handler for automatic subscription management
  app.post('/api/webhooks/stripe', async (req, res) => {
    if (!stripe) {
      logSecurityEvent('WEBHOOK_DISABLED', { reason: 'Stripe not configured' }, false);
      return res.status(503).json({ 
        error: "Payment processing not configured" 
      });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      logSecurityEvent('WEBHOOK_NO_SIGNATURE', { headers: req.headers }, false);
      return res.status(400).json({ error: "No Stripe signature provided" });
    }

    if (!webhookSecret) {
      logSecurityEvent('WEBHOOK_NO_SECRET', { reason: 'Webhook secret not configured' }, false);
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature - CRITICAL SECURITY CHECK
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      logSecurityEvent('WEBHOOK_SIGNATURE_VERIFIED', { eventType: event.type, eventId: event.id });
    } catch (err: any) {
      logSecurityEvent('WEBHOOK_SIGNATURE_FAILED', { 
        error: err.message, 
        signature: sig?.substring(0, 20) + '...', // Log partial signature for debugging
        bodyLength: req.body?.length 
      }, false);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    // Idempotency check - prevent processing duplicate events
    const now = Date.now();
    if (processedEvents.has(event.id)) {
      logSecurityEvent('WEBHOOK_DUPLICATE_IGNORED', { eventId: event.id, eventType: event.type });
      return res.json({ received: true, status: 'duplicate_ignored', eventId: event.id });
    }

    // Clean up old processed events to prevent memory issues
    const entriesToDelete: string[] = [];
    processedEventTimestamps.forEach((timestamp, eventId) => {
      if (now - timestamp > eventExpiryTime) {
        entriesToDelete.push(eventId);
      }
    });
    
    entriesToDelete.forEach(eventId => {
      processedEvents.delete(eventId);
      processedEventTimestamps.delete(eventId);
    });

    // Mark event as processed
    processedEvents.add(event.id);
    processedEventTimestamps.set(event.id, now);

    logSecurityEvent('WEBHOOK_PROCESSING', { eventType: event.type, eventId: event.id });

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdate(subscription, event.type);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCancellation(subscription);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentSuccess(invoice);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailure(invoice);
          break;
        }

        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      logSecurityEvent('WEBHOOK_SUCCESS', { eventType: event.type, eventId: event.id });
      res.json({ received: true, eventType: event.type, eventId: event.id, processedAt: new Date().toISOString() });

    } catch (error: any) {
      logSecurityEvent('WEBHOOK_PROCESSING_ERROR', {
        eventType: event.type,
        eventId: event.id,
        error: error.message,
        stack: error.stack?.substring(0, 500) // Log partial stack for debugging
      }, false);
      res.status(500).json({ 
        error: "Webhook processing failed",
        eventType: event.type,
        eventId: event.id,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Webhook helper functions
  async function handleSubscriptionUpdate(subscription: Stripe.Subscription, eventType: string) {
    const userId = subscription.metadata?.userId;
    const tier = subscription.metadata?.tier;

    if (!userId) {
      console.error(`No userId in subscription metadata: ${subscription.id}`);
      return;
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`User not found for subscription: ${userId}`);
        return;
      }

      // Determine tier from subscription
      let subscriptionTier: 'seeker' | 'pioneer' | 'visionary' = 'seeker';
      
      if (tier && validateSubscriptionTier(tier)) {
        subscriptionTier = tier as any;
      } else {
        // Fallback: determine tier from price
        const price = subscription.items.data[0]?.price;
        if (price) {
          for (const [tierKey, tierData] of Object.entries(SUBSCRIPTION_TIERS)) {
            if (tierData.priceId === price.id) {
              subscriptionTier = tierKey as any;
              break;
            }
          }
        }
      }

      // Update user subscription status
      await storage.upsertUser({
        subscriptionTier,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
      }, userId);

      console.log(`Updated user ${userId} subscription to ${subscriptionTier} tier (${eventType})`);

    } catch (error) {
      console.error(`Error updating user subscription:`, error);
      throw error;
    }
  }

  async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.error(`No userId in subscription metadata: ${subscription.id}`);
      return;
    }

    try {
      // Downgrade user to free tier
      await storage.upsertUser({
        subscriptionTier: 'seeker',
        stripeSubscriptionId: null,
      }, userId);

      console.log(`Downgraded user ${userId} to Seeker tier due to subscription cancellation`);

    } catch (error) {
      console.error(`Error handling subscription cancellation:`, error);
      throw error;
    }
  }

  async function handlePaymentSuccess(invoice: Stripe.Invoice) {
    const subscription = (invoice as any).subscription;
    
    if (!subscription) {
      console.log("Invoice not associated with subscription, skipping");
      return;
    }

    try {
      // Retrieve full subscription details
      const fullSubscription = await stripe!.subscriptions.retrieve(subscription as string);
      await handleSubscriptionUpdate(fullSubscription, 'payment_succeeded');

      console.log(`Payment successful for subscription: ${subscription}`);

    } catch (error) {
      console.error(`Error handling payment success:`, error);
      throw error;
    }
  }

  async function handlePaymentFailure(invoice: Stripe.Invoice) {
    const subscription = (invoice as any).subscription;
    const userId = invoice.metadata?.userId;

    if (!subscription) {
      console.log("Invoice not associated with subscription, skipping");
      return;
    }

    try {
      console.log(`Payment failed for subscription: ${subscription}`);
      
      // Could implement logic here to handle failed payments
      // e.g., send notification emails, grace period logic, etc.
      
      // For now, just log the failure
      if (userId) {
        console.log(`Payment failure for user: ${userId}`);
      }

    } catch (error) {
      console.error(`Error handling payment failure:`, error);
      throw error;
    }
  }

  async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;

    if (!userId || !tier) {
      console.error(`Missing metadata in checkout session: ${session.id}`);
      return;
    }

    try {
      if (validateSubscriptionTier(tier)) {
        await storage.upsertUser({
          subscriptionTier: tier as any,
        }, userId);

        console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
      }

    } catch (error) {
      console.error(`Error handling checkout completion:`, error);
      throw error;
    }
  }

  // Biblical Matrix routes
  app.get('/api/biblical-matrix', async (req, res) => {
    try {
      const matrix = await storage.getBiblicalMatrix();
      res.json(matrix);
    } catch (error) {
      console.error("Error fetching biblical matrix:", error);
      res.status(500).json({ message: "Failed to fetch biblical matrix" });
    }
  });

  app.get('/api/biblical-matrix/book/:bookNumber', async (req, res) => {
    try {
      const bookNumber = parseInt(req.params.bookNumber);
      const bookEntries = await storage.getBiblicalMatrixByBook(bookNumber);
      res.json(bookEntries);
    } catch (error) {
      console.error("Error fetching biblical matrix book:", error);
      res.status(500).json({ message: "Failed to fetch biblical matrix book" });
    }
  });

  app.get('/api/biblical-matrix/chapter/:chapterNumber', async (req, res) => {
    try {
      const chapterNumber = parseInt(req.params.chapterNumber);
      const entry = await storage.getBiblicalMatrixByChapter(chapterNumber);
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching biblical matrix chapter:", error);
      res.status(500).json({ message: "Failed to fetch biblical matrix chapter" });
    }
  });

  // Assessment submission route (for frontend Assessment page)
  app.post('/api/assessment/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { archetype, scores, answers, stage } = req.body;
      
      // Update user's archetype and stage
      await storage.upsertUser({
        archetype: archetype,
        currentStage: stage || 'r1',
      }, userId);

      const results = {
        archetype,
        scores,
        answers,
        completedAt: new Date().toISOString(),
        stage: stage || 'R1'
      };

      res.json(results);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });

  // Organization invitation route (for frontend Organization page)
  app.post('/api/organizations/invite', isAuthenticated, async (req: any, res) => {
    try {
      const { email, role, message } = req.body;
      
      // In a real app, you'd send an email invitation here
      // For now, just return success
      console.log(`Invitation sent to ${email} with role ${role}`);
      
      res.json({ 
        message: "Invitation sent successfully",
        email,
        role 
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // Data export route (for frontend Settings page)
  app.get('/api/export/data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const assessments = await storage.getUserAssessments(userId);
      const practices = await storage.getUserDailyPractices(
        userId, 
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 
        new Date()
      );
      
      const exportData = {
        user,
        assessments,
        practices,
        exportedAt: new Date().toISOString(),
      };

      res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // User profile update route (for frontend Settings page)
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      const updatedUser = await storage.upsertUser(updates, userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Hebrew name conversion route
  app.post('/api/hebrew-name', isAuthenticated, async (req: any, res) => {
    try {
      const { name } = req.body;
      const userId = req.user.claims.sub;
      
      // Simple Hebrew name conversion (in production, use a proper transliteration library)
      const hebrewMapping: Record<string, string> = {
        'a': 'א', 'b': 'ב', 'c': 'ג', 'd': 'ד', 'e': 'ה', 'f': 'ו', 'g': 'ז',
        'h': 'ח', 'i': 'ט', 'j': 'י', 'k': 'כ', 'l': 'ל', 'm': 'מ', 'n': 'נ',
        'o': 'ס', 'p': 'פ', 'q': 'צ', 'r': 'ק', 's': 'ר', 't': 'ש', 'u': 'ת',
        'v': 'ו', 'w': 'ו', 'x': 'קס', 'y': 'י', 'z': 'ז'
      };
      
      const hebrewName = name.toLowerCase()
        .split('')
        .map((char: string) => hebrewMapping[char] || char)
        .join('');

      // Update user's Hebrew name
      await storage.upsertUser({
        hebrewName,
      }, userId);

      res.json({ hebrewName });
    } catch (error) {
      console.error("Error converting Hebrew name:", error);
      res.status(500).json({ message: "Failed to convert Hebrew name" });
    }
  });

  // Claude AI Integration Routes
  // Biblical leadership insights (public endpoint)
  app.post('/api/claude/leadership-insight', async (req, res) => {
    try {
      const { query, userArchetype } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ message: "Claude AI not configured" });
      }

      const insight = await provideBiblicalGuidance(query, userArchetype);
      res.json({ insight });
    } catch (error) {
      console.error("Error getting Claude insight:", error);
      res.status(500).json({ message: "Failed to get leadership insight" });
    }
  });

  // Assessment analysis with Claude (authenticated)
  app.post('/api/claude/analyze-archetype', isAuthenticated, async (req: any, res) => {
    try {
      const { responses, archetype } = req.body;
      
      if (!responses || !archetype) {
        return res.status(400).json({ message: "Responses and archetype are required" });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ message: "Claude AI not configured" });
      }

      const questions = await generateReflectionQuestions(archetype);
      const analysis = `Based on your responses, here are key insights for ${archetype} archetype development:\n\nReflection Questions:\n${questions.join('\n')}`;
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing archetype:", error);
      res.status(500).json({ message: "Failed to analyze archetype" });
    }
  });

  // Meditation guidance with Claude (authenticated)
  app.post('/api/claude/meditation-guidance', isAuthenticated, async (req: any, res) => {
    try {
      const { frequency, userArchetype } = req.body;
      
      if (!frequency) {
        return res.status(400).json({ message: "Frequency is required" });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ message: "Claude AI not configured" });
      }

      const guidance = await provideBiblicalGuidance(
        `Provide meditation guidance for ${frequency}Hz frequency meditation for spiritual leadership development`,
        userArchetype
      );
      res.json({ guidance });
    } catch (error) {
      console.error("Error generating meditation guidance:", error);
      res.status(500).json({ message: "Failed to generate meditation guidance" });
    }
  });

  // Claude status check
  app.get('/api/claude/status', (req, res) => {
    const isConfigured = !!process.env.ANTHROPIC_API_KEY;
    res.json({ 
      configured: isConfigured,
      model: "claude-sonnet-4-20250514",
      features: [
        "Biblical leadership insights",
        "Archetype analysis", 
        "Sacred frequency meditation guidance"
      ]
    });
  });

  // Chat routes for Claude AI biblical guidance
  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, conversationHistory = [] } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get user profile for personalized guidance
      const user = await storage.getUser(userId);
      const userArchetype = user?.archetype || 'pioneer';
      const userGeneration = user?.generation || 'millennial';

      const response = await provideBiblicalGuidance(
        message,
        userArchetype,
        userGeneration,
        conversationHistory
      );

      res.json({ 
        response,
        archetype: userArchetype,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ message: "Failed to generate response: " + error.message });
    }
  });

  // Get reflection questions for user's archetype
  app.get('/api/reflection-questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userArchetype = user?.archetype || 'pioneer';

      const questions = await generateReflectionQuestions(userArchetype);
      res.json({ 
        questions,
        archetype: userArchetype
      });
    } catch (error: any) {
      console.error("Error generating reflection questions:", error);
      res.status(500).json({ message: "Failed to generate questions: " + error.message });
    }
  });

  // Missing: /api/assessment/determine-generation
  app.post('/api/assessment/determine-generation', async (req, res) => {
    try {
      const { birthYear, culturalMarkers, workStyle } = req.body;
      
      if (!birthYear) {
        return res.status(400).json({ message: "Birth year is required" });
      }

      const generation = determineGeneration(birthYear, culturalMarkers, workStyle);
      res.json({ generation });
    } catch (error) {
      console.error("Error determining generation:", error);
      res.status(500).json({ message: "Failed to determine generation" });
    }
  });


  // In routes.ts
  app.get('/api/assessment-tools/:generation/:archetype', async (req, res) => {
    try {
      const { generation, archetype } = req.params;
      
      // Validate generation and archetype
      const validGenerations = ['gen-z', 'millennial', 'gen-x', 'boomer', 'silent'];
      const validArchetypes = ['pioneer', 'organizer', 'builder', 'guardian'];
      
      if (!validGenerations.includes(generation)) {
        return res.status(400).json({ message: "Invalid generation" });
      }
      
      if (!validArchetypes.includes(archetype)) {
        return res.status(400).json({ message: "Invalid archetype" });
      }

      // Map generation + archetype to specific biblical books/chapters
      const toolsMatrix = getGenerationalTools(generation, archetype);
      
      res.json({
        generation,
        archetype,
        recommendedBooks: toolsMatrix.books,
        startingChapter: toolsMatrix.chapter,
        assessmentTools: toolsMatrix.tools
      });
    } catch (error) {
      console.error("Error getting assessment tools:", error);
      res.status(500).json({ message: "Failed to get assessment tools" });
    }
  });

  // Generation detection and management
  app.post('/api/user/generation', async (req, res) => {
    try {
      const { birthYear, userId } = req.body;
      
      if (!birthYear || !userId) {
        return res.status(400).json({ message: "Birth year and user ID required" });
      }
      
      const generation = await storage.setUserGeneration(userId, birthYear);
      res.json(generation);
    } catch (error) {
      console.error("Error setting user generation:", error);
      res.status(500).json({ message: "Failed to set generation" });
    }
  });

  app.get('/api/user/:userId/generation', async (req, res) => {
    try {
      const { userId } = req.params;
      const generation = await storage.getUserGeneration(userId);
      
      if (!generation) {
        return res.status(404).json({ message: "Generation not found" });
      }
      
      res.json(generation);
    } catch (error) {
      console.error("Error fetching user generation:", error);
      res.status(500).json({ message: "Failed to fetch generation" });
    }
  });

  // Chapter progression routes
  app.get('/api/chapters/available/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const chapterAccess = await storage.getAvailableChapters(userId);
      res.json(chapterAccess);
    } catch (error) {
      console.error("Error fetching available chapters:", error);
      res.status(500).json({ message: "Failed to fetch available chapters" });
    }
  });

  app.get('/api/user/:userId/progress', async (req, res) => {
    try {
      const { userId } = req.params;
      const chapterProgress = await storage.getUserChapterProgress(userId);
      const bookProgress = await storage.getUserBookProgress(userId);
      
      res.json({
        chapters: chapterProgress,
        books: bookProgress,
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post('/api/chapters/:chapterNumber/unlock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub || (req.session as any)?.userId;
      const chapterNumber = parseInt(req.params.chapterNumber);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Check if user has access to this chapter
      const availableChapters = await storage.getAvailableChapters(userId);
      const hasAccess = availableChapters.some(chapter => chapter.chapterNumber === chapterNumber);
      if (!hasAccess) {
        return res.status(403).json({ message: "Chapter not yet available" });
      }
      
      const progress = await storage.unlockChapter(userId, chapterNumber);
      res.json(progress);
    } catch (error) {
      console.error("Error unlocking chapter:", error);
      res.status(500).json({ message: "Failed to unlock chapter" });
    }
  });

  app.post('/api/chapters/:chapterNumber/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub || (req.session as any)?.userId;
      const chapterNumber = parseInt(req.params.chapterNumber);
      const { assessmentScore = 0, practiceMinutes = 0 } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const progress = await storage.completeChapterProgress(
        userId, 
        chapterNumber, 
        assessmentScore, 
        practiceMinutes
      );
      
      res.json(progress);
    } catch (error) {
      console.error("Error completing chapter:", error);
      res.status(500).json({ message: "Failed to complete chapter" });
    }
  });

  // Chapter assessments
  app.post('/api/chapters/:chapterNumber/assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub || (req.session as any)?.userId;
      const chapterNumber = parseInt(req.params.chapterNumber);
      const { responses, score, passed } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const assessment = await storage.createChapterAssessment(
        userId,
        chapterNumber,
        responses,
        score,
        passed
      );
      
      // If passed, complete the chapter
      if (passed) {
        await storage.completeChapterProgress(userId, chapterNumber, score);
      }
      
      res.json(assessment);
    } catch (error) {
      console.error("Error submitting chapter assessment:", error);
      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });

  app.get('/api/user/:userId/assessments/:chapterNumber?', async (req, res) => {
    try {
      const { userId, chapterNumber } = req.params;
      const chapterNum = chapterNumber ? parseInt(chapterNumber) : undefined;
      
      const assessments = await storage.getChapterAssessments(userId, chapterNum);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  // Public assessment submission (for non-authenticated users)
  app.post('/api/assessment/public-submit', async (req, res) => {
    try {
      const { responses, birthYear, email } = req.body;
      
      if (!responses || !birthYear) {
        return res.status(400).json({ message: "Responses and birth year required" });
      }
      
      // Calculate archetype from responses
      const archetype = calculateArchetypeFromResponses(responses);
      
      // Determine generation
      const generation = determineGeneration(birthYear);
      
      // Store in session for later use
      (req.session as any).assessmentResults = {
        archetype,
        generation,
        birthYear,
        email: email || null,
        submittedAt: new Date().toISOString(),
        responses
      };
      
      res.json({
        archetype,
        generation,
        nextStep: `/matrix?archetype=${archetype}&generation=${generation}`,
        message: "Assessment completed! Create an account to save your progress."
      });
    } catch (error) {
      console.error("Error submitting public assessment:", error);
      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });

  // Game progression routes
  app.get('/api/user/:id/game-progress', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // For demo users, allow access, otherwise ensure user can only access their own data
      const userSub = req.user?.claims?.sub;
      const userEmail = req.user?.claims?.email;
      const isDemo = userEmail && userEmail.startsWith('demo-');
      
      if (!isDemo && userSub !== id) {
        console.log(`Access denied: userSub=${userSub}, id=${id}, isDemo=${isDemo}`);
        return res.status(403).json({ message: "Access denied" });
      }
      
      const gameProgress = await storage.getUserGameProgress(id);
      res.json(gameProgress);
    } catch (error) {
      console.error("Error fetching game progress:", error);
      res.status(500).json({ message: "Failed to fetch game progress" });
    }
  });

  app.post('/api/chapters/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const { id: chapterNumberStr } = req.params;
      const chapterNumber = parseInt(chapterNumberStr);
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (isNaN(chapterNumber) || chapterNumber < 1 || chapterNumber > 27) {
        return res.status(400).json({ message: "Invalid chapter number" });
      }

      // Complete chapter with XP award
      const result = await storage.completeChapterWithXP(userId, chapterNumber);
      
      // Unlock next chapter
      const unlockedChapters = await storage.unlockNextChapter(userId);
      
      res.json({
        ...result,
        unlockedChapters,
        message: result.levelUp ? 
          `Congratulations! You've reached level ${result.user.level}!` : 
          `Chapter ${chapterNumber} completed! +${result.xpGained} XP`
      });
    } catch (error) {
      console.error("Error completing chapter:", error);
      res.status(500).json({ message: "Failed to complete chapter" });
    }
  });

  app.get('/api/chapters/available/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Ensure user can only access their own data
      if (req.user?.claims?.sub !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const availableChapters = await storage.getAvailableChapters(userId);
      res.json(availableChapters);
    } catch (error) {
      console.error("Error fetching available chapters:", error);
      res.status(500).json({ message: "Failed to fetch available chapters" });
    }
  });

  // Gate progression routes
  app.get('/api/gates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const gates = await storage.getGateStatus(userId);
      res.json(gates);
    } catch (error) {
      console.error("Error fetching gate status:", error);
      res.status(500).json({ message: "Failed to fetch gate status" });
    }
  });

  app.post('/api/gates/:gateType/complete', isAuthenticated, async (req: any, res) => {
    try {
      const { gateType } = req.params;
      const { chapterNumber } = req.body;
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const validGateTypes = ['identity_mirror', 'shofar_convergence', 'network_multiplication', 'twelve_gate_convergence'];
      if (!validGateTypes.includes(gateType)) {
        return res.status(400).json({ message: "Invalid gate type" });
      }

      if (!chapterNumber || isNaN(chapterNumber)) {
        return res.status(400).json({ message: "Chapter number required" });
      }

      const completedGate = await storage.completeGate(userId, gateType, parseInt(chapterNumber));
      
      res.json({
        gate: completedGate,
        message: `Congratulations! You've completed the ${gateType.replace('_', ' ')} gate!`,
        experienceGained: 100
      });
    } catch (error) {
      console.error("Error completing gate:", error);
      res.status(500).json({ message: "Failed to complete gate" });
    }
  });

  // Initialize user gates for new users
  app.post('/api/gates/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      await storage.initializeUserGates(userId);
      const gates = await storage.getGateStatus(userId);
      
      res.json({
        gates,
        message: "Gates initialized successfully"
      });
    } catch (error) {
      console.error("Error initializing gates:", error);
      res.status(500).json({ message: "Failed to initialize gates" });
    }
  });

  // GitHub upload route
  app.post('/api/github/upload', async (req, res) => {
    try {
      console.log('🚀 Starting GitHub upload process...');
      
      const result = await uploadProjectToGitHub({
        repoName: 'fractal-leader',
        description: 'Fractal Leader - Biblical Leadership Development SaaS Platform with Hebrew matrix animations and multi-generational team formation tools',
        private: false,
        excludePatterns: ['*.log', 'temp/', '.tmp/', 'cookies.txt']
      });
      
      console.log('✅ GitHub upload completed successfully!');
      res.json(result);
    } catch (error: any) {
      console.error('❌ GitHub upload failed:', error.message);
      res.status(500).json({ 
        success: false,
        error: error.message,
        message: 'Failed to upload project to GitHub'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
