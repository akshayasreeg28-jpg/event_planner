import { INITIAL_DEMO_EVENTS } from '../lib/storage';
import { saveEventToFirestore } from './firestoreService';
import { EventFull } from '../types';

/**
 * Seeds the three comprehensive demo events into Cloud Firestore:
 * 1. Priya & Rohan — Temple & Garden Wedding (Chennai, 280 guests, ₹85,00,000)
 * 2. IGNITE 2026 — Annual Tech & Cultural Fest (Bengaluru, 1,200 attendees, ₹45,00,000)
 * 3. Ananya's 1st Safari Adventure Birthday (Mumbai, 65 guests, ₹95,000)
 *
 * If a current user ID is supplied, sets them as the owner/primary collaborator
 * so they can view and edit the events immediately in their dashboard.
 */
export async function seedDemoEventsToFirestore(
  targetUserId?: string,
  targetUserEmail?: string
): Promise<{ success: boolean; seededCount: number; message: string }> {
  try {
    let count = 0;

    for (const demoEvent of INITIAL_DEMO_EVENTS) {
      // Clone event to avoid mutating the in-memory master
      const eventToSeed: EventFull = JSON.parse(JSON.stringify(demoEvent));

      if (targetUserId) {
        eventToSeed.details.ownerId = targetUserId;
        if (targetUserEmail) {
          // Ensure target user is also listed or retains ownership
          const existingCollabs = eventToSeed.details.collaborators || [];
          if (!existingCollabs.some((c) => c.id === targetUserId || c.email === targetUserEmail)) {
            existingCollabs.push({
              id: targetUserId,
              name: 'Current User',
              email: targetUserEmail,
              role: 'owner',
              addedAt: new Date().toISOString(),
            });
            eventToSeed.details.collaborators = existingCollabs;
          }
        }
      }

      await saveEventToFirestore(eventToSeed);
      count++;
    }

    return {
      success: true,
      seededCount: count,
      message: `Successfully seeded ${count} demo events with tasks, budgets, vendors, and guests into Firestore.`,
    };
  } catch (error: any) {
    console.error('Error seeding demo events to Firestore:', error);
    return {
      success: false,
      seededCount: 0,
      message: error?.message || 'Failed to seed demo events to Firestore.',
    };
  }
}
