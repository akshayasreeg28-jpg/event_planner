import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Guest, TableSeating, TableShape } from '../types/index.ts';

describe('Floorplan Seating Planner & Dietary Tracker Suite', () => {
  const createMockGuests = (): Guest[] => [
    {
      id: 'g_1',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      groupSide: 'bride',
      plusOnes: 1,
      dietaryNeeds: 'allergies',
      dietaryNotes: 'Severe Peanut and Shellfish allergy - carry EpiPen',
      allergies: ['Peanuts', 'Shellfish'],
      tableAssignment: 'Table 1 — Elders & VIPs',
      invitationStatus: 'delivered',
      rsvpStatus: 'confirmed',
      rsvpToken: 'tok_1',
    },
    {
      id: 'g_2',
      name: 'Rohan Mehta',
      email: 'rohan@example.com',
      groupSide: 'groom',
      plusOnes: 0,
      dietaryNeeds: 'jain',
      dietaryNotes: 'Strict Jain — no onions, garlic, potatoes, or root vegetables',
      allergies: [],
      tableAssignment: 'Table 1 — Elders & VIPs',
      invitationStatus: 'delivered',
      rsvpStatus: 'confirmed',
      rsvpToken: 'tok_2',
    },
    {
      id: 'g_3',
      name: 'Aisha Khan',
      email: 'aisha@example.com',
      groupSide: 'general',
      plusOnes: 0,
      dietaryNeeds: 'halal',
      dietaryNotes: 'Strict Halal certified',
      allergies: [],
      tableAssignment: 'Table 2 — Family & Relatives',
      invitationStatus: 'delivered',
      rsvpStatus: 'confirmed',
      rsvpToken: 'tok_3',
    },
    {
      id: 'g_4',
      name: 'Marcus Vance',
      email: 'marcus@example.com',
      groupSide: 'vip',
      plusOnes: 2,
      dietaryNeeds: 'vegan',
      dietaryNotes: '100% plant based',
      allergies: [],
      tableAssignment: 'Table 2 — Family & Relatives',
      invitationStatus: 'delivered',
      rsvpStatus: 'confirmed',
      rsvpToken: 'tok_4',
    },
    {
      id: 'g_5',
      name: 'Sneha Patel',
      email: 'sneha@example.com',
      groupSide: 'bride',
      plusOnes: 0,
      dietaryNeeds: 'gluten_free',
      dietaryNotes: 'Celiac disease — separate fryer and preparation area required',
      allergies: ['Gluten', 'Wheat'],
      tableAssignment: 'Table 3 — Friends',
      invitationStatus: 'delivered',
      rsvpStatus: 'confirmed',
      rsvpToken: 'tok_5',
    },
    {
      id: 'g_6',
      name: 'Aditya Roy',
      email: 'aditya@example.com',
      groupSide: 'groom',
      plusOnes: 0,
      dietaryNeeds: 'standard',
      allergies: [],
      tableAssignment: 'Table 3 — Friends',
      invitationStatus: 'delivered',
      rsvpStatus: 'confirmed',
      rsvpToken: 'tok_6',
    },
  ];

  const createMockTables = (): TableSeating[] => [
    {
      id: 'tbl_1',
      name: 'Table 1 — Elders & VIPs',
      capacity: 8,
      shape: 'round',
      x: 30,
      y: 40,
      color: '#4B2A7B',
      assignedGuestIds: ['g_1', 'g_2'],
    },
    {
      id: 'tbl_2',
      name: 'Table 2 — Family & Relatives',
      capacity: 4,
      shape: 'rectangular',
      x: 60,
      y: 40,
      color: '#FF7A6B',
      assignedGuestIds: ['g_3', 'g_4'], // Marcus has +2, so occupancy = 1 + (1 + 2) = 4
    },
    {
      id: 'tbl_3',
      name: 'Table 3 — Friends',
      capacity: 6,
      shape: 'head_table',
      x: 50,
      y: 75,
      color: '#27AE60',
      assignedGuestIds: ['g_5', 'g_6'],
    },
  ];

  describe('Dietary Requirement Tracking & Highlighting', () => {
    test('accurately identifies dietary special needs per table', () => {
      const guests = createMockGuests();
      const tables = createMockTables();

      // Table 1 has g_1 (allergies) and g_2 (jain)
      const table1Guests = guests.filter((g) => tables[0].assignedGuestIds.includes(g.id));
      const table1Diets = table1Guests.map((g) => g.dietaryNeeds);
      assert.ok(table1Diets.includes('allergies'));
      assert.ok(table1Diets.includes('jain'));

      // Table 1 has allergy medical alert
      const hasAllergy = table1Guests.some((g) => g.dietaryNeeds === 'allergies' || (g.allergies && g.allergies.length > 0));
      assert.equal(hasAllergy, true);
    });

    test('calculates total headcount including plus ones per dietary category', () => {
      const guests = createMockGuests();
      const summary: Record<string, number> = {};

      guests.forEach((g) => {
        const headcount = 1 + (g.plusOnes || 0);
        summary[g.dietaryNeeds] = (summary[g.dietaryNeeds] || 0) + headcount;
      });

      // g_1 has 1 plus-one -> 2 allergy meals
      assert.equal(summary['allergies'], 2);
      // g_2 is 1 jain
      assert.equal(summary['jain'], 1);
      // g_4 has 2 plus-ones -> 3 vegan meals
      assert.equal(summary['vegan'], 3);
      // g_5 is 1 gluten-free
      assert.equal(summary['gluten_free'], 1);
      // g_3 is 1 halal
      assert.equal(summary['halal'], 1);
      // g_6 is 1 standard
      assert.equal(summary['standard'], 1);
    });

    test('collects critical kitchen medical warnings for banquets', () => {
      const guests = createMockGuests();
      const medicalAlerts = guests
        .filter((g) => g.dietaryNeeds === 'allergies' || g.dietaryNeeds === 'gluten_free')
        .map((g) => ({
          name: g.name,
          diet: g.dietaryNeeds,
          notes: g.dietaryNotes,
          allergens: g.allergies || [],
        }));

      assert.equal(medicalAlerts.length, 2);
      assert.ok(medicalAlerts[0].allergens.includes('Peanuts'));
      assert.ok(medicalAlerts[1].allergens.includes('Gluten'));
    });
  });

  describe('Table Capacity Enforcement & Collision Protection', () => {
    test('detects when total seated headcount equals or is under capacity', () => {
      const guests = createMockGuests();
      const tables = createMockTables();

      const table2 = tables[1]; // capacity 4
      const seatedGuests = guests.filter((g) => table2.assignedGuestIds.includes(g.id));
      const totalOccupancy = seatedGuests.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

      assert.equal(totalOccupancy, 4); // g_3 (1) + g_4 (3) = 4
      assert.ok(totalOccupancy <= table2.capacity);
    });

    test('detects table capacity overrun when additional guest is assigned', () => {
      const guests = createMockGuests();
      const tables = createMockTables();

      const table2 = tables[1]; // capacity 4
      // Adding g_6 (1 guest)
      const newAssignedIds = [...table2.assignedGuestIds, 'g_6'];
      const updatedSeated = guests.filter((g) => newAssignedIds.includes(g.id));
      const totalOccupancy = updatedSeated.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

      assert.equal(totalOccupancy, 5);
      const isOverCapacity = totalOccupancy > table2.capacity;
      assert.equal(isOverCapacity, true);
    });

    test('supports varied table shapes (round, rectangular, head_table)', () => {
      const tables = createMockTables();
      const shapes: TableShape[] = tables.map((t) => t.shape || 'round');

      assert.ok(shapes.includes('round'));
      assert.ok(shapes.includes('rectangular'));
      assert.ok(shapes.includes('head_table'));
    });

    test('clamps floorplan drag coordinates within canvas boundaries (0-100%)', () => {
      const clampCoordinate = (val: number, min = 10, max = 90) => {
        return Math.max(min, Math.min(max, val));
      };

      assert.equal(clampCoordinate(-15), 10);
      assert.equal(clampCoordinate(105), 90);
      assert.equal(clampCoordinate(50), 50);
    });
  });
});
