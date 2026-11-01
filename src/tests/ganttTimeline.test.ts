import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TimelineTask, TimelinePhase } from '../types/index.ts';

describe('Visual Gantt Timeline & Milestone Engine Suite', () => {
  const isMilestone = (task: TimelineTask, eventDate: string) => {
    const titleLower = task.title.toLowerCase();
    return (
      task.priority === 'critical' ||
      task.deadline === eventDate ||
      titleLower.includes('contract') ||
      titleLower.includes('deposit') ||
      titleLower.includes('lock') ||
      titleLower.includes('rsvp') ||
      titleLower.includes('rehearsal') ||
      titleLower.includes('ceremony') ||
      titleLower.includes('final')
    );
  };

  const getPercentageForDate = (dateStr: string, startDateStr: string, endDateStr: string): number => {
    const d = new Date(dateStr).getTime();
    const s = new Date(startDateStr).getTime();
    const e = new Date(endDateStr).getTime();
    const pct = ((d - s) / (e - s)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const mockTasks: TimelineTask[] = [
    {
      id: 't_venue_deposit',
      title: 'Pay Venue Advance Deposit (25%)',
      deadline: '2026-06-15',
      phase: 'Booking & Vendors',
      priority: 'critical',
      status: 'completed',
      dependencies: [],
      assignee: 'Host',
    },
    {
      id: 't_caterer_menu',
      title: 'Finalize Degustation & Menu Selection',
      deadline: '2026-08-10',
      phase: 'Booking & Vendors',
      priority: 'high',
      status: 'completed',
      dependencies: ['t_venue_deposit'],
      assignee: 'Catering Lead',
    },
    {
      id: 't_invites_rsvp',
      title: 'Send Invitations & Lock RSVP Window',
      deadline: '2026-10-01',
      phase: 'Purchasing & Decor',
      priority: 'high',
      status: 'in_progress',
      dependencies: [],
      assignee: 'Event Planner',
    },
    {
      id: 't_decor_floral',
      title: 'Mandap Floral Concept Mockup',
      deadline: '2026-10-15',
      phase: 'Purchasing & Decor',
      priority: 'medium',
      status: 'not_started',
      dependencies: [],
      assignee: 'Decorator',
    },
    {
      id: 't_rehearsal',
      title: 'Sangeet Choreography Final Rehearsal',
      deadline: '2026-11-18',
      phase: 'Final Confirmations',
      priority: 'high',
      status: 'not_started',
      dependencies: [],
      assignee: 'Choreographer',
    },
    {
      id: 't_event_day',
      title: 'Grand Wedding & Reception Ceremony',
      deadline: '2026-11-20',
      phase: 'Event Day',
      priority: 'critical',
      status: 'not_started',
      dependencies: ['t_rehearsal'],
      assignee: 'Day-of Coordinator',
    },
  ];

  const eventDate = '2026-11-20';

  describe('Milestone Identification', () => {
    test('identifies critical path deposits and contracts as milestones', () => {
      const depositTask = mockTasks[0];
      assert.equal(isMilestone(depositTask, eventDate), true);
    });

    test('identifies RSVP deadline and final rehearsal as milestones', () => {
      const rsvpTask = mockTasks[2];
      const rehearsalTask = mockTasks[4];
      assert.equal(isMilestone(rsvpTask, eventDate), true);
      assert.equal(isMilestone(rehearsalTask, eventDate), true);
    });

    test('identifies Event Day target as primary milestone', () => {
      const eventDayTask = mockTasks[5];
      assert.equal(isMilestone(eventDayTask, eventDate), true);
    });

    test('does not classify standard routine tasks as milestones', () => {
      const decorTask = mockTasks[3];
      assert.equal(isMilestone(decorTask, eventDate), false);
    });
  });

  describe('Gantt Horizontal Coordinate Calculations', () => {
    const rangeStart = '2026-06-01';
    const rangeEnd = '2026-12-01';

    test('correctly projects intermediate dates into percentage positions', () => {
      const pctStart = getPercentageForDate(rangeStart, rangeStart, rangeEnd);
      assert.equal(pctStart, 0);

      const pctEnd = getPercentageForDate(rangeEnd, rangeStart, rangeEnd);
      assert.equal(pctEnd, 100);

      // Mid-point roughly in September
      const midPct = getPercentageForDate('2026-09-01', rangeStart, rangeEnd);
      assert.ok(midPct > 45 && midPct < 55);
    });

    test('clamps dates outside visible range within [0, 100%]', () => {
      const beforeRange = getPercentageForDate('2026-01-01', rangeStart, rangeEnd);
      assert.equal(beforeRange, 0);

      const afterRange = getPercentageForDate('2027-02-01', rangeStart, rangeEnd);
      assert.equal(afterRange, 100);
    });
  });

  describe('Phase Grouping and Aggregate Progress', () => {
    test('groups tasks by phase and computes completion ratio', () => {
      const phaseMap = new Map<TimelinePhase, TimelineTask[]>();
      mockTasks.forEach((t) => {
        const list = phaseMap.get(t.phase) || [];
        list.push(t);
        phaseMap.set(t.phase, list);
      });

      const bookingTasks = phaseMap.get('Booking & Vendors') || [];
      assert.equal(bookingTasks.length, 2);

      const completedInBooking = bookingTasks.filter((t) => t.status === 'completed').length;
      assert.equal(completedInBooking, 2);
      const bookingProgress = Math.round((completedInBooking / bookingTasks.length) * 100);
      assert.equal(bookingProgress, 100);

      const decorTasks = phaseMap.get('Purchasing & Decor') || [];
      assert.equal(decorTasks.length, 2);
      const completedInDecor = decorTasks.filter((t) => t.status === 'completed').length;
      assert.equal(completedInDecor, 0);
    });
  });
});
