import { z } from 'zod';
import { callGemini, Type, GeminiConfigError } from './geminiClient';

export const BudgetSavingsSchema = z.object({
  source: z.enum(['ai', 'fallback']).default('ai'),
  fallbackReason: z.string().optional(),
  isFallback: z.boolean().default(false),
  overallAssessment: z.string(),
  suggestions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      estimatedSavingMinor: z.number(), // in integer minor units
      tradeOff: z.string(),
    })
  ),
});

export type BudgetSavingsOutput = z.infer<typeof BudgetSavingsSchema>;

const savingsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overallAssessment: {
      type: Type.STRING,
      description: 'A 2-3 sentence strategic executive assessment of the current spending health and risk profile.',
    },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          estimatedSavingMinor: {
            type: Type.INTEGER,
            description: 'Estimated savings in integer minor currency units (paise/cents, 100 minor units = 1 major unit).',
          },
          tradeOff: { type: Type.STRING },
        },
        required: ['id', 'title', 'description', 'category', 'estimatedSavingMinor', 'tradeOff'],
      },
    },
  },
  required: ['overallAssessment', 'suggestions'],
};

export async function generateBudgetSavings(params: {
  eventTitle: string;
  eventType: string;
  guestCount: number;
  totalBudgetMinor: number;
  currency: string;
  categorySpending: { category: string; targetMinor: number; actualMinor: number }[];
}): Promise<BudgetSavingsOutput> {
  const currencySymbol = params.currency === 'INR' ? '₹' : '$';
  const totalMajor = Math.round(params.totalBudgetMinor / 100);

  const systemInstruction = `You are a strategic event financial advisor and budget auditor.
Analyze the event's computed financial figures and propose 2 to 4 tangible, mathematically sound cost optimizations.
Strict Constraints:
1. All mathematical calculations must be realistic and grounded in the supplied category numbers.
2. Estimated savings MUST be returned in integer minor units (paise/cents, where 1 major unit = 100 minor units).
3. Clearly state the practical tradeoff of each saving (e.g. requires volunteer effort, simpler lighting, day-of adjustments).
4. Return strictly valid JSON matching the schema.`;

  const prompt = `Event: ${params.eventTitle} (${params.eventType})
Guest Count: ${params.guestCount}
Total Budget: ${currencySymbol}${totalMajor.toLocaleString()} (${params.totalBudgetMinor} minor units in ${params.currency})

Category Spendings:
${params.categorySpending
  .map(
    (c) =>
      `- ${c.category}: Target ${currencySymbol}${Math.round(c.targetMinor / 100).toLocaleString()} (${c.targetMinor} minor units), Actual ${currencySymbol}${Math.round(c.actualMinor / 100).toLocaleString()} (${c.actualMinor} minor units)`
  )
  .join('\n')}

Generate strategic, concrete cost savings with realistic minor unit values.`;

  try {
    let rawText = '';
    try {
      rawText = await callGemini({
        contents: prompt,
        systemInstruction,
        config: {
          responseMimeType: 'application/json',
          responseSchema: savingsResponseSchema,
        },
        timeoutMs: 22000,
      });
    } catch (err: any) {
      if (err instanceof GeminiConfigError) {
        return createFallback(params, 'API_KEY_MISSING');
      }
      throw err;
    }

    let parsed = JSON.parse(rawText);
    const firstCheck = BudgetSavingsSchema.safeParse({
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
        responseSchema: savingsResponseSchema,
      },
      timeoutMs: 20000,
    });
    parsed = JSON.parse(rawText);
    return BudgetSavingsSchema.parse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });
  } catch (err: any) {
    console.warn('[Budget Savings] Gemini call failed, returning fallback:', err.message);
    const reason = err instanceof GeminiConfigError
      ? 'API_KEY_MISSING'
      : err.name === 'GeminiTimeoutError'
      ? 'TIMEOUT'
      : 'API_ERROR';
    return createFallback(params, reason);
  }
}

function createFallback(
  params: {
    totalBudgetMinor: number;
    categorySpending: { category: string; targetMinor: number; actualMinor: number }[];
  },
  reason: string
): BudgetSavingsOutput {
  const fallback = generateFallbackSavings(params);
  fallback.source = 'fallback';
  fallback.fallbackReason = reason;
  fallback.isFallback = true;
  return fallback;
}

function generateFallbackSavings(params: {
  totalBudgetMinor: number;
  categorySpending: { category: string; targetMinor: number; actualMinor: number }[];
}): BudgetSavingsOutput {
  const highestCategory = params.categorySpending.reduce(
    (prev, curr) => (curr.actualMinor > prev.actualMinor ? curr : prev),
    params.categorySpending[0] || { category: 'Catering & Dining', targetMinor: 1000000, actualMinor: 1000000 }
  );

  const saving1 = Math.round(highestCategory.actualMinor * 0.12);
  const saving2 = Math.round(params.totalBudgetMinor * 0.04);

  return {
    source: 'fallback',
    isFallback: true,
    overallAssessment: `The event budget has strategic opportunities to optimize expenses in ${highestCategory.category} without compromising guest hospitality.`,
    suggestions: [
      {
        id: `sav_${Date.now()}_1`,
        title: `Optimize ${highestCategory.category} Layout & Direct Supplier Contracts`,
        description: `Streamline course offerings and negotiate direct supplier rates, reducing redundant service fees.`,
        category: highestCategory.category,
        estimatedSavingMinor: saving1,
        tradeOff: 'Requires early headcount freeze 10 days before the event.',
      },
      {
        id: `sav_${Date.now()}_2`,
        title: 'Transition Invitations & Table Schedules to Digital Channels',
        description: 'Distribute interactive mobile invites with RSVP tracking and reserve luxury print only for VIPs.',
        category: 'Invitations & Favors',
        estimatedSavingMinor: saving2,
        tradeOff: 'Minimal physical keepsake items for general attendees.',
      },
    ],
  };
}
