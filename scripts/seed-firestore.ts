/**
 * Executable seed script for Cloud Firestore.
 * Usage: npx tsx scripts/seed-firestore.ts [targetUserId]
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_DEMO_EVENTS } from '../src/lib/storage';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  const targetUserId = process.argv[2] || 'demo_planner_default';
  console.log(`\n🌱 Starting Firestore Seeding for project: ${firebaseConfig.projectId}`);
  console.log(`📦 Database: ${firebaseConfig.firestoreDatabaseId}`);
  console.log(`👤 Target User ID: ${targetUserId}\n`);

  let count = 0;

  for (const event of INITIAL_DEMO_EVENTS) {
    console.log(`⏳ Seeding event: ${event.details.title} (${event.details.id})...`);
    const eventRef = doc(db, 'events', event.details.id);

    const collaboratorUids = (event.details.collaborators || []).map((c) => c.id).filter(Boolean);
    const collaboratorEmails = (event.details.collaborators || []).map((c) => c.email?.toLowerCase()).filter(Boolean);

    if (targetUserId && !collaboratorUids.includes(targetUserId)) {
      collaboratorUids.push(targetUserId);
    }

    const rootData = {
      ...event.details,
      ownerId: targetUserId || event.details.ownerId,
      collaboratorUids,
      collaboratorEmails,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(eventRef, rootData, { merge: true });

    // Subcollections
    const batch = writeBatch(db);

    event.planSections?.forEach((sec) => {
      batch.set(doc(db, 'events', event.details.id, 'planSections', sec.id), sec, { merge: true });
    });

    event.budgetItems?.forEach((item) => {
      batch.set(doc(db, 'events', event.details.id, 'budgetItems', item.id), item, { merge: true });
    });

    event.tasks?.forEach((task) => {
      batch.set(doc(db, 'events', event.details.id, 'tasks', task.id), task, { merge: true });
    });

    event.vendors?.forEach((vendor) => {
      batch.set(doc(db, 'events', event.details.id, 'vendors', vendor.id), vendor, { merge: true });
    });

    event.guests?.forEach((guest) => {
      batch.set(doc(db, 'events', event.details.id, 'guests', guest.id), guest, { merge: true });
      if (guest.rsvpToken) {
        batch.set(
          doc(db, 'rsvpTokens', guest.rsvpToken),
          {
            token: guest.rsvpToken,
            eventId: event.details.id,
            guestId: guest.id,
            guestName: guest.name,
            rsvpStatus: guest.rsvpStatus,
            dietaryNeeds: guest.dietaryNeeds,
            dietaryNotes: guest.dietaryNotes || '',
            plusOnes: guest.plusOnes || 0,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    });

    event.themes?.forEach((thm) => {
      batch.set(doc(db, 'events', event.details.id, 'ideas', thm.id), thm, { merge: true });
    });

    event.venues?.forEach((vnu) => {
      batch.set(doc(db, 'events', event.details.id, 'venues', vnu.id), vnu, { merge: true });
    });

    event.runOfShow?.forEach((ros) => {
      batch.set(doc(db, 'events', event.details.id, 'runOfShow', ros.id), ros, { merge: true });
    });

    event.issues?.forEach((iss) => {
      batch.set(doc(db, 'events', event.details.id, 'issueLog', iss.id), iss, { merge: true });
    });

    await batch.commit();
    count++;
    console.log(`✅ Seeded: ${event.details.title}`);
  }

  console.log(`\n🎉 Seeding complete! ${count} demo events populated in Firestore.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
