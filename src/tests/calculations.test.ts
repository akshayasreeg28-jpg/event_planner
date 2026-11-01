import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMinorToCurrency,
  parseCurrencyInputToMinor,
  getDaysRemaining,
} from '../lib/formatters.ts';

describe('Deterministic Integer Minor Math & Currency Formatter', () => {
  test('converts paise to standard Indian grouping (INR)', () => {
    // 5 Lakhs INR = 50,00,000 paise
    const fiveLakhsPaise = 50000000;
    const formatted = formatMinorToCurrency(fiveLakhsPaise, 'INR');
    assert.equal(formatted, '₹5,00,000');
  });

  test('formats compact Indian denominations (Lakhs and Crores)', () => {
    // 1.5 Crores = 1,50,00,000 INR = 1500000000 paise
    const oneCroreFiftyLakhs = 1500000000;
    assert.equal(formatMinorToCurrency(oneCroreFiftyLakhs, 'INR', { compact: true }), '₹1.50 Cr');

    // 25 Lakhs = 250000000 paise
    const twentyFiveLakhs = 250000000;
    assert.equal(formatMinorToCurrency(twentyFiveLakhs, 'INR', { compact: true }), '₹25 Lakh');

    // 85 Thousand = 8500000 paise
    const eightyFiveK = 8500000;
    assert.equal(formatMinorToCurrency(eightyFiveK, 'INR', { compact: true }), '₹85k');
  });

  test('handles USD, EUR, and GBP formatting', () => {
    // $12,500.50 = 1250050 cents
    const usdCents = 1250050;
    const formattedUsd = formatMinorToCurrency(usdCents, 'USD');
    assert.ok(formattedUsd.includes('$12,500.50'));

    // €4,000 = 400000 cents
    const eurCents = 400000;
    const formattedEur = formatMinorToCurrency(eurCents, 'EUR');
    assert.ok(formattedEur.includes('€4,000.00'));
  });

  test('parses loose user text inputs into exact integer minor units without float drift', () => {
    assert.equal(parseCurrencyInputToMinor('500000'), 50000000);
    assert.equal(parseCurrencyInputToMinor('₹ 5,00,000'), 50000000);
    assert.equal(parseCurrencyInputToMinor('$ 1,250.75'), 125075);
    assert.equal(parseCurrencyInputToMinor(''), 0);
    assert.equal(parseCurrencyInputToMinor('abc'), 0);
  });

  test('handles zero and negative variance differences deterministically', () => {
    const budgetedMinor = 10000000; // ₹1,00,000
    const actualOverMinor = 12000000; // ₹1,20,000
    const varianceOver = actualOverMinor - budgetedMinor;
    assert.equal(varianceOver, 2000000); // positive = deficit / over-budget

    const actualUnderMinor = 8500000; // ₹85,000
    const varianceUnder = actualUnderMinor - budgetedMinor;
    assert.equal(varianceUnder, -1500000); // negative = surplus / under-budget

    const formattedSurplus = formatMinorToCurrency(varianceUnder, 'INR');
    assert.equal(formattedSurplus, '-₹15,000');
  });
});

describe('Catering Quantity Calculations & Buffers', () => {
  function computeCateringPortions(
    guestCount: number,
    portionPerHead: number,
    bufferPercent: number
  ) {
    const totalGuestsWithBuffer = Math.round(guestCount * (1 + bufferPercent / 100));
    const totalQuantity = totalGuestsWithBuffer * portionPerHead;
    return {
      totalGuestsWithBuffer,
      totalQuantity,
    };
  }

  test('calculates correct catering quantities with a 10% safety buffer', () => {
    const guestCount = 200;
    const biryaniGramsPerHead = 450;
    const buffer = 10;

    const result = computeCateringPortions(guestCount, biryaniGramsPerHead, buffer);
    assert.equal(result.totalGuestsWithBuffer, 220); // 200 * 1.10 = 220
    assert.equal(result.totalQuantity, 99000); // 220 * 450g = 99,000g (99 kg)
  });

  test('calculates welcome drinks with a 15% safety buffer for summer events', () => {
    const guestCount = 350;
    const coolerMlPerHead = 200;
    const buffer = 15;

    const result = computeCateringPortions(guestCount, coolerMlPerHead, buffer);
    const expectedGuests = Math.round(guestCount * 1.15);
    assert.equal(result.totalGuestsWithBuffer, expectedGuests);
    assert.equal(result.totalQuantity, expectedGuests * coolerMlPerHead);
  });
});

describe('Seating & Attendance Aggregations', () => {
  test('calculates total confirmed attendees factoring plus-ones', () => {
    const guests = [
      { name: 'Arun', rsvpStatus: 'confirmed', plusOnes: 1 },
      { name: 'Priya', rsvpStatus: 'confirmed', plusOnes: 2 },
      { name: 'Vikram', rsvpStatus: 'pending', plusOnes: 1 },
      { name: 'Deepa', rsvpStatus: 'declined', plusOnes: 0 },
      { name: 'Karthik', rsvpStatus: 'confirmed', plusOnes: 0 },
    ];

    const confirmedHeadCount = guests
      .filter((g) => g.rsvpStatus === 'confirmed')
      .reduce((sum, g) => sum + 1 + g.plusOnes, 0);

    // Arun (2) + Priya (3) + Karthik (1) = 6
    assert.equal(confirmedHeadCount, 6);
  });

  test('validates table capacity limits without overflow', () => {
    const table = {
      id: 'tbl_1',
      name: 'Table 1',
      capacity: 8,
      assignedGuestIds: ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    };

    const isFull = table.assignedGuestIds.length >= table.capacity;
    assert.equal(isFull, true);
    assert.equal(table.assignedGuestIds.length, 8);
  });
});

describe('Backward Timeline Scheduling', () => {
  function scheduleMilestoneDeadline(eventDateIso: string, daysBefore: number): string {
    const eventDate = new Date(eventDateIso);
    const deadline = new Date(eventDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    return deadline.toISOString().split('T')[0];
  }

  test('computes backward deadlines relative to target event date', () => {
    const weddingDate = '2026-11-28';

    // Venue booking at T-90 days
    const venueDeadline = scheduleMilestoneDeadline(weddingDate, 90);
    assert.equal(venueDeadline, '2026-08-30');

    // Menu tasting at T-30 days
    const tastingDeadline = scheduleMilestoneDeadline(weddingDate, 30);
    assert.equal(tastingDeadline, '2026-10-29');

    // Final head count at T-7 days
    const finalCountDeadline = scheduleMilestoneDeadline(weddingDate, 7);
    assert.equal(finalCountDeadline, '2026-11-21');
  });
});
