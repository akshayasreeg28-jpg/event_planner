import { z } from 'zod';
import { callGemini, Type, GeminiConfigError } from './geminiClient';

export const PlanInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Event type is required'),
  date: z.string().optional().default(''),
  city: z.string().optional().default(''),
  guestCount: z.number().nonnegative().optional().default(100),
  totalBudgetMinor: z.number().nonnegative().optional().default(50000000),
  currency: z.string().optional().default('INR'),
  themePreference: z.string().optional().default(''),
  dietaryPreferences: z.array(z.string()).optional().default([]),
  culturalTraditions: z.string().optional().default(''),
  specialRequests: z.string().optional().default(''),
  clarifyingAnswers: z.record(z.string(), z.string()).optional().default({}),
});

export type PlanInput = z.infer<typeof PlanInputSchema>;

export const AIPlanOutputSchema = z.object({
  source: z.enum(['ai', 'fallback']).default('ai'),
  fallbackReason: z.string().optional(),
  isFallback: z.boolean().default(false),
  overview: z.string(),
  theme: z.string(),
  venue_requirements: z.string(),
  decor_concept: z.string(),
  catering_plan: z.string(),
  entertainment: z.string(),
  guest_experience: z.string(),
  preparation_schedule: z.string(),
  risks_contingencies: z.string(),
  budget_allocations: z.array(
    z.object({
      category: z.string(),
      percentage: z.number().min(1).max(100),
    })
  ),
  suggested_tasks: z.array(
    z.object({
      title: z.string(),
      phase: z.enum([
        'Initial Planning',
        'Booking & Vendors',
        'Purchasing & Decor',
        'Final Confirmations',
        'Event Day',
      ]),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      leadTimeWeeksBefore: z.number(),
    })
  ),
  vendor_categories: z.array(
    z.object({
      category: z.string(),
      requirements: z.array(z.string()),
      questionsToAsk: z.array(z.string()),
      estimatedCostPercentage: z.number(),
    })
  ),
  clarifying_questions: z.array(z.string()).default([]),
  missing_critical_info: z.array(z.string()).default([]),
});

export type AIPlanOutput = z.infer<typeof AIPlanOutputSchema>;

/**
 * Evaluates event inputs to find missing or critical underspecified details.
 */
export function checkMissingCriticalInfo(input: PlanInput): {
  missingFields: string[];
  clarifyingQuestions: string[];
} {
  const missingFields: string[] = [];
  const clarifyingQuestions: string[] = [];

  if (!input.city || input.city.trim().length < 2) {
    missingFields.push('city');
    clarifyingQuestions.push('Which city or neighborhood will host the event for venue and travel logistics?');
  }

  if (!input.date) {
    missingFields.push('date');
    clarifyingQuestions.push('What is the target celebration date or preferred season/month?');
  }

  if (!input.guestCount || input.guestCount < 10) {
    missingFields.push('guestCount');
    clarifyingQuestions.push('What is your anticipated guest headcount range (e.g. 50, 200, 500+)?');
  }

  if (!input.totalBudgetMinor || input.totalBudgetMinor <= 0) {
    missingFields.push('budget');
    clarifyingQuestions.push('Do you have a target overall budget ceiling in mind?');
  }

  // Type-specific critical checks
  if (input.type === 'wedding') {
    if (!input.culturalTraditions && !input.clarifyingAnswers?.traditions) {
      clarifyingQuestions.push('Will there be specific cultural or religious ceremonies (e.g. Muhurtham, Sangeet, Nikah, Church Mass)?');
    }
    if (!input.specialRequests?.toLowerCase().includes('alcohol') && !input.clarifyingAnswers?.alcohol) {
      clarifyingQuestions.push('Will alcohol be served at the evening reception or is it an alcohol-free banquet?');
    }
  } else if (input.type === 'college_fest') {
    if (!input.specialRequests?.toLowerCase().includes('curfew') && !input.clarifyingAnswers?.curfew) {
      clarifyingQuestions.push('Do you have campus or local police approval for sound curfew past 10:00 PM?');
    }
  } else if (input.type === 'corporate') {
    if (!input.specialRequests?.toLowerCase().includes('stream') && !input.clarifyingAnswers?.streaming) {
      clarifyingQuestions.push('Will this event require live streaming or dual-language breakout rooms?');
    }
  } else if (input.type === 'birthday') {
    if (!input.themePreference && !input.clarifyingAnswers?.theme) {
      clarifyingQuestions.push('Is there a specific party theme or cartoon/adventure motif for decor and cake?');
    }
  }

  return { missingFields, clarifyingQuestions };
}

export const planResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING, description: 'Vivid, specific executive event overview.' },
    theme: { type: Type.STRING, description: 'Concrete theme title and color palette.' },
    venue_requirements: { type: Type.STRING, description: 'Specific square footage, zoning, acoustics, amenities.' },
    decor_concept: { type: Type.STRING, description: 'Detailed decor, floral varieties, lighting specifics.' },
    catering_plan: { type: Type.STRING, description: 'Named signature dishes, welcome drinks, service format.' },
    entertainment: { type: Type.STRING, description: 'Specific performance types, audio rig, sequence.' },
    guest_experience: { type: Type.STRING, description: 'Arrival ritual, welcome station, favors, hospitality.' },
    preparation_schedule: { type: Type.STRING, description: 'Actionable lead-time timeline breakdown.' },
    risks_contingencies: { type: Type.STRING, description: 'Specific weather, power, noise, and safety backups.' },
    budget_allocations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          percentage: { type: Type.NUMBER },
        },
        required: ['category', 'percentage'],
      },
    },
    suggested_tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          phase: { type: Type.STRING },
          priority: { type: Type.STRING },
          leadTimeWeeksBefore: { type: Type.INTEGER },
        },
        required: ['title', 'phase', 'priority', 'leadTimeWeeksBefore'],
      },
    },
    vendor_categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedCostPercentage: { type: Type.NUMBER },
        },
        required: ['category', 'requirements', 'questionsToAsk', 'estimatedCostPercentage'],
      },
    },
    clarifying_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    missing_critical_info: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'overview',
    'theme',
    'venue_requirements',
    'decor_concept',
    'catering_plan',
    'entertainment',
    'guest_experience',
    'preparation_schedule',
    'risks_contingencies',
    'budget_allocations',
    'suggested_tasks',
    'vendor_categories',
  ],
};

/**
 * Main Gemini AI Plan Generator.
 * Validates inputs, prompts Gemini with structured output (responseSchema),
 * validates with Zod, retries once on validation failure with error feedback,
 * and falls back with an explicit reason if degraded.
 */
export async function generateEventPlan(rawInput: unknown): Promise<AIPlanOutput> {
  const eventInput = PlanInputSchema.parse(rawInput);
  const { missingFields, clarifyingQuestions } = checkMissingCriticalInfo(eventInput);

  const currencySymbol = eventInput.currency === 'INR' ? '₹' : '$';
  const totalBudgetMajor = Math.round(eventInput.totalBudgetMinor / 100);

  const systemInstruction = `You are a world-class luxury and enterprise event architect.
Generate a structured, hyper-specific, production-ready blueprint for this event.

STRICT CONSTRAINTS:
1. Ground the plan in the specific city (${eventInput.city || 'unspecified'}), guest count (${eventInput.guestCount}), and exact budget (${currencySymbol}${totalBudgetMajor.toLocaleString()}).
2. Include concrete named dishes (e.g. authentic regional delicacies, specific appetizers), authentic decor items (e.g. Mogra garlands, antique brass urlis, fairy canopies), and realistic local vendor tiers.
3. Budget allocations MUST be percentage numbers summing to exactly 100.
4. Suggested task phases MUST strictly be one of: "Initial Planning", "Booking & Vendors", "Purchasing & Decor", "Final Confirmations", "Event Day". Priority MUST be "low", "medium", "high", or "critical".
5. Return strictly valid JSON adhering to the response schema. Never output markdown code fences.`;

  const answersFormatted = Object.entries(eventInput.clarifyingAnswers || {})
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const basePrompt = `Plan this event:
Type: ${eventInput.type}
Title: ${eventInput.title}
Date: ${eventInput.date || 'TBD'}
City/Region: ${eventInput.city || 'TBD'}
Guest Count: ${eventInput.guestCount}
Total Budget: ${currencySymbol}${totalBudgetMajor.toLocaleString()} (${eventInput.totalBudgetMinor} minor units in ${eventInput.currency})
Theme Preference: ${eventInput.themePreference || 'Modern Classic'}
Dietary Preferences: ${(eventInput.dietaryPreferences || []).join(', ') || 'Multi-cuisine options'}
Cultural Traditions: ${eventInput.culturalTraditions || 'None specified'}
Special Requests: ${eventInput.specialRequests || 'None'}
${answersFormatted ? `Clarifying Answers:\n${answersFormatted}` : ''}`;

  try {
    let rawText = '';
    let parsed: any = null;
    let lastValidationError = '';

    // First attempt
    try {
      rawText = await callGemini({
        contents: basePrompt,
        systemInstruction,
        config: {
          responseMimeType: 'application/json',
          responseSchema: planResponseSchema,
        },
        timeoutMs: 28000,
      });
      parsed = JSON.parse(rawText);
    } catch (err: any) {
      if (err instanceof GeminiConfigError) {
        return createFallback(eventInput, 'API_KEY_MISSING', clarifyingQuestions, missingFields);
      }
      throw err;
    }

    // Validate with Zod; on failure retry once with error message appended
    const firstCheck = AIPlanOutputSchema.safeParse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });

    if (firstCheck.success) {
      return normalizePlanOutput(firstCheck.data, clarifyingQuestions, missingFields);
    }

    lastValidationError = firstCheck.error.message;
    console.warn('[AI Plan Generator] First attempt validation failed, retrying once with schema feedback:', lastValidationError);

    // Second attempt with feedback appended
    const retryPrompt = `${basePrompt}\n\nATTENTION: Your previous output failed schema validation with: ${lastValidationError}. Correct all issues and return pure valid JSON matching the schema.`;
    rawText = await callGemini({
      contents: retryPrompt,
      systemInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema: planResponseSchema,
      },
      timeoutMs: 25000,
    });
    parsed = JSON.parse(rawText);

    const secondCheck = AIPlanOutputSchema.parse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });
    return normalizePlanOutput(secondCheck, clarifyingQuestions, missingFields);
  } catch (err: any) {
    console.warn('[AI Plan Generator] AI generation failed, falling back:', err.message);
    const reason = err instanceof GeminiConfigError
      ? 'API_KEY_MISSING'
      : err.name === 'GeminiTimeoutError'
      ? 'TIMEOUT'
      : 'API_ERROR';
    return createFallback(eventInput, reason, clarifyingQuestions, missingFields);
  }
}

function normalizePlanOutput(
  plan: AIPlanOutput,
  clarifyingQuestions: string[],
  missingFields: string[]
): AIPlanOutput {
  if (!plan.clarifying_questions || plan.clarifying_questions.length === 0) {
    plan.clarifying_questions = clarifyingQuestions;
  }
  plan.missing_critical_info = missingFields;
  plan.source = 'ai';
  plan.isFallback = false;

  // Normalize budget to 100%
  if (Array.isArray(plan.budget_allocations) && plan.budget_allocations.length > 0) {
    const totalPct = plan.budget_allocations.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);
    if (Math.abs(totalPct - 100) > 2) {
      plan.budget_allocations = plan.budget_allocations.map((b) => ({
        ...b,
        percentage: Math.round((Number(b.percentage) / totalPct) * 100),
      }));
    }
  }

  return plan;
}

function createFallback(
  input: PlanInput,
  reason: string,
  clarifyingQuestions: string[],
  missingFields: string[]
): AIPlanOutput {
  const fallback = generateFallbackPlan(input);
  fallback.source = 'fallback';
  fallback.fallbackReason = reason;
  fallback.isFallback = true;
  fallback.clarifying_questions = clarifyingQuestions;
  fallback.missing_critical_info = missingFields;
  return fallback;
}

/**
 * Deterministic, rule-based fallback plan for ALL event types.
 */
export function generateFallbackPlan(input: {
  title: string;
  type: string;
  city?: string;
  guestCount?: number;
  themePreference?: string;
  dietaryPreferences?: string[];
  culturalTraditions?: string;
  specialRequests?: string;
}): AIPlanOutput {
  const type = input.type || 'wedding';
  const city = input.city || 'your chosen city';
  const guests = input.guestCount && input.guestCount > 0 ? input.guestCount : 150;
  const theme = input.themePreference || getDefaultThemeForType(type);

  switch (type) {
    case 'wedding':
      return {
        source: 'fallback',
        isFallback: true,
        overview: `A breathtaking wedding celebration in ${city} welcoming ${guests} cherished guests. Blending heritage ceremonies with contemporary elegance, this plan coordinates seamless logistics, vibrant culinary spreads, and elevated hospitality from arrival to grand farewell.`,
        theme,
        venue_requirements: `A luxury venue in ${city} with separate spaces for traditional ceremony mandap, celebratory dining pavilion, and evening reception lawn. Requires a minimum capacity of ${guests + 50} to allow generous aisle flow, air-conditioned green rooms, and dedicated valet parking.`,
        decor_concept: `A cohesive color palette celebrating warm ivory, blush rose, and antique gold brass. Features fresh marigold and jasmine garlands, handcrafted wooden mandap pillars, romantic tungsten fairy-light canopies, and bespoke welcome calligraphic easel.`,
        catering_plan: `Multi-course banquet catering to ${guests} guests. Features welcome tender coconut mocktails, live chaat and hot starter counters, a grand traditional main feast served on banana leaves or copper chafers, and an artisanal dessert lounge with hot filter coffee.`,
        entertainment: `Live classical Nadaswaram or acoustic instrumental ensemble for morning rituals, followed by a curated DJ setup and saxophone sunset set for the evening cocktail reception.`,
        guest_experience: `Seamless digital RSVP check-in, personalized welcome gift baskets with artisanal treats, dedicated golf cart or usher escort for elderly family members, and interactive photo souvenir booth.`,
        preparation_schedule: `Structured 16-week timeline covering venue advance, priest/officiant consultation, bridal couture trials, caterer tasting sessions, and final lighting cues.`,
        risks_contingencies: `Full weatherproof indoor ballroom backup on standby in case of rain, dual 125kVA silent power generators, and an on-site first-aid paramedic station.`,
        budget_allocations: [
          { category: 'Venue & Accommodations', percentage: 32 },
          { category: 'Catering & Dining', percentage: 26 },
          { category: 'Decor & Florals', percentage: 16 },
          { category: 'Photography & Cinematography', percentage: 10 },
          { category: 'Entertainment & Audio', percentage: 6 },
          { category: 'Attire & Styling', percentage: 5 },
          { category: 'Invitations & Favors', percentage: 3 },
          { category: 'Contingency Reserve', percentage: 2 },
        ],
        suggested_tasks: [
          { title: 'Confirm Venue Contract & Book Guest Rooms', phase: 'Initial Planning', priority: 'critical', leadTimeWeeksBefore: 16 },
          { title: 'Tasting Session & Finalize Banana Leaf Virundhu Menu', phase: 'Booking & Vendors', priority: 'high', leadTimeWeeksBefore: 12 },
          { title: 'Mandap Concept Design Approval & Flower Procurements', phase: 'Purchasing & Decor', priority: 'high', leadTimeWeeksBefore: 6 },
          { title: 'Distribute Digital RSVPs & Collect Dietary Constraints', phase: 'Purchasing & Decor', priority: 'medium', leadTimeWeeksBefore: 4 },
          { title: 'Final Guest Count Confirmation to Banquet Manager', phase: 'Final Confirmations', priority: 'critical', leadTimeWeeksBefore: 1 },
          { title: 'Run-of-Show Stage Walkthrough with Family Leads', phase: 'Event Day', priority: 'critical', leadTimeWeeksBefore: 0 },
        ],
        vendor_categories: [
          { category: 'Venue & Banquet Hall', requirements: ['Ocean or garden view', 'Power backup', 'Valet parking'], questionsToAsk: ['Sound curfew hour?', 'Outside caterers permitted?'], estimatedCostPercentage: 32 },
          { category: 'Catering & Beverages', requirements: ['Hygienic prep', 'Uniformed servers', 'Strict vegetarian & Jain capabilities'], questionsToAsk: ['What is the buffer plate policy?'], estimatedCostPercentage: 26 },
          { category: 'Floral & Mandap Decor', requirements: ['Morning-fresh jasmine and marigold', 'Brass urlis', 'Warm lighting'], questionsToAsk: ['Teardown timeline?'], estimatedCostPercentage: 16 },
        ],
        clarifying_questions: [],
        missing_critical_info: [],
      };

    case 'birthday':
      return {
        source: 'fallback',
        isFallback: true,
        overview: `A joy-filled, whimsical birthday milestone in ${city} for ${guests} guests, focusing on playful interactive entertainment, themed custom decor, and memorable family moments.`,
        theme,
        venue_requirements: `A kid-friendly indoor club hall or private garden banquet in ${city} with enclosed play zones, non-slip flooring, and adult lounge seating.`,
        decor_concept: `Organic balloon arches, customized 3D character backdrop, photo-friendly marquee letters, and vibrant color-coordinated table runners.`,
        catering_plan: `Crowd-pleasing menu with interactive mini sliders, pizza bites, fruit skewers, artisanal mocktails, and a showstopper custom tiered birthday cake.`,
        entertainment: `Engaging magician and balloon sculpting artist, interactive dance games, face painting artist, and upbeat background playlist.`,
        guest_experience: `Personalized party favor boxes, instant polaroid snapshot magnets, and a dedicated dessert and candy station.`,
        preparation_schedule: `6-week planning timeline focusing on cake design confirmation, entertainer booking, favor packaging, and digital invitation tracking.`,
        risks_contingencies: `Child-safe play supervision, hypoallergenic face paint, backup indoor area if outdoor lawn experiences weather changes.`,
        budget_allocations: [
          { category: 'Venue Rental', percentage: 28 },
          { category: 'Food & Birthday Cake', percentage: 34 },
          { category: 'Decor & Balloons', percentage: 18 },
          { category: 'Entertainment & Games', percentage: 12 },
          { category: 'Favors & Goodie Bags', percentage: 5 },
          { category: 'Contingency Reserve', percentage: 3 },
        ],
        suggested_tasks: [
          { title: 'Reserve Party Hall & Secure Date', phase: 'Initial Planning', priority: 'critical', leadTimeWeeksBefore: 6 },
          { title: 'Order Custom Themed Birthday Cake', phase: 'Booking & Vendors', priority: 'high', leadTimeWeeksBefore: 3 },
          { title: 'Confirm Magician & Game Host', phase: 'Booking & Vendors', priority: 'high', leadTimeWeeksBefore: 2 },
          { title: 'Assemble Personalized Return Favors', phase: 'Purchasing & Decor', priority: 'medium', leadTimeWeeksBefore: 1 },
          { title: 'Decor Setup & Balloon Arch Installation', phase: 'Event Day', priority: 'critical', leadTimeWeeksBefore: 0 },
        ],
        vendor_categories: [
          { category: 'Party Venue', requirements: ['Kid safety clearance', 'Restroom proximity'], questionsToAsk: ['Are confetti poppers allowed?'], estimatedCostPercentage: 28 },
          { category: 'Bakery & Cake Artist', requirements: ['Custom fondant/buttercream design', 'Eggless option'], questionsToAsk: ['Delivery time window?'], estimatedCostPercentage: 12 },
          { category: 'Balloon & Decor Stylist', requirements: ['Double-stuffed balloons', 'Themed backdrop'], questionsToAsk: ['Setup duration?'], estimatedCostPercentage: 18 },
        ],
        clarifying_questions: [],
        missing_critical_info: [],
      };

    case 'college_fest':
      return {
        source: 'fallback',
        isFallback: true,
        overview: `A high-octane college symposium and cultural festival in ${city} uniting ${guests} student delegates, technical innovators, and artists for competitive tracks, hackathons, and a flagship live concert.`,
        theme,
        venue_requirements: `Campus auditorium and open-air quadrangle amphitheater in ${city} with 10Gbps Wi-Fi backbone, heavy-duty electrical three-phase mains, and dedicated security staging points.`,
        decor_concept: `Cyberpunk and industrial neo-futuristic staging, dynamic moving-head RGB stage beams, digital LED video walls, and neon signpost corridors.`,
        catering_plan: `Multiple campus food stalls, grab-and-go energy packs, VIP faculty luncheon buffet, and hydration kiosks positioned across the festival grounds.`,
        entertainment: `Battle of the bands, celebrity indie rock artist headline performance, EDM DJ pro-night set, and live gaming arena.`,
        guest_experience: `Contactless QR event wristbands, mobile festival guide, digital leaderboards, and exclusive festival merchandise kits.`,
        preparation_schedule: `12-week countdown encompassing faculty NOC clearances, city police permits, artist rider negotiations, and sponsor deliverables.`,
        risks_contingencies: `Staged crowd control barricades, police & student volunteer marshals, dedicated medical ambulance on standby, and fire safety equipment.`,
        budget_allocations: [
          { category: 'Pro-Audio & Concert Stage', percentage: 34 },
          { category: 'Artist & Celebrity Honorarium', percentage: 26 },
          { category: 'Campus Logistics & Security', percentage: 12 },
          { category: 'Food & Delegate Hospitality', percentage: 10 },
          { category: 'Prizes & Trophy Mementos', percentage: 8 },
          { category: 'Marketing & Student Swag', percentage: 6 },
          { category: 'Contingency Reserve', percentage: 4 },
        ],
        suggested_tasks: [
          { title: 'Submit Police Sound NOC & Dean Authorizations', phase: 'Initial Planning', priority: 'critical', leadTimeWeeksBefore: 10 },
          { title: 'Sign Headline Artist Rider & Contract', phase: 'Booking & Vendors', priority: 'critical', leadTimeWeeksBefore: 8 },
          { title: 'Install Line Array Rig & Sound Check in Amphitheater', phase: 'Purchasing & Decor', priority: 'high', leadTimeWeeksBefore: 1 },
          { title: 'Entry Gate Scanner Setup & Crowd Control Briefing', phase: 'Event Day', priority: 'critical', leadTimeWeeksBefore: 0 },
        ],
        vendor_categories: [
          { category: 'Concert Sound & Lighting', requirements: ['Line array sound system', 'Moving head lights', 'Generator backup'], questionsToAsk: ['Sound engineer included?'], estimatedCostPercentage: 34 },
          { category: 'Security & Barricading', requirements: ['Mojo crowd barricades', 'Metal detectors'], questionsToAsk: ['Crew headcount provided?'], estimatedCostPercentage: 12 },
        ],
        clarifying_questions: [],
        missing_critical_info: [],
      };

    default:
      return {
        source: 'fallback',
        isFallback: true,
        overview: `A heartwarming ${type} gathering in ${city} bringing together ${guests} participants for a day of memorable community, shared food, and meaningful celebration.`,
        theme: input.themePreference || 'Warm Festive Earth Tones & Golden Amber',
        venue_requirements: `Accessible community pavilion or park hall in ${city} with ample shaded seating, easy parking, and wheelchair access.`,
        decor_concept: `Sustainable decor utilizing woven jute accents, terracotta planters, warm string festoon lighting, and reusable linen tablecloths.`,
        catering_plan: `Wholesome buffet feast celebrating regional culinary favorites, fresh seasonal refreshments, and sweet treats.`,
        entertainment: `Community speech milestones, acoustic musical performances, and group social activities.`,
        guest_experience: `Warm greeting station, communal seating arrangements fostering conversation, and eco-friendly seed-paper favors.`,
        preparation_schedule: `6-week coordination schedule detailing volunteer assignments, permits, and food preparation logistics.`,
        risks_contingencies: `Rain-safe covered canopy, first aid kit, and trash segregation bins with local municipal pickup.`,
        budget_allocations: [
          { category: 'Venue & Facilities', percentage: 30 },
          { category: 'Catering & Beverages', percentage: 40 },
          { category: 'Decor & Illumination', percentage: 15 },
          { category: 'Sound & Music', percentage: 10 },
          { category: 'Contingency Reserve', percentage: 5 },
        ],
        suggested_tasks: [
          { title: 'Book Community Pavilion & Secure Event Date', phase: 'Initial Planning', priority: 'critical', leadTimeWeeksBefore: 6 },
          { title: 'Confirm Catering Menu & Dietary Preferences', phase: 'Booking & Vendors', priority: 'high', leadTimeWeeksBefore: 3 },
          { title: 'Setup Tables, Seating, and Ambient Festoon Lighting', phase: 'Event Day', priority: 'critical', leadTimeWeeksBefore: 0 },
        ],
        vendor_categories: [
          { category: 'Venue Hall', requirements: ['Restroom access', 'Trash bins'], questionsToAsk: ['Cleanup policy?'], estimatedCostPercentage: 30 },
        ],
        clarifying_questions: [],
        missing_critical_info: [],
      };
  }
}

function getDefaultThemeForType(type: string): string {
  switch (type) {
    case 'wedding': return 'Royal Temple Heritage (Marigold, Jasmine & Antique Brass)';
    case 'birthday': return 'Enchanted Jungle Safari (Sage Green, Ochre & Wooden Textures)';
    case 'college_fest': return 'Cyberpunk Odyssey (Neon Violet, Cyan, and Industrial Black)';
    case 'corporate': return 'Executive Slate & Platinum Modern Minimalist';
    case 'anniversary': return 'Golden Champagne & Ivory Romance';
    default: return 'Festive Celebratory Warmth with Fairy Lights';
  }
}
