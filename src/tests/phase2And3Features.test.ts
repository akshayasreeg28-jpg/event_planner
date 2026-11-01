import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseEventSentence } from '../lib/sentencePlanParser';
import { getEventTheme, getEventThemeStyle, EVENT_THEMES } from '../lib/themeTokens';

describe('Phase 2 & Phase 3 Feature Suite', () => {
  describe('Plan My Event in One Sentence Parser', () => {
    it('accurately parses full natural language sentence for Indian wedding', () => {
      const sentence = "Sister's engagement, 150 guests, Chennai, ₹8 lakh, March";
      const result = parseEventSentence(sentence);

      assert.equal(result.type, 'wedding');
      assert.equal(result.city, 'Chennai');
      assert.equal(result.guestCount, 150);
      assert.equal(result.budgetMinor, 80000000); // ₹8,00,000 in paise
      assert.equal(result.currency, 'INR');
      assert.equal(result.monthName, 'March');
      assert.equal(result.missingFields.length, 0);
    });

    it('accurately parses college fest with lakhs budget and missing date', () => {
      const sentence = 'Annual College Tech Symposium, 500 students in Bengaluru for 4.5 lakh';
      const result = parseEventSentence(sentence);

      assert.equal(result.type, 'college_fest');
      assert.equal(result.city, 'Bengaluru');
      assert.equal(result.budgetMinor, 45000000);
      assert.ok(result.missingFields.includes('date'));
    });

    it('accurately parses birthday party with dollar currency', () => {
      const sentence = "Aarav's 5th Birthday party with 50 guests in Mumbai $10,000 May";
      const result = parseEventSentence(sentence);

      assert.equal(result.type, 'birthday');
      assert.equal(result.city, 'Mumbai');
      assert.equal(result.guestCount, 50);
      assert.equal(result.currency, 'USD');
      assert.equal(result.budgetMinor, 1000000); // $10,000 in cents
      assert.equal(result.monthName, 'May');
    });

    it('accurately flags missing fields when input is underspecified', () => {
      const sentence = 'Corporate executive summit in Delhi';
      const result = parseEventSentence(sentence);

      assert.equal(result.type, 'corporate');
      assert.equal(result.city, 'Delhi');
      assert.ok(result.missingFields.includes('guestCount'));
      assert.ok(result.missingFields.includes('budget'));
      assert.ok(result.missingFields.includes('date'));
    });
  });

  describe('Adaptive Event Theming Engine', () => {
    it('returns deep maroon and temple gold tokens for wedding', () => {
      const theme = getEventTheme('wedding');
      assert.equal(theme.primary, '#721C24'); // deep maroon
      assert.equal(theme.secondary, '#D4AF37'); // gold
      assert.ok(theme.gradient.includes('#721C24'));
    });

    it('returns electric violet and cyan laser tokens for college fest', () => {
      const theme = getEventTheme('college_fest');
      assert.equal(theme.primary, '#6C5CE7'); // electric violet
      assert.equal(theme.secondary, '#00CEC9'); // cyan
      assert.ok(theme.bgLight.includes('#0F0E17'));
    });

    it('returns playful pastels and coral for birthday', () => {
      const theme = getEventTheme('birthday');
      assert.equal(theme.primary, '#E84393'); // playful pink/coral
      assert.equal(theme.secondary, '#FDCB6E'); // warm yellow
    });

    it('returns clean navy and steel teal for corporate gathering', () => {
      const theme = getEventTheme('corporate');
      assert.equal(theme.primary, '#1E272E'); // clean navy
      assert.equal(theme.secondary, '#0FB9B1'); // steel teal
    });

    it('generates valid CSS variable style dictionary', () => {
      const styles = getEventThemeStyle('wedding');
      assert.equal((styles as any)['--event-primary'], '#721C24');
      assert.equal((styles as any)['--event-secondary'], '#D4AF37');
      assert.ok((styles as any)['--event-surface']);
    });
  });
});
