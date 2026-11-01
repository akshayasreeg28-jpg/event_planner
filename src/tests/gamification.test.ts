import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateGamification } from '../lib/gamification.ts';
import { EventFull, Vendor, BudgetItem } from '../types/index.ts';

function createMockEvent(overrides: Partial<EventFull> = {}): EventFull {
  return {
    details: {
      id: 'test_evt_1',
      title: 'Sustainability Gala',
      type: 'community',
      date: '2026-12-15',
      city: 'Bengaluru',
      venueType: 'indoor',
      estimatedGuestCount: 150,
      totalBudgetMinor: 50000000, // ₹5,00,000.00
      currency: 'INR',
      dietaryPreferences: ['Strict Vegetarian'],
      ownerId: 'usr_test',
      collaborators: [],
      status: 'planning',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      ecoScore: {
        score: 65,
        rating: 'Silver',
        tips: ['Use compostable plates'],
      },
      ...overrides.details,
    },
    planSections: [],
    budgetAllocations: [
      { category: 'Catering', targetPercentage: 50 },
      { category: 'Decor', targetPercentage: 50 },
    ],
    budgetItems: [
      {
        id: 'b1',
        category: 'Catering',
        name: 'Organic Feast',
        estimatedAmountMinor: 25000000,
        actualAmountMinor: 24000000,
        paidAmountMinor: 24000000,
        status: 'paid',
      },
    ],
    savingsSuggestions: [],
    tasks: [
      {
        id: 't1',
        title: 'Book hall',
        deadline: '2026-11-01',
        phase: 'Booking & Vendors',
        priority: 'high',
        status: 'completed',
        dependencies: [],
      },
      {
        id: 't2',
        title: 'Finalize menu',
        deadline: '2026-11-15',
        phase: 'Purchasing & Decor',
        priority: 'medium',
        status: 'completed',
        dependencies: [],
      },
      {
        id: 't3',
        title: 'Send digital invites',
        deadline: '2026-11-20',
        phase: 'Purchasing & Decor',
        priority: 'medium',
        status: 'completed',
        dependencies: [],
      },
    ],
    vendors: [
      {
        id: 'v1',
        category: 'Catering',
        name: 'Green Fork Caterers',
        contactPerson: 'Ravi',
        phone: '1234567890',
        email: 'ravi@greenfork.com',
        estimatedCostMinor: 25000000,
        bookingStatus: 'booked',
        requirements: [],
        questionsToAsk: [],
        quotes: [],
        linkedTasks: [],
        isSustainable: true,
        sustainabilityPractices: ['Compostable tableware', 'Zero single-use plastics'],
      },
      {
        id: 'v2',
        category: 'Photography',
        name: 'Digital Clicks',
        contactPerson: 'Sita',
        phone: '9876543210',
        email: 'sita@clicks.com',
        estimatedCostMinor: 10000000,
        bookingStatus: 'booked',
        requirements: [],
        questionsToAsk: [],
        quotes: [],
        linkedTasks: [],
        isSustainable: false,
      },
    ],
    guests: [],
    seatingTables: [],
    themes: [],
    menu: [{ id: 'm1', course: 'mains', name: 'Millet Rice', description: 'Local', isVegetarian: true, perHeadPortionGramsOrUnits: 300, unit: 'g' }],
    venues: [
      {
        id: 'ven1',
        name: 'Green Lawn',
        type: 'Lawn',
        address: 'MG Road',
        capacity: 200,
        indoorOutdoor: 'outdoor',
        priceLevel: '$$',
        rating: 4.8,
        distanceKm: 12,
        features: ['Solar lighting'],
        fitExplanation: 'Eco friendly',
        requirementsChecklist: { parking: true, powerBackup: true, permissionsRequired: [], accessibility: true, noiseCurfewHour: '22:00' },
        shortlisted: true,
      },
    ],
    runOfShow: [],
    issues: [],
    chatHistory: [],
    ...overrides,
  };
}

describe('Gamification & Eco-Champion Badge Engine', () => {
  test('calculates vendor sustainability stats deterministically', () => {
    const event = createMockEvent();
    const result = calculateGamification(event);

    assert.equal(result.stats.totalVendors, 2);
    assert.equal(result.stats.sustainableVendors, 1);
    assert.equal(result.stats.sustainabilityRatio, 0.5); // 1 of 2
  });

  test('awards Green Sourcing Pioneer badge when at least 1 vendor is sustainable', () => {
    const event = createMockEvent();
    const result = calculateGamification(event);

    const pioneerBadge = result.badges.find((b) => b.id === 'green_sourcing_pioneer');
    assert.ok(pioneerBadge, 'Badge must exist in definitions');
    assert.equal(pioneerBadge.unlocked, true);
    assert.equal(pioneerBadge.tierLevel, 1);
  });

  test('upgrades to Gold Eco-Champion Ribbon when Eco Score >= 75 and 2+ sustainable vendors', () => {
    const event = createMockEvent({
      details: {
        ...createMockEvent().details,
        ecoScore: { score: 82, rating: 'Gold', tips: ['Local sourcing'] },
      },
      vendors: [
        {
          id: 'v1',
          category: 'Catering',
          name: 'Green Fork Caterers',
          contactPerson: 'Ravi',
          phone: '123',
          email: 'r@g.com',
          estimatedCostMinor: 20000000,
          bookingStatus: 'booked',
          requirements: [],
          questionsToAsk: [],
          quotes: [],
          linkedTasks: [],
          isSustainable: true,
        },
        {
          id: 'v2',
          category: 'Decor',
          name: 'Eco Floral Decor',
          contactPerson: 'Maya',
          phone: '456',
          email: 'm@e.com',
          estimatedCostMinor: 10000000,
          bookingStatus: 'booked',
          requirements: [],
          questionsToAsk: [],
          quotes: [],
          linkedTasks: [],
          isSustainable: true,
        },
      ],
    });

    const result = calculateGamification(event);
    assert.equal(result.ecoRibbon.tier, 'gold');
    assert.equal(result.ecoRibbon.title, 'Gold Eco-Champion');
    assert.equal(result.ecoRibbon.unlocked, true);

    const ribbonBadge = result.badges.find((b) => b.id === 'eco_champion_ribbon_award');
    assert.equal(ribbonBadge?.unlocked, true);
  });

  test('upgrades to Emerald Eco-Champion Ribbon when Eco Score >= 90 and >=3 sustainable vendors', () => {
    const event = createMockEvent({
      details: {
        ...createMockEvent().details,
        ecoScore: { score: 94, rating: 'Platinum', tips: ['Zero-waste composting'] },
      },
      vendors: [
        { id: 'v1', category: 'Catering', name: 'V1', contactPerson: '', phone: '', email: '', estimatedCostMinor: 1, bookingStatus: 'booked', requirements: [], questionsToAsk: [], quotes: [], linkedTasks: [], isSustainable: true },
        { id: 'v2', category: 'Decor', name: 'V2', contactPerson: '', phone: '', email: '', estimatedCostMinor: 1, bookingStatus: 'booked', requirements: [], questionsToAsk: [], quotes: [], linkedTasks: [], isSustainable: true },
        { id: 'v3', category: 'Music', name: 'V3', contactPerson: '', phone: '', email: '', estimatedCostMinor: 1, bookingStatus: 'booked', requirements: [], questionsToAsk: [], quotes: [], linkedTasks: [], isSustainable: true },
      ],
    });

    const result = calculateGamification(event);
    assert.equal(result.ecoRibbon.tier, 'emerald');
    assert.equal(result.ecoRibbon.title, 'Emerald Eco-Champion');
  });

  test('awards Prudent Custodian badge when total actual expenses are strictly <= total budget', () => {
    const event = createMockEvent();
    const result = calculateGamification(event);

    const prudentBadge = result.badges.find((b) => b.id === 'prudent_custodian');
    assert.equal(prudentBadge?.unlocked, true);
    assert.equal(result.stats.budgetStatus, 'surplus');
    assert.ok(result.stats.budgetVarianceMinor > 0);
  });

  test('locks Prudent Custodian and flags deficit when total actual expenses exceed budget limit', () => {
    const event = createMockEvent({
      details: {
        ...createMockEvent().details,
        totalBudgetMinor: 20000000, // ₹2,00,000
      },
      budgetItems: [
        {
          id: 'b1',
          category: 'Catering',
          name: 'Expensive Feast',
          estimatedAmountMinor: 20000000,
          actualAmountMinor: 25000000, // ₹2,50,000 (₹50,000 overrun)
          paidAmountMinor: 25000000,
          status: 'paid',
        },
      ],
    });

    const result = calculateGamification(event);
    const prudentBadge = result.badges.find((b) => b.id === 'prudent_custodian');
    assert.equal(prudentBadge?.unlocked, false);
    assert.equal(result.stats.budgetStatus, 'deficit');
    assert.equal(result.stats.budgetVarianceMinor, -5000000);
  });

  test('awards Deal Hunter badge when AI savings suggestions are applied', () => {
    const event = createMockEvent({
      savingsSuggestions: [
        {
          id: 's1',
          title: 'Switch to seasonal floral runners',
          description: 'Saves 15%',
          category: 'Decor',
          estimatedSavingMinor: 2000000,
          tradeOff: 'Minimal floral variety shift',
          applied: true,
        },
      ],
    });

    const result = calculateGamification(event);
    const dealBadge = result.badges.find((b) => b.id === 'deal_hunter');
    assert.equal(dealBadge?.unlocked, true);
    assert.equal(result.stats.savingsAppliedCount, 1);
    assert.equal(result.stats.totalSavingsMinor, 2000000);
  });

  test('calculates XP progression and level titles deterministically', () => {
    const event = createMockEvent();
    const result = calculateGamification(event);

    assert.ok(result.totalXp > 0, 'Total XP must be positive');
    assert.ok(result.currentLevel >= 1 && result.currentLevel <= 5, 'Level must be between 1 and 5');
    assert.ok(typeof result.levelTitle === 'string' && result.levelTitle.length > 0);
    assert.ok(result.progressToNextLevel >= 0 && result.progressToNextLevel <= 100);
  });
});
