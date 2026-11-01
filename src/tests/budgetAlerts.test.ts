import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  findMatchingBudgetAllocation,
  checkCategoryBudgetOverrun,
} from '../lib/budgetAlerts.ts';
import { EventFull, BudgetItem, BudgetCategoryAllocation } from '../types/index.ts';

describe('Budget Alerts & Overrun Detection Suite', () => {
  const sampleAllocations: BudgetCategoryAllocation[] = [
    { category: 'Venue & Production', targetPercentage: 35 },
    { category: 'Catering & Dining', targetPercentage: 30 },
    { category: 'Photography & Film', targetPercentage: 15 },
    { category: 'Decor & Floral', targetPercentage: 12 },
    { category: 'Contingency & Misc', targetPercentage: 8 },
  ];

  const createMockEvent = (
    totalBudgetMinor: number = 10000000, // ₹1,00,000.00
    budgetItems: Partial<BudgetItem>[] = []
  ): EventFull => {
    return {
      details: {
        id: 'evt_test_1',
        title: 'Ananya & Kabir Sangeet Night',
        type: 'wedding',
        date: '2026-11-20',
        city: 'Jaipur',
        venueName: 'The Oberoi Rajvilas',
        venueType: 'outdoor',
        estimatedGuestCount: 200,
        totalBudgetMinor,
        currency: 'INR',
        dietaryPreferences: ['Strict Vegetarian'],
        ownerId: 'usr_test',
        collaborators: [],
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ecoScore: { score: 80, rating: 'Gold', tips: [] },
      },
      planSections: [],
      budgetAllocations: sampleAllocations,
      budgetItems: budgetItems.map((b, i) => ({
        id: b.id || `item_${i}`,
        category: b.category || 'Catering & Dining',
        name: b.name || `Expense ${i}`,
        estimatedAmountMinor: b.estimatedAmountMinor ?? 1000000,
        actualAmountMinor: b.actualAmountMinor ?? 1000000,
        paidAmountMinor: b.paidAmountMinor ?? 1000000,
        status: b.status || 'paid',
        dueDate: '2026-11-01',
      })),
      savingsSuggestions: [],
      tasks: [],
      vendors: [],
      guests: [],
      seatingTables: [],
      themes: [],
      menu: [],
      venues: [],
      runOfShow: [],
      issues: [],
      chatHistory: [],
    };
  };

  describe('findMatchingBudgetAllocation', () => {
    const mockEvent = createMockEvent();

    test('finds exact matching category ignoring case and whitespace', () => {
      const match1 = findMatchingBudgetAllocation('Venue & Production', mockEvent);
      assert.equal(match1?.category, 'Venue & Production');

      const match2 = findMatchingBudgetAllocation('  catering & dining  ', mockEvent);
      assert.equal(match2?.category, 'Catering & Dining');
    });

    test('matches by substring for simplified category names', () => {
      // "Catering" -> "Catering & Dining"
      const cateringMatch = findMatchingBudgetAllocation('Catering', mockEvent);
      assert.equal(cateringMatch?.category, 'Catering & Dining');

      // "Photography" -> "Photography & Film"
      const photoMatch = findMatchingBudgetAllocation('Photography', mockEvent);
      assert.equal(photoMatch?.category, 'Photography & Film');

      // "Decor" -> "Decor & Floral"
      const decorMatch = findMatchingBudgetAllocation('Decor', mockEvent);
      assert.equal(decorMatch?.category, 'Decor & Floral');
    });

    test('falls back gracefully to first allocation when category is unrecognized', () => {
      const fallbackMatch = findMatchingBudgetAllocation('Suborbital Rocket Shuttle', mockEvent);
      assert.ok(fallbackMatch);
      assert.equal(fallbackMatch?.category, 'Venue & Production');
    });

    test('returns null if event has no budget allocations', () => {
      const emptyEvent = { ...mockEvent, budgetAllocations: [] };
      const match = findMatchingBudgetAllocation('Catering', emptyEvent);
      assert.equal(match, null);
    });
  });

  describe('checkCategoryBudgetOverrun', () => {
    // Total budget = ₹1,00,000.00 (10,000,000 minor units)
    // Catering & Dining = 30% -> targetMinor = 3,000,000 minor units (₹30,000)
    // 10% overrun threshold = 3,000,000 * 1.10 = 3,300,000 (overrun > ₹3,000)
    // 25% critical threshold = 3,000,000 * 1.25 = 3,750,000 (overrun > ₹7,500)

    test('does NOT trigger alert when expense is within category target', () => {
      const event = createMockEvent(10000000, []);
      // Proposed 25,000 (2,500,000 minor) against 30,000 target
      const result = checkCategoryBudgetOverrun('Catering', 2500000, event);

      assert.equal(result.isOverrun, false);
      assert.equal(result.severity, 'none');
      assert.equal(result.overrunMinor, -500000);
      assert.ok(result.overrunPercentage <= 0);
    });

    test('does NOT trigger alert when expense exceeds target by exactly 10% or less', () => {
      const event = createMockEvent(10000000, []);
      // 3,000,000 * 1.09 = 3,270,000 (9% overrun)
      const result = checkCategoryBudgetOverrun('Catering', 3270000, event);

      assert.equal(result.isOverrun, false);
      assert.equal(result.severity, 'none');
      assert.ok(result.overrunPercentage <= 10);
    });

    test('triggers WARNING alert when expense exceeds category target by > 10% and <= 25%', () => {
      const event = createMockEvent(10000000, []);
      // Proposed 3,500,000 (exceeds 3,000,000 by 500,000 = 16.67%)
      const result = checkCategoryBudgetOverrun('Catering', 3500000, event);

      assert.equal(result.isOverrun, true);
      assert.equal(result.severity, 'warning');
      assert.ok(result.overrunPercentage > 10 && result.overrunPercentage <= 25);
      assert.ok(result.title.includes('Category Budget Warning'));
      assert.ok(result.title.includes('+16.7%'));
      assert.ok(result.description.includes('Catering & Dining'));
    });

    test('triggers CRITICAL alert when expense exceeds category target by > 25%', () => {
      const event = createMockEvent(10000000, []);
      // Proposed 4,200,000 (exceeds 3,000,000 by 1,200,000 = 40.0%)
      const result = checkCategoryBudgetOverrun('Catering & Dining', 4200000, event);

      assert.equal(result.isOverrun, true);
      assert.equal(result.severity, 'critical');
      assert.ok(result.overrunPercentage > 25);
      assert.ok(result.title.includes('Critical Budget Alert'));
      assert.ok(result.title.includes('+40.0%'));
    });

    test('correctly aggregates multiple existing category expenses before checking new expense', () => {
      // Event already has ₹20,000 committed to Catering
      const existingItems: Partial<BudgetItem>[] = [
        {
          id: 'exp_1',
          category: 'Catering & Dining',
          actualAmountMinor: 1200000, // ₹12,000
        },
        {
          id: 'exp_2',
          category: 'Catering & Dining',
          actualAmountMinor: 800000, // ₹8,000
        },
      ];
      const event = createMockEvent(10000000, existingItems);

      // Adding ₹15,000 new catering quote -> Total = ₹35,000 vs ₹30,000 target (+16.67%)
      const result = checkCategoryBudgetOverrun('Catering', 1500000, event);

      assert.equal(result.currentActualMinor, 2000000);
      assert.equal(result.newTotalMinor, 3500000);
      assert.equal(result.targetMinor, 3000000);
      assert.equal(result.isOverrun, true);
      assert.equal(result.severity, 'warning');
    });

    test('excludes current item id when updating an existing expense so it does not double count', () => {
      const existingItems: Partial<BudgetItem>[] = [
        {
          id: 'exp_editing',
          category: 'Photography & Film',
          actualAmountMinor: 1400000, // ₹14,000
        },
        {
          id: 'exp_drone',
          category: 'Photography & Film',
          actualAmountMinor: 200000, // ₹2,000
        },
      ];
      // Photography allocation = 15% of 10,000,000 = 1,500,000 (₹15,000)
      const event = createMockEvent(10000000, existingItems);

      // Updating 'exp_editing' from 14,000 to 14,500
      // Total should be 2,000 (drone) + 14,500 = 16,500 (₹16,500 vs ₹15,000 target = +10.0%)
      const result = checkCategoryBudgetOverrun('Photography', 1450000, event, 'exp_editing');

      assert.equal(result.currentActualMinor, 200000); // Only drone item
      assert.equal(result.newTotalMinor, 1650000);
      assert.equal(result.targetMinor, 1500000);
      // 1650000 - 1500000 = 150000 / 1500000 = 10% exactly (not strictly > 10%)
      assert.equal(result.isOverrun, false);

      // If we push to 17,000 (total = 19,000 -> +26.67% -> critical)
      const criticalResult = checkCategoryBudgetOverrun('Photography', 1700000, event, 'exp_editing');
      assert.equal(criticalResult.isOverrun, true);
      assert.equal(criticalResult.severity, 'critical');
    });

    test('handles zero or missing budget safely without NaN or crash', () => {
      const zeroBudgetEvent = createMockEvent(0, []);
      const result = checkCategoryBudgetOverrun('Catering', 500000, zeroBudgetEvent);

      assert.equal(result.isOverrun, false);
      assert.equal(result.severity, 'none');
      assert.equal(result.overrunPercentage, 0);
      assert.equal(Number.isNaN(result.overrunPercentage), false);
    });
  });
});
