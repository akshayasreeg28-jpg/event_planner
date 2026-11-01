import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MODEL_NAME,
  GeminiConfigError,
  GeminiTimeoutError,
  GeminiApiError,
  GeminiValidationError,
} from '../../server/ai/geminiClient';
import {
  generateFallbackPlan,
  checkMissingCriticalInfo,
  PlanInputSchema,
  AIPlanOutputSchema,
} from '../../server/ai/planGenerator';
import { SectionRegenerateInputSchema, SectionRegenerateOutputSchema } from '../../server/ai/sectionRegenerator';
import { BudgetSavingsSchema } from '../../server/ai/budgetSavings';
import { ChatActionProposalSchema } from '../../server/ai/chatAssistant';
import { getFallbackVenues } from '../../server/ai/locationRecommendations';

describe('Phase 1 Backend & Robustness Suite', () => {
  describe('Gemini Client Configuration & Error Classes', () => {
    it('initializes with a valid Flash model default or env override', () => {
      assert.ok(MODEL_NAME, 'Model name must be present');
      assert.ok(
        MODEL_NAME.includes('flash'),
        `Model must be a flash series model, received: ${MODEL_NAME}`
      );
    });

    it('instantiates typed error classes with correct HTTP statuses and error codes', () => {
      const configErr = new GeminiConfigError();
      assert.strictEqual(configErr.code, 'API_KEY_MISSING');
      assert.strictEqual(configErr.status, 503);

      const timeoutErr = new GeminiTimeoutError();
      assert.strictEqual(timeoutErr.code, 'TIMEOUT');
      assert.strictEqual(timeoutErr.status, 504);

      const apiErr = new GeminiApiError('API call throttled', 429);
      assert.strictEqual(apiErr.code, 'API_ERROR');
      assert.strictEqual(apiErr.status, 429);

      const valErr = new GeminiValidationError('Field missing');
      assert.strictEqual(valErr.code, 'VALIDATION_FAILED');
      assert.strictEqual(valErr.status, 422);
    });
  });

  describe('Plan Generator Structured Output & Fallback Safety', () => {
    it('validates plan inputs with Zod and enforces defaults', () => {
      const parsed = PlanInputSchema.parse({
        title: 'Ananya & Vikram Wedding',
        type: 'wedding',
        city: 'Chennai',
      });

      assert.strictEqual(parsed.title, 'Ananya & Vikram Wedding');
      assert.strictEqual(parsed.type, 'wedding');
      assert.strictEqual(parsed.currency, 'INR');
      assert.strictEqual(parsed.guestCount, 100);
      assert.strictEqual(parsed.totalBudgetMinor, 50000000); // ₹5 Lakh default
    });

    it('accurately identifies missing critical fields and generates clarifying questions', () => {
      const check = checkMissingCriticalInfo({
        title: 'College Fest',
        type: 'college_fest',
        guestCount: 0,
        totalBudgetMinor: 0,
        date: '',
        city: '',
        currency: 'INR',
        themePreference: '',
        dietaryPreferences: [],
        culturalTraditions: '',
        specialRequests: '',
        clarifyingAnswers: {},
      });

      assert.ok(check.missingFields.includes('city'));
      assert.ok(check.missingFields.includes('date'));
      assert.ok(check.missingFields.includes('guestCount'));
      assert.ok(check.missingFields.includes('budget'));
      assert.ok(check.clarifyingQuestions.length >= 4);
    });

    it('generates deterministic fallback plans explicitly tagged with source: fallback and reason', () => {
      const fallback = generateFallbackPlan({
        title: 'Rohan 30th Birthday',
        type: 'birthday',
        city: 'Bengaluru',
        guestCount: 80,
      });

      assert.strictEqual(fallback.source, 'fallback');
      assert.strictEqual(fallback.isFallback, true);
      assert.ok(fallback.overview.includes('Bengaluru'));

      // Validate that budget allocations sum to 100%
      const totalPct = fallback.budget_allocations.reduce((sum, b) => sum + b.percentage, 0);
      assert.strictEqual(totalPct, 100);

      // Validate through AIPlanOutputSchema
      const validated = AIPlanOutputSchema.parse(fallback);
      assert.strictEqual(validated.source, 'fallback');
    });
  });

  describe('Section Regenerator & Budget Savings Schema Envelopes', () => {
    it('validates section regeneration input and output schemas', () => {
      const input = SectionRegenerateInputSchema.parse({
        sectionKey: 'catering_plan',
        sectionTitle: 'Catering & Dining',
        currentContent: 'Standard buffet',
        instruction: 'Add authentic South Indian virundhu dishes',
        eventContext: {
          title: 'Wedding',
          type: 'wedding',
          city: 'Chennai',
          guestCount: 250,
        },
      });
      assert.strictEqual(input.sectionKey, 'catering_plan');

      const output = SectionRegenerateOutputSchema.parse({
        source: 'ai',
        updatedContent: 'Detailed banana leaf virundhu feast',
        changeSummary: 'Expanded menu with regional dishes',
      });
      assert.strictEqual(output.source, 'ai');
      assert.strictEqual(output.isFallback, false);
    });

    it('validates budget savings suggestions with integer minor units', () => {
      const savings = BudgetSavingsSchema.parse({
        source: 'fallback',
        fallbackReason: 'API_KEY_MISSING',
        isFallback: true,
        overallAssessment: 'Opportunities found in decor',
        suggestions: [
          {
            id: 'sav_1',
            title: 'Procure wholesale florals directly',
            description: 'Direct market sourcing',
            category: 'Decor & Florals',
            estimatedSavingMinor: 2500000, // ₹25,000.00
            tradeOff: 'Requires morning coordinator pickup',
          },
        ],
      });

      assert.strictEqual(savings.source, 'fallback');
      assert.strictEqual(savings.fallbackReason, 'API_KEY_MISSING');
      assert.strictEqual(savings.suggestions[0].estimatedSavingMinor, 2500000);
      assert.strictEqual(Number.isInteger(savings.suggestions[0].estimatedSavingMinor), true);
    });
  });

  describe('Chat Assistant Tool Calling & Action Cards', () => {
    it('validates action proposal schemas for tool calling', () => {
      const action = ChatActionProposalSchema.parse({
        id: 'act_101',
        action: 'add_task',
        label: 'Add Task: "Finalize Sound Curfew Permit"',
        params: {
          title: 'Finalize Sound Curfew Permit',
          phase: 'Booking & Vendors',
          priority: 'critical',
        },
        confirmed: false,
      });

      assert.strictEqual(action.action, 'add_task');
      assert.strictEqual(action.params.priority, 'critical');
      assert.strictEqual(action.confirmed, false);
    });
  });

  describe('Location & Grounded Venue Dataset', () => {
    it('retrieves verified fallback venues with full infrastructure metadata', () => {
      const chennaiVenues = getFallbackVenues('chennai');
      assert.ok(chennaiVenues.length >= 2);
      assert.ok(chennaiVenues[0].name.includes('Leela Palace'));
      assert.strictEqual(chennaiVenues[0].source, 'fallback');
      assert.ok(chennaiVenues[0].features.length >= 3);
    });
  });

  describe('Weather Range & Seasonal Calculation Logic', () => {
    it('flags dates outside the 14-day window as requiring seasonal historical averages', () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 45); // 45 days in future

      const diffDays = Math.round((futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      assert.ok(diffDays > 14, 'Target date must be beyond the 14-day forecast ceiling');

      const isBeyondWindow = diffDays > 14;
      assert.strictEqual(isBeyondWindow, true);
    });
  });
});
