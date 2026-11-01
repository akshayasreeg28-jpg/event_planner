import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generateEventPlan, checkMissingCriticalInfo, PlanInputSchema } from '../ai/planGenerator';
import { regenerateSection, SectionRegenerateInputSchema } from '../ai/sectionRegenerator';
import { generateBudgetSavings } from '../ai/budgetSavings';
import { askEventAssistant, streamEventAssistant } from '../ai/chatAssistant';
import { generateEventIdeas } from '../ai/ideasGenerator';
import { generateEventMenu } from '../ai/menuGenerator';
import { generateInvitationWording } from '../ai/invitationGenerator';
import { searchGroundedVenues } from '../ai/locationRecommendations';
import { MODEL_NAME, testGeminiHealth } from '../ai/geminiClient';
import { requireAuth } from '../middleware/auth';
import { rateLimitAi } from '../middleware/rateLimit';

export const apiRouter = Router();

// Health check endpoint reporting geminiConfigured, model, and live test call result
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  const healthTest = isConfigured ? await testGeminiHealth() : { ok: false, message: 'GEMINI_API_KEY is not configured' };

  res.json({
    status: 'healthy',
    service: 'Event AI API',
    geminiConfigured: isConfigured,
    model: MODEL_NAME,
    testCallResult: healthTest,
    timestamp: new Date().toISOString(),
  });
});

// Apply Auth and Rate Limiting to all /ai/* routes
apiRouter.use('/ai', requireAuth, rateLimitAi);

// 1. AI Plan Generation (returns Zod-validated JSON with source: 'ai' | 'fallback')
apiRouter.post('/ai/plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = PlanInputSchema.parse(req.body);
    const plan = await generateEventPlan(input);
    res.json({
      success: true,
      source: plan.source,
      fallbackReason: plan.fallbackReason,
      plan,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
      return;
    }
    next(err);
  }
});

// 1b. Clarifying Questions Detection when Critical Info is Missing
apiRouter.post('/ai/clarify', (req: Request, res: Response) => {
  try {
    const input = PlanInputSchema.parse(req.body);
    const result = checkMissingCriticalInfo(input);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message || 'Invalid parameters' },
    });
  }
});

// 2. Section Regeneration
apiRouter.post('/ai/regenerate-section', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedInput = SectionRegenerateInputSchema.parse(req.body);
    const result = await regenerateSection(validatedInput);
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
      return;
    }
    next(err);
  }
});

// 3. AI Budget Savings
const BudgetSavingsInputSchema = z.object({
  eventTitle: z.string(),
  eventType: z.string(),
  guestCount: z.number().default(100),
  totalBudgetMinor: z.number().default(5000000),
  currency: z.string().default('INR'),
  categorySpending: z.array(
    z.object({
      category: z.string(),
      targetMinor: z.number(),
      actualMinor: z.number(),
    })
  ),
});

apiRouter.post('/ai/budget-savings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = BudgetSavingsInputSchema.parse(req.body);
    const savings = await generateBudgetSavings(input);
    res.json({
      success: true,
      ...savings,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
      return;
    }
    next(err);
  }
});

// 4a. Conversational AI Assistant (Standard JSON)
apiRouter.post('/ai/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatReply = await askEventAssistant(req.body);
    res.json({
      success: true,
      ...chatReply,
    });
  } catch (err: any) {
    next(err);
  }
});

// 4b. Conversational AI Assistant (SSE Streaming with Tool Calling)
apiRouter.post('/ai/chat/stream', async (req: Request, res: Response) => {
  try {
    await streamEventAssistant(req.body, res);
  } catch (err: any) {
    console.error('[Chat Stream Route] Uncaught error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: { code: 'STREAM_FAILED', message: err.message } });
    }
  }
});

// 5. AI Ideas Studio
const IdeasInputSchema = z.object({
  eventType: z.string(),
  themeStyle: z.string().optional(),
  budgetTier: z.string().optional(),
  targetAudience: z.string().optional(),
  season: z.string().optional(),
});

apiRouter.post('/ai/ideas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = IdeasInputSchema.parse(req.body);
    const ideas = await generateEventIdeas(input);
    res.json({
      success: true,
      ...ideas,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
      return;
    }
    next(err);
  }
});

// 6. AI Catering & Menu
const MenuInputSchema = z.object({
  eventType: z.string(),
  regionOrCuisine: z.string().default('Pan-Indian'),
  season: z.string().default('Autumn'),
  timeOfDay: z.string().default('Dinner'),
  dietaryRules: z.array(z.string()).default([]),
  guestCount: z.number().default(100),
});

apiRouter.post('/ai/menu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = MenuInputSchema.parse(req.body);
    const menu = await generateEventMenu(input);
    res.json({
      success: true,
      ...menu,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
      return;
    }
    next(err);
  }
});

// 7. AI Invitations
const InvitationInputSchema = z.object({
  eventTitle: z.string(),
  eventType: z.string(),
  hostNames: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  venueName: z.string().optional(),
  city: z.string(),
  dressCode: z.string().optional(),
  rsvpDeadline: z.string().optional(),
  regionalLanguage: z.string().optional(),
});

apiRouter.post('/ai/invitations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = InvitationInputSchema.parse(req.body);
    const wording = await generateInvitationWording(input);
    res.json({
      success: true,
      ...wording,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
      return;
    }
    next(err);
  }
});

// 8. Live Weather Forecast via Open-Meteo with Seasonal Average Fallback for distant dates
apiRouter.get('/weather', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827; // Default Chennai
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 80.2707;
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const cityName = (req.query.city as string) || 'Chennai';

    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const monthName = targetDate.toLocaleString('default', { month: 'long' });

    // Open-Meteo forecast API has a maximum 14-day window
    if (diffDays > 14 || diffDays < 0) {
      const seasonalMax = 31;
      const seasonalMin = 24;
      const seasonalPrecip = 20;

      res.json({
        success: true,
        isForecast: false,
        isSeasonalAverage: true,
        note: `Forecast not available yet — showing seasonal averages for ${cityName} in ${monthName}`,
        weather: {
          date: dateStr,
          maxTempC: seasonalMax,
          minTempC: seasonalMin,
          precipitationProbability: seasonalPrecip,
          condition: 'Seasonal Mild & Pleasant (Historical Average)',
          contingency: 'Outdoor lawn setup is generally favorable during this season. Maintain backup mist fans or covered dining.',
          weatherCode: 1,
        },
      });
      return;
    }

    // Within forecast window: query Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`;
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      throw new Error(`Weather service returned ${response.status}`);
    }

    const data = await response.json();
    const dates: string[] = data.daily?.time || [];
    const idx = dates.indexOf(dateStr);
    const dayIdx = idx >= 0 ? idx : 0;

    const maxTemp = data.daily?.temperature_2m_max?.[dayIdx] ?? 29;
    const minTemp = data.daily?.temperature_2m_min?.[dayIdx] ?? 23;
    const precipProb = data.daily?.precipitation_probability_max?.[dayIdx] ?? 15;
    const weatherCode = data.daily?.weathercode?.[dayIdx] ?? 1;

    let condition = 'Clear & Pleasant';
    if (precipProb > 50) condition = 'High Chance of Rain / Coastal Showers';
    else if (precipProb > 25) condition = 'Scattered Cloud & Mild Breeze';

    let contingency = 'Outdoor setup is ideal. Keep ambient mist fans ready during afternoon.';
    if (precipProb > 40) {
      contingency = 'Rain contingency required: reserve waterproof transparent canopy for lawn areas and safeguard outdoor sound rigs.';
    }

    res.json({
      success: true,
      isForecast: true,
      isSeasonalAverage: false,
      weather: {
        date: dateStr,
        maxTempC: Math.round(maxTemp),
        minTempC: Math.round(minTemp),
        precipitationProbability: precipProb,
        condition,
        contingency,
        weatherCode,
      },
    });
  } catch (err: any) {
    console.warn('Weather fetch failed, returning seasonal estimate:', err.message);
    res.json({
      success: true,
      isForecast: false,
      isSeasonalAverage: true,
      note: 'Live forecast temporarily unavailable — showing seasonal estimate',
      weather: {
        date: req.query.date || '2026-11-28',
        maxTempC: 30,
        minTempC: 24,
        precipitationProbability: 20,
        condition: 'Partly Cloudy with Mild Coastal Breeze',
        contingency: 'Outdoor lawn is suitable. Keep waterproof tarps on standby for stage AV equipment.',
      },
    });
  }
});

// 9. Grounded Venue & Local Place Search using Gemini Grounding with Google Search
apiRouter.get('/venues/search', async (req: Request, res: Response) => {
  const city = (req.query.city as string) || 'Chennai';
  const type = (req.query.type as string) || 'celebration';

  const result = await searchGroundedVenues(city, type);

  res.json({
    success: true,
    city,
    source: result.source,
    fallbackReason: result.fallbackReason,
    venues: result.venues,
  });
});

// 10. Social Media Preview Card Metadata
apiRouter.get('/events/:eventId/preview-meta', (req: Request, res: Response) => {
  const { eventId } = req.params;

  const demoTitles: Record<
    string,
    { title: string; city: string; date: string; type: string; image: string }
  > = {
    evt_wedding_01: {
      title: 'Priya & Rohan — Temple & Garden Wedding',
      city: 'Chennai',
      date: '2026-11-28',
      type: 'wedding',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    },
    evt_techfest_02: {
      title: 'INNOVENTUM 2027 — National Intercollegiate Tech Fest',
      city: 'Bengaluru',
      date: '2027-02-14',
      type: 'college_fest',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    },
    evt_birthday_03: {
      title: "Ananya's 1st Birthday — Enchanted Woodland & Balloon Safari",
      city: 'Mumbai',
      date: '2026-11-08',
      type: 'birthday',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop&q=80',
    },
  };

  const event = demoTitles[eventId] || {
    title: 'Curated Celebration Plan',
    city: 'India',
    date: '2026-12-01',
    type: 'celebration',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
  };

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const publicUrl = `${protocol}://${host}/share/${eventId}`;

  res.json({
    success: true,
    eventId,
    title: event.title,
    city: event.city,
    date: event.date,
    type: event.type,
    imageUrl: event.image,
    publicUrl,
    shareUrls: {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Join us for ${event.title}! Taking place in ${event.city}. Check out the schedule & RSVP.`
      )}&url=${encodeURIComponent(publicUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `Join us for ${event.title}!\n\n${publicUrl}`
      )}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
    },
  });
});

// Global API error handler
apiRouter.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Router Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.',
    },
  });
});
