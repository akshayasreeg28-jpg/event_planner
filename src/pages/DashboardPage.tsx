import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar,
  DollarSign,
  CheckSquare,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  RefreshCw,
  Flame,
  AlertTriangle,
  Database,
  CheckCircle2,
  ListTodo,
  ExternalLink,
  ChevronRight,
  CloudSun,
  ShieldAlert,
  Send,
  Zap,
} from 'lucide-react';
import { getStoredEvents, getCurrentUser, resetDemoEvents, upsertEvent } from '../lib/storage';
import { loadUserEventsFromFirestore } from '../services/firestoreService';
import { seedDemoEventsToFirestore } from '../services/seedFirestore';
import { useAuth } from '../features/auth/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { formatMinorToCurrency, getDaysRemaining, formatDateDisplay } from '../lib/formatters';
import { useToast } from '../components/ui/Toast';
import { EventFull, TimelineTask, EventType } from '../types';
import { parseEventSentence, ParsedEventSentence } from '../lib/sentencePlanParser';
import { DEFAULT_BUDGET_CATEGORIES, HERO_IMAGES } from '../lib/constants';

export const DashboardPage: React.FC = () => {
  const [events, setEvents] = useState<EventFull[]>(() => getStoredEvents());
  const [user, setUser] = useState(getCurrentUser());
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // "Plan my event in one sentence" state
  const [sentenceInput, setSentenceInput] = useState('');
  const [clarifyModalOpen, setClarifyModalOpen] = useState(false);
  const [parsedSentence, setParsedSentence] = useState<ParsedEventSentence | null>(null);

  // Clarification form fields
  const [clarifyGuestCount, setClarifyGuestCount] = useState<number>(100);
  const [clarifyBudgetMinor, setClarifyBudgetMinor] = useState<number>(50000000); // ₹5L
  const [clarifyDate, setClarifyDate] = useState<string>('2026-06-15');
  const [clarifyCity, setClarifyCity] = useState<string>('Chennai');

  // Quick Task Modal
  const [quickTaskModalOpen, setQuickTaskModalOpen] = useState(false);
  const [selectedEventIdForTask, setSelectedEventIdForTask] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handleUpdate = () => setEvents(getStoredEvents());
    const handleUser = () => setUser(getCurrentUser());

    window.addEventListener('event_ai_data_updated', handleUpdate);
    window.addEventListener('event_ai_user_changed', handleUser);
    return () => {
      window.removeEventListener('event_ai_data_updated', handleUpdate);
      window.removeEventListener('event_ai_user_changed', handleUser);
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    let isMounted = true;
    const fetchCloudEvents = async () => {
      setIsSyncing(true);
      try {
        const cloudEvents = await loadUserEventsFromFirestore(
          firebaseUser.uid,
          firebaseUser.email || undefined
        );
        if (isMounted && cloudEvents.length > 0) {
          cloudEvents.forEach((ev) => upsertEvent(ev));
          setEvents(getStoredEvents());
        }
      } catch (err) {
        console.warn('Background Firestore sync skipped:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };
    fetchCloudEvents();
    return () => {
      isMounted = false;
    };
  }, [firebaseUser]);

  // Derived budget & calculations
  const totalBudgetManagedMinor = events.reduce((acc, e) => acc + e.details.totalBudgetMinor, 0);
  const totalPaidBudgetMinor = events.reduce((acc, e) => {
    const paidInEvent = (e.budgetItems || []).reduce((sum, item) => sum + (item.paidAmountMinor || 0), 0);
    return acc + paidInEvent;
  }, 0);

  const allTasks = useMemo(() => {
    return events.flatMap((e) =>
      (e.tasks || []).map((t) => ({
        ...t,
        eventId: e.details.id,
        eventTitle: e.details.title,
        currency: e.details.currency,
      }))
    );
  }, [events]);

  const upcomingDeadlines = useMemo(() => {
    return allTasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [allTasks]);

  // Featured upcoming event
  const sortedUpcomingEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.details.date).getTime() - new Date(b.details.date).getTime());
  }, [events]);

  const featuredEvent = sortedUpcomingEvents[0];
  const featuredCountdown = featuredEvent ? getDaysRemaining(featuredEvent.details.date) : null;

  // Next Best Action generator
  const nextBestAction = useMemo(() => {
    if (!featuredEvent) {
      return {
        title: 'Plan Your First Celebration',
        description: 'Use the one-sentence planner or launch the multi-step studio wizard to craft your master itinerary.',
        actionLabel: 'Launch Wizard',
        onClick: () => navigate('/wizard'),
        priority: 'high',
      };
    }

    // Check for overdue tasks
    const overdueTask = featuredEvent.tasks.find((t) => {
      if (t.status === 'completed') return false;
      return getDaysRemaining(t.deadline).isPast;
    });
    if (overdueTask) {
      return {
        title: `Overdue Deadline: ${overdueTask.title}`,
        description: `This milestone for "${featuredEvent.details.title}" was due on ${formatDateDisplay(overdueTask.deadline)}. Resolve or reschedule now.`,
        actionLabel: 'Open Timeline',
        onClick: () => navigate(`/events/${featuredEvent.details.id}?tab=timeline`),
        priority: 'critical',
      };
    }

    // Check budget variance
    const hasOverspend = featuredEvent.budgetItems.some(
      (b) => b.actualAmountMinor > b.estimatedAmountMinor * 1.1
    );
    if (hasOverspend) {
      return {
        title: 'Category Budget Drift Detected',
        description: `One or more expense items in "${featuredEvent.details.title}" exceed estimates by >10%. Review AI savings suggestions.`,
        actionLabel: 'Review Budget',
        onClick: () => navigate(`/events/${featuredEvent.details.id}?tab=budget`),
        priority: 'warning',
      };
    }

    // Check RSVP invites
    const uninvitedCount = featuredEvent.guests.filter((g) => g.invitationStatus === 'unsent').length;
    if (uninvitedCount > 0) {
      return {
        title: `Send ${uninvitedCount} Pending Invitations`,
        description: `You have ${uninvitedCount} guests awaiting RSVP links with WhatsApp invitation copy ready.`,
        actionLabel: 'Send Invites',
        onClick: () => navigate(`/events/${featuredEvent.details.id}?tab=guests`),
        priority: 'medium',
      };
    }

    return {
      title: 'Run Final Run-of-Show Rehearsal',
      description: `All vendors and tasks are on track for "${featuredEvent.details.title}". Check Event Day Mode to verify sequence.`,
      actionLabel: 'View Event Day',
      onClick: () => navigate(`/events/${featuredEvent.details.id}?tab=event-day`),
      priority: 'normal',
    };
  }, [featuredEvent, navigate]);

  // Handle "Plan my event in one sentence" submit
  const handleSentenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentenceInput.trim()) return;

    const parsed = parseEventSentence(sentenceInput);
    setParsedSentence(parsed);

    // If missing any fields, prompt user in modal
    if (parsed.missingFields.length > 0) {
      if (parsed.guestCount) setClarifyGuestCount(parsed.guestCount);
      if (parsed.budgetMinor) setClarifyBudgetMinor(parsed.budgetMinor);
      if (parsed.date) setClarifyDate(parsed.date);
      if (parsed.city) setClarifyCity(parsed.city);
      setClarifyModalOpen(true);
    } else {
      // Complete! Create event directly
      createEventFromSentence(parsed, parsed.guestCount!, parsed.budgetMinor!, parsed.date!, parsed.city);
    }
  };

  const createEventFromSentence = (
    parsed: ParsedEventSentence,
    guests: number,
    budgetMinor: number,
    date: string,
    city: string
  ) => {
    const defaultAllocations = DEFAULT_BUDGET_CATEGORIES[parsed.type] || DEFAULT_BUDGET_CATEGORIES.wedding;
    const coverImage =
      parsed.type === 'wedding'
        ? HERO_IMAGES.wedding
        : parsed.type === 'college_fest'
        ? HERO_IMAGES.collegeFest
        : HERO_IMAGES.birthday;

    const newEvent: EventFull = {
      details: {
        id: `evt_${Date.now()}`,
        title: parsed.title,
        type: parsed.type,
        date: date,
        city: city,
        venueType: 'indoor',
        estimatedGuestCount: guests,
        totalBudgetMinor: budgetMinor,
        currency: parsed.currency,
        dietaryPreferences: ['Vegetarian', 'Vegan options'],
        ownerId: firebaseUser?.uid || user.id,
        collaborators: [],
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        coverImage,
        ecoScore: { score: 85, rating: 'Silver', tips: ['Select local vendors and digital invitations'] },
      },
      planSections: [
        {
          id: `sec_1_${Date.now()}`,
          sectionKey: 'overview',
          title: 'Executive Architectural Vision',
          content: `${parsed.title} planned for ${city} with ${guests} honored attendees. Total budget anchored at ${formatMinorToCurrency(budgetMinor, parsed.currency)}.`,
          lastUpdated: new Date().toISOString(),
          versions: [],
        },
      ],
      budgetAllocations: defaultAllocations.map((a) => ({
        category: a.category,
        targetPercentage: a.defaultPercent,
      })),
      budgetItems: defaultAllocations.slice(0, 4).map((a, idx) => ({
        id: `bgt_${Date.now()}_${idx}`,
        category: a.category,
        name: `${a.category} Primary Booking`,
        estimatedAmountMinor: Math.round((budgetMinor * a.defaultPercent) / 100),
        actualAmountMinor: 0,
        paidAmountMinor: 0,
        status: 'pending',
      })),
      savingsSuggestions: [],
      tasks: [
        {
          id: `tsk_${Date.now()}_1`,
          title: 'Confirm venue contract and security deposit',
          deadline: date,
          phase: 'Booking & Vendors',
          priority: 'critical',
          status: 'not_started',
          dependencies: [],
          assignee: user.name,
        },
        {
          id: `tsk_${Date.now()}_2`,
          title: 'Lock catering head count and tasting session',
          deadline: date,
          phase: 'Booking & Vendors',
          priority: 'high',
          status: 'not_started',
          dependencies: [],
          assignee: user.name,
        },
      ],
      vendors: [],
      guests: [
        {
          id: `gst_${Date.now()}_1`,
          name: 'Primary VIP Family / Executive Host',
          groupSide: 'general',
          plusOnes: 1,
          dietaryNeeds: 'standard',
          invitationStatus: 'unsent',
          rsvpStatus: 'pending',
          rsvpToken: `tok_${Math.random().toString(36).substring(2, 9)}`,
        },
      ],
      seatingTables: [],
      themes: [],
      menu: [],
      venues: [],
      runOfShow: [],
      issues: [],
      chatHistory: [],
    };

    upsertEvent(newEvent);
    setEvents(getStoredEvents());
    setClarifyModalOpen(false);
    setSentenceInput('');
    showToast({
      type: 'success',
      title: 'Event Generated from Sentence!',
      description: `Created "${newEvent.details.title}" with instant architectural blueprint.`,
    });
    navigate(`/events/${newEvent.details.id}`);
  };

  const handleToggleTask = (eventId: string, taskId: string) => {
    const target = events.find((e) => e.details.id === eventId);
    if (!target) return;
    const updated = {
      ...target,
      tasks: target.tasks.map((t) => (t.id === taskId ? { ...t, status: t.status === 'completed' ? 'in_progress' : 'completed' } : t)),
    };
    upsertEvent(updated as any);
    setEvents(getStoredEvents());
    showToast({ type: 'success', title: 'Task updated' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[var(--app-text)]">Celebration Dashboard</h1>
          <p className="text-xs sm:text-sm text-[var(--app-text-muted)] mt-1">
            Real-time multi-event intelligence, integer budget telemetry, and backward scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickTaskModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-[#FF7A6B]" />}
          >
            Quick Task
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/wizard')}
            leftIcon={<Sparkles className="w-4 h-4 text-[#FF7A6B]" />}
          >
            New Event Studio
          </Button>
        </div>
      </div>

      {/* "Plan My Event in One Sentence" Smart Hero Card */}
      <Card variant="raised" padding="lg" className="border-2 border-[var(--app-border)] shadow-md overflow-hidden relative">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-[#FF7A6B]" />
          <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#4B2A7B]">
            Plan My Event in One Sentence
          </span>
          <Badge variant="purple" size="sm">Instant Architecture</Badge>
        </div>

        <h2 className="text-lg font-serif font-bold text-[var(--app-text)] mb-3">
          Describe what you're hosting. We'll construct the entire plan.
        </h2>

        <form onSubmit={handleSentenceSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full">
            <input
              type="text"
              value={sentenceInput}
              onChange={(e) => setSentenceInput(e.target.value)}
              placeholder="e.g. Sister's engagement, 150 guests, Chennai, ₹8 lakh, March"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-subtle)] text-sm text-[var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            rightIcon={<Send className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0"
          >
            Build Plan
          </Button>
        </form>

        {/* Quick Example Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-[var(--app-text-muted)]">
          <span className="font-mono text-[10px] uppercase">Try:</span>
          {[
            "Sister's engagement, 150 guests, Chennai, ₹8 lakh, March",
            "Annual College Tech Fest, 600 students, Bengaluru, ₹4.5 lakh, April",
            "Aarav's 5th Birthday, 50 guests, Mumbai, ₹85,000, May",
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setSentenceInput(sample)}
              className="px-2.5 py-1 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)] hover:border-[#4B2A7B] text-[11px] text-[var(--app-text)] transition-colors truncate max-w-xs"
            >
              {sample}
            </button>
          ))}
        </div>
      </Card>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Bento 1: Next Event Countdown Ring (large tile) */}
        {featuredEvent && (
          <Card
            variant="default"
            padding="lg"
            className="md:col-span-2 lg:col-span-2 flex flex-col justify-between border border-[var(--app-border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#FF7A6B] font-bold">
                  Next Upcoming Celebration
                </span>
                <h3 className="text-2xl font-bold font-serif text-[var(--app-text)] mt-1">
                  {featuredEvent.details.title}
                </h3>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                  {formatDateDisplay(featuredEvent.details.date)} · {featuredEvent.details.city} · {featuredEvent.details.estimatedGuestCount} Guests
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/events/${featuredEvent.details.id}`)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Workspace
              </Button>
            </div>

            {/* Countdown Ring & Metric */}
            <div className="flex items-center gap-8 my-6">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-[var(--app-border)]"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - Math.min(Math.max((featuredCountdown?.days || 0) / 100, 0.05), 1))}
                    strokeLinecap="round"
                    className="text-[#4B2A7B]"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold font-mono text-[#4B2A7B]">
                    {Math.max(featuredCountdown?.days || 0, 0)}
                  </span>
                  <span className="text-[9px] uppercase font-mono text-[var(--app-text-muted)]">Days Left</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF7A6B]" />
                  <span className="text-[var(--app-text)] font-semibold">
                    Target Date: {featuredEvent.details.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-[var(--app-text)] font-mono">
                    Budget: {formatMinorToCurrency(featuredEvent.details.totalBudgetMinor, featuredEvent.details.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-[var(--app-text)]">
                    RSVPs: {featuredEvent.guests.filter((g) => g.rsvpStatus === 'confirmed').length} / {featuredEvent.details.estimatedGuestCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--app-border)] flex items-center justify-between text-xs text-[var(--app-text-muted)]">
              <span>Status: <span className="font-semibold text-emerald-600 uppercase">{featuredEvent.details.status}</span></span>
              <span>Eco-Score: <span className="font-bold text-[#4B2A7B]">{featuredEvent.details.ecoScore?.score || 85}/100</span></span>
            </div>
          </Card>
        )}

        {/* Bento 2: AI Next Best Action Card */}
        <Card
          variant="raised"
          padding="lg"
          className="md:col-span-1 lg:col-span-2 flex flex-col justify-between border-2 border-[#4B2A7B]/20 shadow-sm bg-gradient-to-br from-[var(--app-surface)] to-[var(--app-surface-subtle)]"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#FF7A6B]" />
              <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#4B2A7B]">
                AI Next Best Action
              </span>
            </div>
            <h3 className="text-lg font-bold font-serif text-[var(--app-text)]">{nextBestAction.title}</h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-2 leading-relaxed">
              {nextBestAction.description}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--app-border)] flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#FF7A6B] font-bold">
              Suggested Today
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={nextBestAction.onClick}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              {nextBestAction.actionLabel}
            </Button>
          </div>
        </Card>

        {/* Bento 3: Budget Health Gauge */}
        <Card variant="default" padding="md" className="space-y-3 border border-[var(--app-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[var(--app-text-muted)] font-bold">
              Managed Capital
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-xl font-bold font-mono text-[var(--app-text)]">
              {formatMinorToCurrency(totalBudgetManagedMinor, 'INR')}
            </span>
            <span className="text-[10px] text-[var(--app-text-muted)] block mt-0.5">
              Paid Out: {formatMinorToCurrency(totalPaidBudgetMinor, 'INR')}
            </span>
          </div>
          <ProgressBar
            value={totalBudgetManagedMinor > 0 ? (totalPaidBudgetMinor / totalBudgetManagedMinor) * 100 : 0}
            size="sm"
            color="purple"
          />
          <span className="text-[10px] text-[var(--app-text-muted)] font-mono block">
            Variance alerts active (0 rounding errors)
          </span>
        </Card>

        {/* Bento 4: Weather Chip for nearest event */}
        <Card variant="default" padding="md" className="space-y-3 border border-[var(--app-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[var(--app-text-muted)] font-bold">
              Forecast / Climate
            </span>
            <CloudSun className="w-4 h-4 text-[#FF7A6B]" />
          </div>
          <div>
            <span className="text-xl font-bold font-serif text-[var(--app-text)]">
              {featuredEvent?.details.city || 'Chennai'}
            </span>
            <span className="text-xs text-amber-600 font-semibold block mt-0.5">
              28°C · Pleasant & Sunny
            </span>
          </div>
          <p className="text-[10px] text-[var(--app-text-muted)] leading-tight">
            Open-Meteo verified coordinates for outdoor dining comfort.
          </p>
        </Card>

        {/* Bento 5: Tasks Due This Week */}
        <Card variant="default" padding="md" className="md:col-span-2 space-y-3 border border-[var(--app-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-[#4B2A7B]" />
              <span className="text-xs font-mono uppercase text-[var(--app-text-muted)] font-bold">
                Upcoming Deadlines
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#4B2A7B]">
              {upcomingDeadlines.length} Due Soon
            </span>
          </div>

          <div className="space-y-2">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-[var(--app-text-muted)] py-4 text-center">
                All milestones clear! No pending tasks due this week.
              </p>
            ) : (
              upcomingDeadlines.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--app-surface-subtle)] border border-[var(--app-border)] text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(t.eventId, t.id)}
                      className="w-4 h-4 rounded border border-[var(--app-border)] hover:bg-[#4B2A7B] hover:text-white flex items-center justify-center transition-colors"
                    >
                      {t.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <span className="font-semibold text-[var(--app-text)] truncate">{t.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--app-text-muted)] shrink-0 ml-2">
                    {t.deadline}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Clarification Modal for Missing Fields */}
      <Modal
        isOpen={clarifyModalOpen}
        onClose={() => setClarifyModalOpen(false)}
        title="Clarify Missing Event Details"
      >
        <div className="space-y-4 text-sm text-[var(--app-text)]">
          <p className="text-xs text-[var(--app-text-muted)]">
            We extracted your event type and title! Please confirm the few remaining details to finalize:
          </p>

          {parsedSentence?.missingFields.includes('city') && (
            <div>
              <label className="block text-xs font-semibold mb-1">Host City</label>
              <input
                type="text"
                value={clarifyCity}
                onChange={(e) => setClarifyCity(e.target.value)}
                placeholder="e.g. Chennai, Mumbai, Bengaluru"
                className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] text-xs"
              />
            </div>
          )}

          {parsedSentence?.missingFields.includes('guestCount') && (
            <div>
              <label className="block text-xs font-semibold mb-1">Estimated Guest Count</label>
              <input
                type="number"
                value={clarifyGuestCount}
                onChange={(e) => setClarifyGuestCount(parseInt(e.target.value, 10) || 50)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] text-xs"
              />
            </div>
          )}

          {parsedSentence?.missingFields.includes('budget') && (
            <div>
              <label className="block text-xs font-semibold mb-1">Total Budget (in ₹)</label>
              <input
                type="number"
                value={clarifyBudgetMinor / 100}
                onChange={(e) => setClarifyBudgetMinor((parseInt(e.target.value, 10) || 500000) * 100)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] text-xs"
              />
            </div>
          )}

          {parsedSentence?.missingFields.includes('date') && (
            <div>
              <label className="block text-xs font-semibold mb-1">Celebration Date</label>
              <input
                type="date"
                value={clarifyDate}
                onChange={(e) => setClarifyDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] text-xs"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setClarifyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (parsedSentence) {
                  createEventFromSentence(
                    parsedSentence,
                    clarifyGuestCount,
                    clarifyBudgetMinor,
                    clarifyDate,
                    clarifyCity
                  );
                }
              }}
            >
              Confirm & Generate Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Task Creation Modal */}
      <Modal
        isOpen={quickTaskModalOpen}
        onClose={() => setQuickTaskModalOpen(false)}
        title="Create Quick Milestone Task"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedEventIdForTask || !newTaskTitle || !newTaskDeadline) {
              showToast({ type: 'error', title: 'Fill all fields' });
              return;
            }
            const target = events.find((ev) => ev.details.id === selectedEventIdForTask);
            if (!target) return;
            const newTask: TimelineTask = {
              id: `tsk_${Date.now()}`,
              title: newTaskTitle,
              deadline: newTaskDeadline,
              phase: 'Booking & Vendors',
              priority: newTaskPriority,
              status: 'not_started',
              dependencies: [],
              assignee: user.name,
            };
            upsertEvent({ ...target, tasks: [...target.tasks, newTask] });
            setEvents(getStoredEvents());
            setQuickTaskModalOpen(false);
            setNewTaskTitle('');
            showToast({ type: 'success', title: 'Task created' });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold mb-1">Select Event</label>
            <select
              value={selectedEventIdForTask}
              onChange={(e) => setSelectedEventIdForTask(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]"
            >
              <option value="">Choose event...</option>
              {events.map((ev) => (
                <option key={ev.details.id} value={ev.details.id}>
                  {ev.details.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Task Title</label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Schedule photographer meeting"
              className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Deadline</label>
            <input
              type="date"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setQuickTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
