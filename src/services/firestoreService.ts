import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  EventFull,
  EventDetails,
  PlanSection,
  BudgetItem,
  TimelineTask,
  Vendor,
  Guest,
  ThemeIdea,
  VenueRecommendation,
  RunOfShowItem,
  IssueLogItem,
  ChatMessage,
} from '../types';

/**
 * Normalizes an event for Firestore root storage.
 * In addition to the standard details, we extract collaboratorUids and collaboratorEmails
 * for Firestore security rules evaluation.
 */
export function prepareEventDocData(details: EventDetails) {
  const collaboratorUids = (details.collaborators || [])
    .map((c) => c.id)
    .filter(Boolean);
  const collaboratorEmails = (details.collaborators || [])
    .map((c) => c.email?.toLowerCase())
    .filter(Boolean);

  return {
    ...details,
    collaboratorUids,
    collaboratorEmails,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Saves a complete EventFull entity into Firestore with subcollections.
 */
export async function saveEventToFirestore(event: EventFull): Promise<void> {
  const eventId = event.details.id;
  const eventRef = doc(db, 'events', eventId);

  // 1. Save root details
  const rootData = prepareEventDocData(event.details);
  await setDoc(eventRef, rootData, { merge: true });

  // 2. Batch write subcollections
  const batch = writeBatch(db);

  // Plan sections
  if (event.planSections?.length) {
    for (const section of event.planSections) {
      const sRef = doc(db, 'events', eventId, 'planSections', section.id);
      batch.set(sRef, section, { merge: true });
    }
  }

  // Budget items
  if (event.budgetItems?.length) {
    for (const item of event.budgetItems) {
      const bRef = doc(db, 'events', eventId, 'budgetItems', item.id);
      batch.set(bRef, item, { merge: true });
    }
  }

  // Tasks
  if (event.tasks?.length) {
    for (const task of event.tasks) {
      const tRef = doc(db, 'events', eventId, 'tasks', task.id);
      batch.set(tRef, task, { merge: true });
    }
  }

  // Vendors
  if (event.vendors?.length) {
    for (const vendor of event.vendors) {
      const vRef = doc(db, 'events', eventId, 'vendors', vendor.id);
      batch.set(vRef, vendor, { merge: true });
    }
  }

  // Guests & RSVP tokens
  if (event.guests?.length) {
    for (const guest of event.guests) {
      const gRef = doc(db, 'events', eventId, 'guests', guest.id);
      batch.set(gRef, guest, { merge: true });

      // Save public RSVP lookup token
      if (guest.rsvpToken) {
        const tokenRef = doc(db, 'rsvpTokens', guest.rsvpToken);
        batch.set(tokenRef, {
          token: guest.rsvpToken,
          eventId,
          eventTitle: event.details.title,
          guestId: guest.id,
          guestName: guest.name,
          rsvpStatus: guest.rsvpStatus,
          dietaryNeeds: guest.dietaryNeeds,
          dietaryNotes: guest.dietaryNotes || '',
          plusOnes: guest.plusOnes || 0,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
  }

  // Ideas / Themes
  if (event.themes?.length) {
    for (const theme of event.themes) {
      const iRef = doc(db, 'events', eventId, 'ideas', theme.id);
      batch.set(iRef, theme, { merge: true });
    }
  }

  // Venues
  if (event.venues?.length) {
    for (const venue of event.venues) {
      const vnRef = doc(db, 'events', eventId, 'venues', venue.id);
      batch.set(vnRef, venue, { merge: true });
    }
  }

  // Run of Show
  if (event.runOfShow?.length) {
    for (const ros of event.runOfShow) {
      const rRef = doc(db, 'events', eventId, 'runOfShow', ros.id);
      batch.set(rRef, ros, { merge: true });
    }
  }

  // Issue log
  if (event.issues?.length) {
    for (const issue of event.issues) {
      const isRef = doc(db, 'events', eventId, 'issueLog', issue.id);
      batch.set(isRef, issue, { merge: true });
    }
  }

  // Chat history
  if (event.chatHistory?.length) {
    for (const msg of event.chatHistory) {
      const cRef = doc(db, 'events', eventId, 'chatMessages', msg.id);
      batch.set(cRef, msg, { merge: true });
    }
  }

  await batch.commit();
}

/**
 * Loads a single event by ID with its subcollections from Firestore.
 */
export async function loadEventFromFirestore(eventId: string): Promise<EventFull | null> {
  try {
    const eventRef = doc(db, 'events', eventId);
    const snap = await getDoc(eventRef);
    if (!snap.exists()) return null;

    const details = snap.data() as EventDetails;

    // Load subcollections in parallel
    const [
      secSnap,
      budSnap,
      tskSnap,
      vndSnap,
      gstSnap,
      thmSnap,
      vnuSnap,
      rosSnap,
      issSnap,
      chtSnap,
    ] = await Promise.all([
      getDocs(collection(db, 'events', eventId, 'planSections')),
      getDocs(collection(db, 'events', eventId, 'budgetItems')),
      getDocs(collection(db, 'events', eventId, 'tasks')),
      getDocs(collection(db, 'events', eventId, 'vendors')),
      getDocs(collection(db, 'events', eventId, 'guests')),
      getDocs(collection(db, 'events', eventId, 'ideas')),
      getDocs(collection(db, 'events', eventId, 'venues')),
      getDocs(collection(db, 'events', eventId, 'runOfShow')),
      getDocs(collection(db, 'events', eventId, 'issueLog')),
      getDocs(collection(db, 'events', eventId, 'chatMessages')),
    ]);

    return {
      details,
      planSections: secSnap.docs.map((d) => d.data() as PlanSection),
      budgetItems: budSnap.docs.map((d) => d.data() as BudgetItem),
      budgetAllocations: (details as any).budgetAllocations || [],
      savingsSuggestions: (details as any).savingsSuggestions || [],
      tasks: tskSnap.docs.map((d) => d.data() as TimelineTask),
      vendors: vndSnap.docs.map((d) => d.data() as Vendor),
      guests: gstSnap.docs.map((d) => d.data() as Guest),
      seatingTables: (details as any).seatingTables || [],
      themes: thmSnap.docs.map((d) => d.data() as ThemeIdea),
      menu: (details as any).menu || [],
      venues: vnuSnap.docs.map((d) => d.data() as VenueRecommendation),
      runOfShow: rosSnap.docs.map((d) => d.data() as RunOfShowItem),
      issues: issSnap.docs.map((d) => d.data() as IssueLogItem),
      chatHistory: chtSnap.docs.map((d) => d.data() as ChatMessage),
    };
  } catch (error) {
    console.error(`Failed to load event ${eventId} from Firestore:`, error);
    return null;
  }
}

/**
 * Loads all events accessible to the user (owned or collaborated) from Firestore.
 */
export async function loadUserEventsFromFirestore(
  userId: string,
  userEmail?: string
): Promise<EventFull[]> {
  try {
    const eventsRef = collection(db, 'events');

    // Query 1: Owned events
    const ownedQuery = query(eventsRef, where('ownerId', '==', userId));
    const ownedSnaps = await getDocs(ownedQuery);

    const eventIds = new Set<string>();
    ownedSnaps.forEach((docSnap) => eventIds.add(docSnap.id));

    // Query 2: Collaborator by UID
    try {
      const collabUidQuery = query(
        eventsRef,
        where('collaboratorUids', 'array-contains', userId)
      );
      const collabUidSnaps = await getDocs(collabUidQuery);
      collabUidSnaps.forEach((docSnap) => eventIds.add(docSnap.id));
    } catch {
      // Ignored if index not built yet or field empty
    }

    // Query 3: Collaborator by Email
    if (userEmail) {
      try {
        const collabEmailQuery = query(
          eventsRef,
          where('collaboratorEmails', 'array-contains', userEmail.toLowerCase())
        );
        const collabEmailSnaps = await getDocs(collabEmailQuery);
        collabEmailSnaps.forEach((docSnap) => eventIds.add(docSnap.id));
      } catch {
        // Ignored if field empty
      }
    }

    // Load full details for each unique event
    const results: EventFull[] = [];
    for (const eventId of eventIds) {
      const loaded = await loadEventFromFirestore(eventId);
      if (loaded) results.push(loaded);
    }

    return results;
  } catch (error) {
    console.error('Error fetching user events from Firestore:', error);
    return [];
  }
}

/**
 * Deletes an event and its root doc.
 */
export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  const eventRef = doc(db, 'events', eventId);
  await deleteDoc(eventRef);
}

/**
 * Updates a single task in Firestore.
 */
export async function updateTaskInFirestore(
  eventId: string,
  taskId: string,
  data: Partial<TimelineTask>
): Promise<void> {
  const tRef = doc(db, 'events', eventId, 'tasks', taskId);
  await updateDoc(tRef, data);
}

/**
 * Updates a single budget item in Firestore.
 */
export async function updateBudgetItemInFirestore(
  eventId: string,
  itemId: string,
  data: Partial<BudgetItem>
): Promise<void> {
  const bRef = doc(db, 'events', eventId, 'budgetItems', itemId);
  await updateDoc(bRef, data);
}

/**
 * Updates a single guest in Firestore.
 */
export async function updateGuestInFirestore(
  eventId: string,
  guestId: string,
  data: Partial<Guest>
): Promise<void> {
  const gRef = doc(db, 'events', eventId, 'guests', guestId);
  await updateDoc(gRef, data);
}

/**
 * Updates an RSVP token status (publicly callable by unauthenticated guests).
 */
export async function updateRsvpTokenStatus(
  token: string,
  update: {
    rsvpStatus: 'confirmed' | 'declined';
    dietaryNeeds?: string;
    dietaryNotes?: string;
    plusOnes?: number;
  }
): Promise<{ success: boolean; eventId?: string; guestId?: string }> {
  try {
    const tokenRef = doc(db, 'rsvpTokens', token);
    const snap = await getDoc(tokenRef);
    if (!snap.exists()) {
      return { success: false };
    }

    const tokenData = snap.data();
    await updateDoc(tokenRef, {
      ...update,
      submittedAt: new Date().toISOString(),
    });

    // Update guest record under event if permissions permit
    if (tokenData.eventId && tokenData.guestId) {
      try {
        const guestRef = doc(db, 'events', tokenData.eventId, 'guests', tokenData.guestId);
        await updateDoc(guestRef, {
          rsvpStatus: update.rsvpStatus,
          dietaryNeeds: update.dietaryNeeds || 'standard',
          dietaryNotes: update.dietaryNotes || '',
          plusOnes: update.plusOnes ?? 0,
          submittedAt: new Date().toISOString(),
        });
      } catch {
        // If unauthenticated guest, guest doc update will rely on server/collaborator sync
      }
    }

    return {
      success: true,
      eventId: tokenData.eventId,
      guestId: tokenData.guestId,
    };
  } catch (error) {
    console.error('Failed to update RSVP token:', error);
    return { success: false };
  }
}
