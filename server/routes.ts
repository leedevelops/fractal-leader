import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAssessmentSchema, insertDailyPracticeSchema, insertTeamSchema, insertOrganizationSchema } from "@shared/schema";
import { provideBiblicalGuidance, generateReflectionQuestions } from "./claude";
import { z } from "zod";

// Make Stripe optional for development
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

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

  app.get('/api/teams/:id/effectiveness', isAuthenticated, async (req, res) => {
    try {
      const effectiveness = await storage.calculateTeamEffectiveness(req.params.id);
      res.json(effectiveness);
    } catch (error) {
      console.error("Error calculating team effectiveness:", error);
      res.status(500).json({ message: "Failed to calculate team effectiveness" });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Payment processing not configured. Please contact support." 
      });
    }

    try {
      const user = req.user;

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const latestInvoice = subscription.latest_invoice as any;
        const clientSecret = latestInvoice?.payment_intent?.client_secret || null;
        
        res.send({
          subscriptionId: subscription.id,
          clientSecret,
        });
        return;
      }
      
      if (!user.email) {
        throw new Error('No user email on file');
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Set in environment
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.claims.sub, customer.id, subscription.id);
      
      const latestInvoice = subscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret || null;
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret,
      });
    } catch (error: any) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
