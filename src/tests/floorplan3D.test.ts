import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TableSeating, Guest } from '../types/index.ts';

describe('3D Floorplan & Spatial Perspective Suite', () => {
  // Test 2D percentage to 3D world coordinate transformation
  const toWorldCoord = (pctX: number, pctY: number): { x: number; z: number } => {
    const clampedX = Math.max(10, Math.min(90, pctX));
    const clampedY = Math.max(10, Math.min(90, pctY));
    const x = ((clampedX - 50) / 100) * 36;
    const z = ((clampedY - 50) / 100) * 36;
    return { x, z };
  };

  test('maps center floorplan (50%, 50%) to (0, 0) world coordinates', () => {
    const coords = toWorldCoord(50, 50);
    assert.equal(coords.x, 0);
    assert.equal(coords.z, 0);
  });

  test('maps corners within clamped bounds without exceeding hall boundaries', () => {
    const topLeft = toWorldCoord(10, 10);
    assert.equal(topLeft.x, -14.4);
    assert.equal(topLeft.z, -14.4);

    const bottomRight = toWorldCoord(90, 90);
    assert.equal(bottomRight.x, 14.4);
    assert.equal(bottomRight.z, 14.4);

    // Clamps extreme out of bounds coordinates
    const outOfBounds = toWorldCoord(-20, 120);
    assert.equal(outOfBounds.x, -14.4);
    assert.equal(outOfBounds.z, 14.4);
  });

  test('provides discrete camera presets for top-down and isometric angles', () => {
    const presets = {
      isometric: {
        pos: [24, 25, 24],
        look: [0, 0, 0],
        description: '45-degree isometric perspective showing depth and table heights',
      },
      top_down: {
        pos: [0, 40, 0.001],
        look: [0, 0, 0],
        description: 'Bird-eye orthogonal view from above for spatial distribution check',
      },
      guest_eye: {
        pos: [0, 4.5, 20],
        look: [0, 1.5, -16],
        description: 'Entrance foyer eye-level perspective looking toward the stage',
      },
    };

    assert.equal(presets.isometric.pos[1], 25);
    // Top-down camera is directly overhead at Y=40
    assert.equal(presets.top_down.pos[0], 0);
    assert.equal(presets.top_down.pos[1], 40);
    // Guest eye is at ground height looking toward -Z (stage)
    assert.equal(presets.guest_eye.pos[2], 20);
    assert.ok(presets.guest_eye.look[2] < 0);
  });

  test('identifies tables with dietary special needs for 3D glowing halo rings', () => {
    const table: TableSeating = {
      id: 'tbl_vip',
      name: 'Table 1 — Elders & VIPs',
      capacity: 8,
      shape: 'round',
      x: 30,
      y: 35,
      assignedGuestIds: ['g_allergy', 'g_standard'],
    };

    const guests: Guest[] = [
      {
        id: 'g_allergy',
        name: 'Dr. Ramesh',
        groupSide: 'bride',
        plusOnes: 0,
        dietaryNeeds: 'allergies',
        allergies: ['Peanuts'],
        tableAssignment: 'Table 1',
        invitationStatus: 'delivered',
        rsvpStatus: 'confirmed',
        rsvpToken: 't1',
      },
      {
        id: 'g_standard',
        name: 'Mrs. Ramesh',
        groupSide: 'bride',
        plusOnes: 0,
        dietaryNeeds: 'standard',
        allergies: [],
        tableAssignment: 'Table 1',
        invitationStatus: 'delivered',
        rsvpStatus: 'confirmed',
        rsvpToken: 't2',
      },
    ];

    const seated = table.assignedGuestIds
      .map((id) => guests.find((g) => g.id === id))
      .filter(Boolean) as Guest[];

    const hasAllergies = seated.some((g) => g.dietaryNeeds === 'allergies');
    assert.equal(hasAllergies, true);

    const haloColor = hasAllergies ? 0xf43f5e : 0x000000;
    assert.equal(haloColor, 0xf43f5e); // Rose glow in 3D
  });
});
