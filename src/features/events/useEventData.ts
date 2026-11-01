import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import {
  EventFull,
  EventDetails,
  TimelineTask,
  BudgetItem,
  Guest,
} from '../../types';
import {
  loadEventFromFirestore,
  loadUserEventsFromFirestore,
  prepareEventDocData,
} from '../../services/firestoreService';
import { seedDemoEventsToFirestore } from '../../services/seedFirestore';
import { getStoredEvents, getEventById, upsertEvent } from '../../lib/storage';
import { useToast } from '../../components/ui/Toast';

/**
 * Hook to retrieve and subscribe to all events accessible to the current user.
 * Combines Firestore onSnapshot for real-time live updates with offline cache.
 */
export function useEventsList() {
  const { user, firebaseUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = firebaseUser?.uid || user?.id || '';
  const userEmail = firebaseUser?.email || user?.email || '';

  // Initial fetch from Firestore / fallback to offline cache
  const queryResult = useQuery<EventFull[]>({
    queryKey: ['events', userId],
    queryFn: async () => {
      if (!userId) return getStoredEvents();
      try {
        const remoteEvents = await loadUserEventsFromFirestore(userId, userEmail);
        if (remoteEvents.length > 0) {
          // Update offline cache
          remoteEvents.forEach((ev) => upsertEvent(ev));
          return remoteEvents;
        }
      } catch (err) {
        console.warn('[useEventsList] Failed to load remote events, using local cache:', err);
      }
      return getStoredEvents();
    },
    enabled: true,
  });

  // Real-time onSnapshot subscription
  useEffect(() => {
    if (!userId) return;

    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('ownerId', '==', userId));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const remoteEvents: EventFull[] = [];
          for (const docSnap of snapshot.docs) {
            const eventId = docSnap.id;
            const fullEvent = await loadEventFromFirestore(eventId);
            if (fullEvent) {
              remoteEvents.push(fullEvent);
              upsertEvent(fullEvent);
            }
          }
          if (remoteEvents.length > 0) {
            queryClient.setQueryData(['events', userId], remoteEvents);
          }
        },
        (error) => {
          console.warn('[useEventsList] Snapshot listener error:', error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[useEventsList] Could not attach snapshot listener:', err);
    }
  }, [userId, queryClient]);

  return queryResult;
}

/**
 * Hook to subscribe to a single event with subcollections in real-time.
 */
export function useEvent(eventId: string) {
  const queryClient = useQueryClient();

  const queryResult = useQuery<EventFull | null>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      try {
        const loaded = await loadEventFromFirestore(eventId);
        if (loaded) {
          upsertEvent(loaded);
          return loaded;
        }
      } catch (err) {
        console.warn(`[useEvent] Firestore load failed for ${eventId}, trying offline cache:`, err);
      }
      return getEventById(eventId) || null;
    },
    enabled: !!eventId,
  });

  // Real-time listener on the event document
  useEffect(() => {
    if (!eventId) return;

    try {
      const eventRef = doc(db, 'events', eventId);
      const unsubscribe = onSnapshot(
        eventRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            const fullEvent = await loadEventFromFirestore(eventId);
            if (fullEvent) {
              queryClient.setQueryData(['event', eventId], fullEvent);
              upsertEvent(fullEvent);
            }
          }
        },
        (error) => {
          console.warn(`[useEvent] Snapshot listener error on ${eventId}:`, error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[useEvent] Listener setup error:', err);
    }
  }, [eventId, queryClient]);

  return queryResult;
}

/**
 * Hook for tasks subcollection with real-time onSnapshot updates.
 */
export function useTasks(eventId: string) {
  const queryClient = useQueryClient();

  const queryResult = useQuery<TimelineTask[]>({
    queryKey: ['event', eventId, 'tasks'],
    queryFn: async () => {
      const full = await loadEventFromFirestore(eventId);
      return full?.tasks || getEventById(eventId)?.tasks || [];
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (!eventId) return;
    try {
      const tasksRef = collection(db, 'events', eventId, 'tasks');
      const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
        const tasks: TimelineTask[] = snapshot.docs.map((d) => d.data() as TimelineTask);
        if (tasks.length > 0) {
          queryClient.setQueryData(['event', eventId, 'tasks'], tasks);
        }
      });
      return () => unsubscribe();
    } catch {}
  }, [eventId, queryClient]);

  return queryResult;
}

/**
 * Optimistic mutation for updating a task with immediate UI feedback and rollback.
 */
export function useUpdateTask(eventId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<TimelineTask> }) => {
      const tRef = doc(db, 'events', eventId, 'tasks', taskId);
      await updateDoc(tRef, data);
    },
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['event', eventId] });
      const previousEvent = queryClient.getQueryData<EventFull>(['event', eventId]);

      if (previousEvent && previousEvent.tasks) {
        const updatedTasks = previousEvent.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t));
        queryClient.setQueryData(['event', eventId], {
          ...previousEvent,
          tasks: updatedTasks,
        });
      }

      return { previousEvent };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(['event', eventId], context.previousEvent);
      }
      showToast({ type: 'error', title: 'Task Update Failed', description: 'Changes could not be saved to Firestore.' });
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Task Updated' });
    },
  });
}

/**
 * Optimistic mutation for updating a budget item with immediate UI feedback.
 */
export function useUpdateBudgetItem(eventId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<BudgetItem> }) => {
      const bRef = doc(db, 'events', eventId, 'budgetItems', itemId);
      await updateDoc(bRef, data);
    },
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['event', eventId] });
      const previousEvent = queryClient.getQueryData<EventFull>(['event', eventId]);

      if (previousEvent && previousEvent.budgetItems) {
        const updatedItems = previousEvent.budgetItems.map((b) => (b.id === itemId ? { ...b, ...data } : b));
        queryClient.setQueryData(['event', eventId], {
          ...previousEvent,
          budgetItems: updatedItems,
        });
      }

      return { previousEvent };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(['event', eventId], context.previousEvent);
      }
      showToast({ type: 'error', title: 'Budget Update Failed', description: 'Could not sync changes to Firestore.' });
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Budget Line Updated' });
    },
  });
}

/**
 * Optimistic mutation for updating a guest.
 */
export function useUpdateGuest(eventId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ guestId, data }: { guestId: string; data: Partial<Guest> }) => {
      const gRef = doc(db, 'events', eventId, 'guests', guestId);
      await updateDoc(gRef, data);
    },
    onMutate: async ({ guestId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['event', eventId] });
      const previousEvent = queryClient.getQueryData<EventFull>(['event', eventId]);

      if (previousEvent && previousEvent.guests) {
        const updatedGuests = previousEvent.guests.map((g) => (g.id === guestId ? { ...g, ...data } : g));
        queryClient.setQueryData(['event', eventId], {
          ...previousEvent,
          guests: updatedGuests,
        });
      }

      return { previousEvent };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(['event', eventId], context.previousEvent);
      }
      showToast({ type: 'error', title: 'Guest Update Failed' });
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Guest Details Updated' });
    },
  });
}

/**
 * Mutation to seed sample demo events directly into the user's private Firestore namespace.
 */
export function useSeedSampleEvents() {
  const queryClient = useQueryClient();
  const { firebaseUser, user } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const uid = firebaseUser?.uid || user?.id || 'planner_current';
      const email = firebaseUser?.email || user?.email || '';
      return await seedDemoEventsToFirestore(uid, email);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        showToast({
          type: 'success',
          title: 'Sample Events Loaded',
          description: `Imported ${result.seededCount} events into your Firestore workspace.`,
        });
      } else {
        showToast({ type: 'error', title: 'Seeding Failed', description: result.message });
      }
    },
    onError: (err: any) => {
      showToast({ type: 'error', title: 'Seeding Failed', description: err.message });
    },
  });
}
