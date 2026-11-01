import { z } from 'zod';
import { callGemini, Type, GeminiConfigError } from './geminiClient';

export const SectionRegenerateInputSchema = z.object({
  sectionKey: z.string(),
  sectionTitle: z.string(),
  currentContent: z.string(),
  instruction: z.string().optional().default(''),
  eventContext: z.object({
    title: z.string(),
    type: z.string(),
    city: z.string().optional().default(''),
    guestCount: z.number().optional().default(100),
    themePreference: z.string().optional().default(''),
    totalBudgetMinor: z.number().optional().default(0),
    currency: z.string().optional().default('INR'),
  }),
});

export type SectionRegenerateInput = z.infer<typeof SectionRegenerateInputSchema>;

export const SectionRegenerateOutputSchema = z.object({
  source: z.enum(['ai', 'fallback']).default('ai'),
  fallbackReason: z.string().optional(),
  isFallback: z.boolean().default(false),
  updatedContent: z.string(),
  changeSummary: z.string(),
});

export type SectionRegenerateOutput = z.infer<typeof SectionRegenerateOutputSchema>;

const sectionSchema = {
  type: Type.OBJECT,
  properties: {
    updatedContent: {
      type: Type.STRING,
      description: 'The complete revised section text, professionally structured with bullet points and bold highlights.',
    },
    changeSummary: {
      type: Type.STRING,
      description: 'A 1-sentence summary of the specific enhancements made.',
    },
  },
  required: ['updatedContent', 'changeSummary'],
};

export async function regenerateSection(rawInput: unknown): Promise<SectionRegenerateOutput> {
  const params = SectionRegenerateInputSchema.parse(rawInput);

  const systemInstruction = `You are a master event producer and creative director revising an event blueprint section.
Strict Constraints:
1. Revise the section content thoughtfully based on the user's specific instruction while preserving the core event context.
2. Ground all updates in the target city (${params.eventContext.city || 'unspecified'}), guest count (${params.eventContext.guestCount}), and overall theme.
3. Return strictly valid JSON adhering to the schema.
4. Keep the writing evocative, actionable, and free of generic fluff.`;

  const prompt = `Event Context:
Event Title: ${params.eventContext.title}
Event Type: ${params.eventContext.type}
City: ${params.eventContext.city}
Expected Headcount: ${params.eventContext.guestCount}
Theme: ${params.eventContext.themePreference || 'Classic'}

Section to Revise: "${params.sectionTitle}" (${params.sectionKey})

Current Content:
"""
${params.currentContent}
"""

User Revision Instruction:
"${params.instruction ? params.instruction.trim() : 'Refine this section with greater operational clarity, elevated styling, and practical vendor considerations.'}"

Generate the revised content and a 1-sentence summary of what changed.`;

  try {
    let rawText = '';
    try {
      rawText = await callGemini({
        contents: prompt,
        systemInstruction,
        config: {
          responseMimeType: 'application/json',
          responseSchema: sectionSchema,
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
    const firstCheck = SectionRegenerateOutputSchema.safeParse({
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
        responseSchema: sectionSchema,
      },
      timeoutMs: 20000,
    });
    parsed = JSON.parse(rawText);
    return SectionRegenerateOutputSchema.parse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });
  } catch (err: any) {
    console.warn('[Regenerate Section] Gemini call failed, returning fallback:', err.message);
    const reason = err instanceof GeminiConfigError
      ? 'API_KEY_MISSING'
      : err.name === 'GeminiTimeoutError'
      ? 'TIMEOUT'
      : 'API_ERROR';
    return createFallback(params, reason);
  }
}

function createFallback(params: SectionRegenerateInput, reason: string): SectionRegenerateOutput {
  const fallback = generateFallbackSectionRevision(params);
  fallback.source = 'fallback';
  fallback.fallbackReason = reason;
  fallback.isFallback = true;
  return fallback;
}

function generateFallbackSectionRevision(params: SectionRegenerateInput): SectionRegenerateOutput {
  const instruction = params.instruction?.trim();
  const addition = instruction
    ? `\n\n• Calibrated for "${instruction}": Emphasizing refined vendor coordination in ${params.eventContext.city || 'the target area'}, enhanced comfort for ${params.eventContext.guestCount} guests, and optimized execution flow.`
    : `\n\n• Refined for enhanced operational flow: Polished timing milestones and vendor checklists for ${params.eventContext.city || 'the venue'}.`;

  return {
    source: 'fallback',
    isFallback: true,
    updatedContent: `${params.currentContent}${addition}`,
    changeSummary: instruction ? `Revised: ${instruction}` : 'Updated with improved flow and vendor considerations',
  };
}
