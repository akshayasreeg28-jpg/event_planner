import { z } from 'zod';
import { callGemini, Type, GeminiConfigError } from './geminiClient';

export const MenuItemSchema = z.object({
  id: z.string(),
  course: z.enum(['welcome_drinks', 'starters', 'mains', 'desserts', 'late_night']),
  name: z.string(),
  description: z.string(),
  isVegetarian: z.boolean(),
  isJainFriendly: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isHalal: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
  perHeadPortionGramsOrUnits: z.number(), // standard benchmark portion
  unit: z.string(), // grams, ml, pieces
});

export const MenuResponseSchema = z.object({
  source: z.enum(['ai', 'fallback']).default('ai'),
  fallbackReason: z.string().optional(),
  isFallback: z.boolean().default(false),
  themeTitle: z.string(),
  estimatedCostPerPlateMinor: z.number(), // in integer minor units
  items: z.array(MenuItemSchema),
  dietaryHighlights: z.string(),
});

export type MenuResponse = z.infer<typeof MenuResponseSchema>;

const menuSchema = {
  type: Type.OBJECT,
  properties: {
    themeTitle: { type: Type.STRING, description: 'Evocative title for the dining spread.' },
    estimatedCostPerPlateMinor: {
      type: Type.INTEGER,
      description: 'Estimated cost per plate in integer minor currency units (paise/cents, 100 minor units = 1 unit).',
    },
    dietaryHighlights: { type: Type.STRING, description: 'Summary of how dietary needs and allergies are covered.' },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          course: {
            type: Type.STRING,
            description: 'One of: welcome_drinks, starters, mains, desserts, late_night',
          },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          isVegetarian: { type: Type.BOOLEAN },
          isJainFriendly: { type: Type.BOOLEAN },
          isVegan: { type: Type.BOOLEAN },
          isHalal: { type: Type.BOOLEAN },
          isGlutenFree: { type: Type.BOOLEAN },
          allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
          perHeadPortionGramsOrUnits: { type: Type.NUMBER },
          unit: { type: Type.STRING, description: 'grams, ml, or pieces' },
        },
        required: ['id', 'course', 'name', 'description', 'isVegetarian', 'perHeadPortionGramsOrUnits', 'unit'],
      },
    },
  },
  required: ['themeTitle', 'estimatedCostPerPlateMinor', 'dietaryHighlights', 'items'],
};

export async function generateEventMenu(params: {
  eventType: string;
  regionOrCuisine: string;
  season: string;
  timeOfDay: string;
  dietaryRules: string[];
  guestCount: number;
}): Promise<MenuResponse> {
  const systemInstruction = `You are an executive chef and luxury banquet catering designer.
Propose a cohesive, delicious, and culturally authentic menu with realistic per-head portion sizes (grams, ml, or piece units).
Ensure strict adherence to dietary preferences and named regional dishes.
Provide an estimated cost per plate in integer minor units (e.g. 85000 = ₹850.00).
Return pure JSON adhering strictly to the schema.`;

  const prompt = `Design an authentic, concrete menu for:
Event: ${params.eventType}
Region/Cuisine: ${params.regionOrCuisine || 'Pan-Indian Gourmet'}
Season: ${params.season || 'Autumn'}
Meal Time: ${params.timeOfDay || 'Dinner'}
Dietary Constraints: ${params.dietaryRules.join(', ') || 'Vegetarian and Vegan Friendly'}
Guest Count: ${params.guestCount}

Provide 4 to 6 signature dishes spanning welcome drinks, starters, mains, and desserts with portion quantities and units.`;

  try {
    let rawText = '';
    try {
      rawText = await callGemini({
        contents: prompt,
        systemInstruction,
        config: {
          responseMimeType: 'application/json',
          responseSchema: menuSchema,
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
    const firstCheck = MenuResponseSchema.safeParse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });

    if (firstCheck.success) {
      return firstCheck.data;
    }

    // Retry once with schema error feedback
    const retryPrompt = `${prompt}\n\nATTENTION: Previous response failed schema validation: ${firstCheck.error.message}. Return valid JSON adhering strictly to the schema.`;
    rawText = await callGemini({
      contents: retryPrompt,
      systemInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema: menuSchema,
      },
      timeoutMs: 20000,
    });
    parsed = JSON.parse(rawText);
    return MenuResponseSchema.parse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });
  } catch (err: any) {
    console.warn('[Menu Generator] Gemini call failed, returning fallback:', err.message);
    const reason = err instanceof GeminiConfigError
      ? 'API_KEY_MISSING'
      : err.name === 'GeminiTimeoutError'
      ? 'TIMEOUT'
      : 'API_ERROR';
    return createFallback(params, reason);
  }
}

function createFallback(params: { eventType: string; guestCount: number }, reason: string): MenuResponse {
  const fallback = generateFallbackMenu(params);
  return {
    ...fallback,
    source: 'fallback',
    fallbackReason: reason,
    isFallback: true,
  };
}

function generateFallbackMenu(params: { eventType: string; guestCount: number }): {
  themeTitle: string;
  estimatedCostPerPlateMinor: number;
  dietaryHighlights: string;
  items: z.infer<typeof MenuItemSchema>[];
} {
  return {
    themeTitle: 'Royal Botanical Harvest Banquet',
    estimatedCostPerPlateMinor: 95000, // ₹950.00
    dietaryHighlights: 'Full coverage for Vegetarian, Jain (no garlic/root), and Gluten-free guests.',
    items: [
      {
        id: `mn_${Date.now()}_1`,
        course: 'welcome_drinks',
        name: 'Chilled Kokum & Mint Sparkler',
        description: 'Cold-pressed wild kokum with crushed fresh mint, roasted cumin, and black salt in salt-rimmed tumblers.',
        isVegetarian: true,
        isVegan: true,
        isJainFriendly: true,
        isGlutenFree: true,
        perHeadPortionGramsOrUnits: 180,
        unit: 'ml',
      },
      {
        id: `mn_${Date.now()}_2`,
        course: 'starters',
        name: 'Tandoori Truffle Paneer Tikka & Lotus Root Crisp',
        description: 'Artisanal malai paneer marinated in yellow mustard and white truffle oil, served with wild mint dip.',
        isVegetarian: true,
        isJainFriendly: true,
        isGlutenFree: true,
        allergens: ['Dairy'],
        perHeadPortionGramsOrUnits: 3,
        unit: 'pieces',
      },
      {
        id: `mn_${Date.now()}_3`,
        course: 'mains',
        name: 'Subz Dum Biryani with Burani Raita',
        description: 'Fragrant aged basmati rice layered with seasonal farm vegetables, saffron, and whole spices in sealed clay handis.',
        isVegetarian: true,
        isJainFriendly: false,
        isGlutenFree: true,
        perHeadPortionGramsOrUnits: 400,
        unit: 'grams',
      },
      {
        id: `mn_${Date.now()}_4`,
        course: 'desserts',
        name: 'Warm Baked Gulab Jamun with Pistachio Rabri',
        description: 'Slow-simmered khoya dumplings baked with saffron infused reduced milk and Iranian slivered pistachios.',
        isVegetarian: true,
        isJainFriendly: true,
        allergens: ['Dairy', 'Nuts'],
        perHeadPortionGramsOrUnits: 120,
        unit: 'grams',
      },
    ],
  };
}
