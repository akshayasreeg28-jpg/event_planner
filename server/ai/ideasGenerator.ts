import { z } from 'zod';
import { callGemini, Type, GeminiConfigError } from './geminiClient';

export const IdeaConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['theme', 'decor', 'games_activities', 'return_gifts', 'eco_friendly', 'budget_hack']),
  summary: z.string(),
  details: z.string(),
  colorPalette: z
    .array(
      z.object({
        name: z.string(),
        hex: z.string(),
      })
    )
    .optional(),
  costImpact: z.enum(['low', 'medium', 'high', 'budget_saver']),
  estimatedSavingOrCost: z.string(),
});

export const IdeasOutputSchema = z.object({
  source: z.enum(['ai', 'fallback']).default('ai'),
  fallbackReason: z.string().optional(),
  isFallback: z.boolean().default(false),
  concepts: z.array(IdeaConceptSchema),
});

export type IdeasOutput = z.infer<typeof IdeasOutputSchema>;

const ideasResponseSchema = {
  type: Type.OBJECT,
  properties: {
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: 'One of: theme, decor, games_activities, return_gifts, eco_friendly, budget_hack',
          },
          summary: { type: Type.STRING },
          details: { type: Type.STRING },
          colorPalette: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                hex: { type: Type.STRING },
              },
              required: ['name', 'hex'],
            },
          },
          costImpact: {
            type: Type.STRING,
            description: 'One of: low, medium, high, budget_saver',
          },
          estimatedSavingOrCost: { type: Type.STRING },
        },
        required: ['id', 'title', 'category', 'summary', 'details', 'costImpact', 'estimatedSavingOrCost'],
      },
    },
  },
  required: ['concepts'],
};

export async function generateEventIdeas(params: {
  eventType: string;
  themeStyle?: string;
  budgetTier?: string;
  targetAudience?: string;
  season?: string;
}): Promise<IdeasOutput> {
  const systemInstruction = `You are a visionary event stylist, creative director, and party designer.
Generate 4 unique, memorable, and executable event ideas covering themes, decor concepts, games, return gifts, eco-friendly practices, and budget hacks.
Avoid generic AI clichés (no plastic favors, no floating balloons clichés).
Provide exact 6-character hex swatches for palettes (#RRGGBB).
Return pure JSON adhering strictly to the schema.`;

  const prompt = `Generate 4 distinct, concrete event concepts for:
Event Type: ${params.eventType}
Style: ${params.themeStyle || 'Modern refined'}
Budget Tier: ${params.budgetTier || 'Balanced premium'}
Audience / Age Group: ${params.targetAudience || 'Diverse family and friends'}
Season / Climate: ${params.season || 'Autumn / Winter'}

Categories to consider: theme, decor, games_activities, return_gifts, eco_friendly, budget_hack.`;

  try {
    let rawText = '';
    try {
      rawText = await callGemini({
        contents: prompt,
        systemInstruction,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ideasResponseSchema,
        },
        timeoutMs: 25000,
      });
    } catch (err: any) {
      if (err instanceof GeminiConfigError) {
        return createFallback(params, 'API_KEY_MISSING');
      }
      throw err;
    }

    let parsed = JSON.parse(rawText);
    const firstCheck = IdeasOutputSchema.safeParse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });

    if (firstCheck.success) {
      return firstCheck.data;
    }

    // Retry once with error feedback
    const retryPrompt = `${prompt}\n\nATTENTION: Previous response failed schema validation: ${firstCheck.error.message}. Return valid JSON adhering strictly to the schema.`;
    rawText = await callGemini({
      contents: retryPrompt,
      systemInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema: ideasResponseSchema,
      },
      timeoutMs: 20000,
    });
    parsed = JSON.parse(rawText);
    return IdeasOutputSchema.parse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });
  } catch (err: any) {
    console.warn('[Ideas Studio] Gemini call failed, returning fallback:', err.message);
    const reason = err instanceof GeminiConfigError
      ? 'API_KEY_MISSING'
      : err.name === 'GeminiTimeoutError'
      ? 'TIMEOUT'
      : 'API_ERROR';
    return createFallback(params, reason);
  }
}

function createFallback(params: { eventType: string; themeStyle?: string }, reason: string): IdeasOutput {
  const fallback = generateFallbackIdeas(params);
  return {
    ...fallback,
    source: 'fallback',
    fallbackReason: reason,
    isFallback: true,
  };
}

function generateFallbackIdeas(params: { eventType: string; themeStyle?: string }): { concepts: z.infer<typeof IdeaConceptSchema>[] } {
  return {
    concepts: [
      {
        id: `idea_${Date.now()}_1`,
        title: 'Botanical Living Lounge with Heritage Terracotta',
        category: 'decor',
        summary: 'Potted jasmine, dwarf palms, and fragrant rosemary in terracotta planters instead of cut flowers.',
        details: 'Guests take home the potted botanicals at the conclusion of the event as sustainable living keepsakes.',
        colorPalette: [
          { name: 'Sage Green', hex: '#8A9A86' },
          { name: 'Terracotta Rust', hex: '#C86D51' },
          { name: 'Warm Ivory', hex: '#FAF6EE' },
          { name: 'Deep Olive', hex: '#4B5320' },
        ],
        costImpact: 'budget_saver',
        estimatedSavingOrCost: 'Saves ~20% vs ephemeral floral installations',
      },
      {
        id: `idea_${Date.now()}_2`,
        title: 'Interactive Audio Guestbook & Memory Recording Station',
        category: 'games_activities',
        summary: 'A vintage rotary telephone booth where guests pick up the receiver to record voice stories and toasts.',
        details: 'Recordings are digitized into a master vinyl audio podcast delivered to the hosts post-event.',
        costImpact: 'medium',
        estimatedSavingOrCost: 'Rental approx. ₹8,000 - ₹12,000',
      },
      {
        id: `idea_${Date.now()}_3`,
        title: 'Artisanal Single-Origin Coffee & Spice Blending Bar',
        category: 'return_gifts',
        summary: 'A live custom blending bar where guests curate bespoke coffee beans or organic chai spices.',
        details: 'Packaged in reusable unbleached linen pouches with custom stamped calligraphed nametags.',
        costImpact: 'medium',
        estimatedSavingOrCost: 'Approx. ₹180 - ₹250 per guest',
      },
      {
        id: `idea_${Date.now()}_4`,
        title: 'Zero-Waste Banana Leaf & Copper Vessel Service Architecture',
        category: 'eco_friendly',
        summary: '100% compostable meal service diverting banquet waste directly to local community compost.',
        details: 'Replaces plastic plates and disposable bottles with copper vessels and fresh plantain leaves.',
        costImpact: 'budget_saver',
        estimatedSavingOrCost: 'Reduces banquet cleanup and trash disposal fees by 35%',
      },
    ],
  };
}
