// Generational adaptation engine for UI and content delivery

export type Generation = 'gen_z' | 'millennial' | 'gen_x' | 'boomer';

export interface GenerationalPreferences {
  contentFormat: 'microlearning' | 'collaborative' | 'practical' | 'structured';
  interactionStyle: 'gamified' | 'peer-driven' | 'tool-focused' | 'linear';
  feedbackFrequency: 'immediate' | 'weekly' | 'milestone-based' | 'comprehensive';
  socialElements: 'competition' | 'group_challenges' | 'optional' | 'mentorship';
  visualStyle: 'dynamic' | 'modern' | 'professional' | 'classic';
  communicationPreference: 'chat' | 'video' | 'email' | 'phone';
}

export interface AdaptedContent {
  title: string;
  description: string;
  format: string;
  duration: string;
  callToAction: string;
  frequency?: string;
  type?: string;
  visualElements?: string[];
}

/**
 * Generational preferences mapping
 */
const generationalPreferences: Record<Generation, GenerationalPreferences> = {
  gen_z: {
    contentFormat: 'microlearning',
    interactionStyle: 'gamified',
    feedbackFrequency: 'immediate',
    socialElements: 'competition',
    visualStyle: 'dynamic',
    communicationPreference: 'chat',
  },
  millennial: {
    contentFormat: 'collaborative',
    interactionStyle: 'peer-driven',
    feedbackFrequency: 'weekly',
    socialElements: 'group_challenges',
    visualStyle: 'modern',
    communicationPreference: 'video',
  },
  gen_x: {
    contentFormat: 'practical',
    interactionStyle: 'tool-focused',
    feedbackFrequency: 'milestone-based',
    socialElements: 'optional',
    visualStyle: 'professional',
    communicationPreference: 'email',
  },
  boomer: {
    contentFormat: 'structured',
    interactionStyle: 'linear',
    feedbackFrequency: 'comprehensive',
    socialElements: 'mentorship',
    visualStyle: 'classic',
    communicationPreference: 'phone',
  },
};

/**
 * Content adaptation rules for different generations
 */
const contentAdaptationRules = {
  gen_z: {
    titleFormat: (base: string) => `🔥 ${base}`,
    descriptionStyle: 'short-punchy',
    durationDisplay: 'time-remaining',
    ctaStyle: 'action-oriented',
    enableStreaks: true,
    enableBadges: true,
    enableLeaderboard: true,
  },
  millennial: {
    titleFormat: (base: string) => base,
    descriptionStyle: 'collaborative-focused',
    durationDisplay: 'estimated-time',
    ctaStyle: 'community-driven',
    enablePeerFeedback: true,
    enableGroupChallenges: true,
    enableSocialSharing: true,
  },
  gen_x: {
    titleFormat: (base: string) => base,
    descriptionStyle: 'outcome-focused',
    durationDisplay: 'time-investment',
    ctaStyle: 'practical-benefit',
    enableKPITracking: true,
    enableReporting: true,
    enableIntegrations: true,
  },
  boomer: {
    titleFormat: (base: string) => base,
    descriptionStyle: 'comprehensive-detailed',
    durationDisplay: 'full-schedule',
    ctaStyle: 'step-by-step',
    enablePrintableResources: true,
    enablePhoneSupport: true,
    enableDetailedInstructions: true,
  },
};

/**
 * Adapt content for specific generation
 */
export function adaptContentForGeneration(
  generation: Generation, 
  baseContent: Record<string, any>
): Record<string, AdaptedContent> {
  const preferences = generationalPreferences[generation];
  const rules = contentAdaptationRules[generation];
  
  const adaptedContent: Record<string, AdaptedContent> = {};
  
  Object.entries(baseContent).forEach(([key, content]) => {
    adaptedContent[key] = {
      title: rules.titleFormat(content.title),
      description: adaptDescription(content.description, preferences.contentFormat),
      format: adaptFormat(content.format || 'standard', preferences.interactionStyle),
      duration: adaptDuration(content.duration, generation),
      callToAction: adaptCallToAction(content.callToAction || 'Start', preferences.interactionStyle),
      visualElements: getGenerationalVisualElements(generation),
    };
  });
  
  return adaptedContent;
}

/**
 * Adapt description based on content format preference
 */
function adaptDescription(description: string, format: GenerationalPreferences['contentFormat']): string {
  switch (format) {
    case 'microlearning':
      return description.split('.')[0] + ' 🎯'; // First sentence with emoji
    case 'collaborative':
      return description.replace(/you/g, 'we');
    case 'practical':
      return `Outcome: ${description}`;
    case 'structured':
      return `Step-by-step: ${description}`;
    default:
      return description;
  }
}

/**
 * Adapt format based on interaction style
 */
function adaptFormat(format: string, style: GenerationalPreferences['interactionStyle']): string {
  const formatMap = {
    gamified: `Interactive ${format}`,
    'peer-driven': `Collaborative ${format}`,
    'tool-focused': `Integrated ${format}`,
    linear: `Guided ${format}`,
  };
  
  return formatMap[style] || format;
}

/**
 * Adapt duration display for generation
 */
function adaptDuration(duration: string, generation: Generation): string {
  switch (generation) {
    case 'gen_z':
      return `⚡ ${duration}`;
    case 'millennial':
      return `~${duration}`;
    case 'gen_x':
      return `Investment: ${duration}`;
    case 'boomer':
      return `Duration: ${duration}`;
    default:
      return duration;
  }
}

/**
 * Adapt call-to-action for interaction style
 */
function adaptCallToAction(cta: string, style: GenerationalPreferences['interactionStyle']): string {
  const ctaMap = {
    gamified: `🚀 ${cta} Now!`,
    'peer-driven': `Join & ${cta}`,
    'tool-focused': `${cta} & Track`,
    linear: `Begin ${cta}`,
  };
  
  return ctaMap[style] || cta;
}

/**
 * Get visual elements for generation
 */
function getGenerationalVisualElements(generation: Generation): string[] {
  const visualMap = {
    gen_z: ['emojis', 'progress-bars', 'achievement-badges', 'streak-counters'],
    millennial: ['avatars', 'collaboration-icons', 'peer-ratings', 'group-progress'],
    gen_x: ['charts', 'kpi-widgets', 'trend-indicators', 'integration-status'],
    boomer: ['step-indicators', 'completion-checkboxes', 'detailed-guides', 'phone-numbers'],
  };
  
  return visualMap[generation] || [];
}

/**
 * Generate team communication protocols based on generational mix
 */
export function generateCommunicationProtocols(teamMembers: Array<{ generation: Generation }>): {
  urgent: string[];
  updates: string[];
  feedback: string[];
  meetings: string[];
} {
  const generationCounts = teamMembers.reduce((acc, member) => {
    acc[member.generation] = (acc[member.generation] || 0) + 1;
    return acc;
  }, {} as Record<Generation, number>);
  
  const protocols = {
    urgent: [] as string[],
    updates: [] as string[],
    feedback: [] as string[],
    meetings: [] as string[],
  };
  
  // Add protocols based on team composition
  if (generationCounts.gen_z > 0) {
    protocols.urgent.push('Slack/Teams instant messaging');
    protocols.updates.push('Quick video updates (< 2 min)');
    protocols.feedback.push('Real-time reaction emojis');
    protocols.meetings.push('Stand-ups with visual dashboards');
  }
  
  if (generationCounts.millennial > 0) {
    protocols.urgent.push('Email with immediate follow-up call');
    protocols.updates.push('Weekly team video calls');
    protocols.feedback.push('Peer feedback sessions');
    protocols.meetings.push('Collaborative planning workshops');
  }
  
  if (generationCounts.gen_x > 0) {
    protocols.urgent.push('Email with clear subject lines');
    protocols.updates.push('Structured status reports');
    protocols.feedback.push('Milestone-based reviews');
    protocols.meetings.push('Agenda-driven meetings with outcomes');
  }
  
  if (generationCounts.boomer > 0) {
    protocols.urgent.push('Phone calls with follow-up email');
    protocols.updates.push('Detailed written summaries');
    protocols.feedback.push('One-on-one comprehensive reviews');
    protocols.meetings.push('Formal meetings with documentation');
  }
  
  return protocols;
}

/**
 * Calculate optimal team generational mix
 */
export function calculateOptimalGenerationalMix(
  availableMembers: Array<{ generation: Generation; archetype: string }>,
  targetSize: number = 8
): {
  recommended: Array<{ generation: Generation; archetype: string }>;
  effectiveness: number;
  reasoning: string[];
} {
  // Ideal mix percentages
  const idealMix = {
    gen_z: 0.25,      // Innovation and tech
    millennial: 0.35,  // Collaboration and execution  
    gen_x: 0.25,      // Experience and stability
    boomer: 0.15,     // Wisdom and mentorship
  };
  
  // Calculate current mix
  const currentMix = availableMembers.reduce((acc, member) => {
    acc[member.generation] = (acc[member.generation] || 0) + 1;
    return acc;
  }, {} as Record<Generation, number>);
  
  // Sort by generation diversity and archetype balance
  const recommended = availableMembers
    .sort((a, b) => {
      // Prefer diverse generations
      const aGenCount = currentMix[a.generation] || 0;
      const bGenCount = currentMix[b.generation] || 0;
      if (aGenCount !== bGenCount) return aGenCount - bGenCount;
      
      // Prefer balanced archetypes
      const archetypeOrder = ['pioneer', 'organizer', 'builder', 'guardian'];
      return archetypeOrder.indexOf(a.archetype) - archetypeOrder.indexOf(b.archetype);
    })
    .slice(0, targetSize);
  
  // Calculate effectiveness score
  const finalMix = recommended.reduce((acc, member) => {
    acc[member.generation] = (acc[member.generation] || 0) + 1;
    return acc;
  }, {} as Record<Generation, number>);
  
  let effectiveness = 0;
  Object.entries(idealMix).forEach(([gen, ideal]) => {
    const actual = (finalMix[gen as Generation] || 0) / targetSize;
    effectiveness += 1 - Math.abs(ideal - actual);
  });
  effectiveness = (effectiveness / Object.keys(idealMix).length) * 100;
  
  const reasoning = [
    `Generational diversity: ${Object.keys(finalMix).length}/4 generations represented`,
    `Innovation potential: ${Math.round(((finalMix.gen_z || 0) + (finalMix.millennial || 0)) / targetSize * 100)}% younger generations`,
    `Experience factor: ${Math.round(((finalMix.gen_x || 0) + (finalMix.boomer || 0)) / targetSize * 100)}% experienced generations`,
    `Communication efficiency: ${effectiveness > 80 ? 'High' : effectiveness > 60 ? 'Medium' : 'Needs improvement'}`,
  ];
  
  return {
    recommended,
    effectiveness: Math.round(effectiveness),
    reasoning,
  };
}

/**
 * Get UI adaptation settings for generation
 */
export function getUIAdaptationSettings(generation: Generation): {
  colorScheme: string;
  typography: string;
  spacing: string;
  animations: boolean;
  complexity: 'minimal' | 'moderate' | 'detailed' | 'comprehensive';
} {
  const adaptations = {
    gen_z: {
      colorScheme: 'vibrant-gradients',
      typography: 'modern-sans',
      spacing: 'compact',
      animations: true,
      complexity: 'minimal' as const,
    },
    millennial: {
      colorScheme: 'clean-modern',
      typography: 'clean-sans',
      spacing: 'comfortable',
      animations: true,
      complexity: 'moderate' as const,
    },
    gen_x: {
      colorScheme: 'professional-neutral',
      typography: 'readable-sans',
      spacing: 'standard',
      animations: false,
      complexity: 'detailed' as const,
    },
    boomer: {
      colorScheme: 'high-contrast',
      typography: 'large-serif',
      spacing: 'generous',
      animations: false,
      complexity: 'comprehensive' as const,
    },
  };
  
  return adaptations[generation];
}

/**
 * Generate generation-specific onboarding flow
 */
export function generateOnboardingFlow(generation: Generation): Array<{
  step: number;
  title: string;
  description: string;
  action: string;
  estimatedTime: string;
}> {
  const flows = {
    gen_z: [
      {
        step: 1,
        title: '🚀 Quick Setup',
        description: 'Set your profile and preferences in under 2 minutes',
        action: 'Get Started',
        estimatedTime: '2 min',
      },
      {
        step: 2,
        title: '🎮 Take the Quiz',
        description: 'Discover your leadership archetype through our interactive assessment',
        action: 'Start Quiz',
        estimatedTime: '5 min',
      },
      {
        step: 3,
        title: '⚡ First Challenge',
        description: 'Complete your first micro-practice and earn your first badge',
        action: 'Accept Challenge',
        estimatedTime: '3 min',
      },
    ],
    millennial: [
      {
        step: 1,
        title: 'Welcome to the Community',
        description: 'Join thousands of leaders on their development journey',
        action: 'Join Community',
        estimatedTime: '5 min',
      },
      {
        step: 2,
        title: 'Discover Your Style',
        description: 'Take our comprehensive assessment to understand your leadership approach',
        action: 'Start Assessment',
        estimatedTime: '10 min',
      },
      {
        step: 3,
        title: 'Connect with Peers',
        description: 'Find your first team or join an existing community',
        action: 'Find Teams',
        estimatedTime: '5 min',
      },
    ],
    gen_x: [
      {
        step: 1,
        title: 'Platform Overview',
        description: 'Understand how Fractal Leader integrates with your existing workflow',
        action: 'View Overview',
        estimatedTime: '10 min',
      },
      {
        step: 2,
        title: 'Leadership Assessment',
        description: 'Complete our validated assessment to establish your baseline',
        action: 'Begin Assessment',
        estimatedTime: '15 min',
      },
      {
        step: 3,
        title: 'Set Goals & Metrics',
        description: 'Define your development objectives and success metrics',
        action: 'Set Goals',
        estimatedTime: '10 min',
      },
    ],
    boomer: [
      {
        step: 1,
        title: 'Getting Started Guide',
        description: 'Comprehensive walkthrough of all platform features and benefits',
        action: 'Read Guide',
        estimatedTime: '20 min',
      },
      {
        step: 2,
        title: 'Complete Profile Setup',
        description: 'Provide detailed information for personalized recommendations',
        action: 'Complete Profile',
        estimatedTime: '15 min',
      },
      {
        step: 3,
        title: 'Schedule Support Call',
        description: 'Book a one-on-one session with our onboarding specialist',
        action: 'Schedule Call',
        estimatedTime: '30 min',
      },
    ],
  };
  
  return flows[generation];
}
