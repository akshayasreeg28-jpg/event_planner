import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper, StepItem } from '../components/ui/Stepper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EVENT_TYPE_OPTIONS, DEFAULT_BUDGET_CATEGORIES, HERO_IMAGES } from '../lib/constants';
import { EventType, EventFull, PlanSection, BudgetItem } from '../types';
import { apiGeneratePlan } from '../services/api';
import { upsertEvent, getCurrentUser } from '../lib/storage';
import { saveEventToFirestore } from '../services/firestoreService';
import { useAuth } from '../features/auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Palette,
  Utensils,
  HeartHandshake,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Clock,
  Edit2,
  Loader2,
} from 'lucide-react';
import { formatMinorToCurrency, parseCurrencyInputToMinor } from '../lib/formatters';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  fullWizardSchema,
  WizardFormData,
} from '../features/wizard/wizardValidation';
import { parseEventSentence } from '../lib/sentencePlanParser';

const WIZARD_DRAFT_KEY = 'event_ai_wizard_draft_v2';

const WIZARD_STEPS: StepItem[] = [
  { id: 1, title: 'Event Basics', shortTitle: 'Basics' },
  { id: 2, title: 'Location & Venue', shortTitle: 'Venue' },
  { id: 3, title: 'Guests & Budget', shortTitle: 'Budget' },
  { id: 4, title: 'Theme & Aesthetic', shortTitle: 'Theme' },
  { id: 5, title: 'Dining & Dietary', shortTitle: 'Dining' },
  { id: 6, title: 'Culture & Requests', shortTitle: 'Special' },
  { id: 7, title: 'Review & Generate', shortTitle: 'Generate' },
];

const INITIAL_FORM_STATE: WizardFormData = {
  title: '',
  type: 'wedding',
  date: '',
  durationHours: 6,
  city: 'Chennai',
  venueType: 'hybrid',
  venueName: '',
  guestCount: 200,
  budgetInput: '500000',
  currency: 'INR',
  themePreference: 'Royal Traditional Heritage with Warm Fairy Lights',
  dietaryPreferences: ['Vegetarian', 'Jain Options Available'],
  culturalTraditions: 'Traditional Muhurtham & Evening Reception',
  specialRequests: 'Elder-friendly ramp access and quiet lounge zone',
  weddingFunctionsCount: 2,
  corporateAVNeeds: 'Keynote screen, stage roving mics, live stream feed',
  collegePermissionsNeeded: 'Police sound curfew clearance, campus faculty NOC',
};

const EVENT_TEMPLATES = [
  {
    id: 'tpl_wedding',
    name: 'Grand Heritage Wedding',
    badge: 'Popular',
    icon: '💒',
    data: {
      title: 'Kavitha & Arvind’s Grand Heritage Wedding',
      type: 'wedding' as EventType,
      date: '2026-11-28',
      durationHours: 12,
      city: 'Chennai',
      venueType: 'hybrid' as const,
      venueName: 'The Leela Palace Sea Pavilion',
      guestCount: 350,
      budgetInput: '1200000',
      currency: 'INR' as const,
      themePreference: 'Royal Temple Brass, Silk Drapes & Fresh Jasmine Canopy',
      dietaryPreferences: ['Vegetarian', 'Jain Options Available'],
      culturalTraditions: 'Traditional South Indian Muhurtham & Evening Reception',
      specialRequests: 'Elder-friendly wheelchair ramp, bridal suite, live nadaswaram',
      weddingFunctionsCount: 2,
    },
  },
  {
    id: 'tpl_fest',
    name: 'College Cultural Fest',
    badge: 'Campus',
    icon: '🎪',
    data: {
      title: 'Srijan 2026: Annual Inter-College Cultural Fest',
      type: 'college_fest' as EventType,
      date: '2026-10-14',
      durationHours: 36,
      city: 'Bengaluru',
      venueType: 'outdoor' as const,
      venueName: 'Central Campus Amphitheatre',
      guestCount: 1500,
      budgetInput: '800000',
      currency: 'INR' as const,
      themePreference: 'Cyberpunk Neon Glow & Industrial Trusses',
      dietaryPreferences: ['Vegetarian', 'Vegan Options'],
      culturalTraditions: 'Inter-college choreography finals, Battle of Bands, Celebrity Pro-nite',
      specialRequests: 'Campus faculty NOC, ambulance standby, fire clearance',
      collegePermissionsNeeded: 'Police sound curfew NOC, campus faculty approval, DG fuel safety audit',
    },
  },
  {
    id: 'tpl_birthday',
    name: 'Golden 50th Birthday',
    badge: 'Milestone',
    icon: '🎂',
    data: {
      title: 'Ramesh’s 50th Golden Jubilee Celebration',
      type: 'birthday' as EventType,
      date: '2026-12-05',
      durationHours: 5,
      city: 'Mumbai',
      venueType: 'indoor' as const,
      venueName: 'Taj Lands End Sunset Ballroom',
      guestCount: 120,
      budgetInput: '450000',
      currency: 'INR' as const,
      themePreference: 'Vintage Gold & Black Tie Glamour',
      dietaryPreferences: ['Vegetarian', 'Gluten-Free Options'],
      culturalTraditions: 'Retrospective documentary screening, acoustic jazz band, cake cutting toast',
      specialRequests: 'Custom photo memory gallery timeline, dessert tasting table',
    },
  },
  {
    id: 'tpl_corporate',
    name: 'AI Leadership Summit',
    badge: 'Executive',
    icon: '💼',
    data: {
      title: 'NextGen AI & Cloud Summit 2026',
      type: 'corporate' as EventType,
      date: '2026-11-12',
      durationHours: 8,
      city: 'Hyderabad',
      venueType: 'indoor' as const,
      venueName: 'HICC Novotel Grand Convention Center',
      guestCount: 250,
      budgetInput: '1000000',
      currency: 'INR' as const,
      themePreference: 'Clean Modern Tech Minimalism (Navy & Brushed Silver)',
      dietaryPreferences: ['Vegetarian', 'Halal Options', 'Gluten-Free Options'],
      culturalTraditions: 'Keynote fireside chat, lightning demo round, networking cocktails',
      specialRequests: '1Gbps dedicated fiber internet, simultaneous translation, stage teleprompter',
      corporateAVNeeds: 'Dual 4K LED screens, stage roving wireless mics, live webinar broadcast',
    },
  },
];

export const CreateEventWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { firebaseUser, user: authUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_STATE);

  const handleApplyTemplate = (tpl: (typeof EVENT_TEMPLATES)[0]) => {
    const updated: WizardFormData = {
      ...formData,
      ...tpl.data,
    };
    setFormData(updated);
    setFieldErrors({});
    try {
      localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(updated));
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {}
    showToast({
      type: 'success',
      title: 'Template Applied',
      description: `Loaded complete configuration for "${tpl.name}".`,
    });
  };

  // Load autosaved draft on mount
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const quickPrompt = searchParams.get('quickPrompt');
      if (quickPrompt) {
        const parsed = parseEventSentence(quickPrompt);
        setFormData((prev) => ({
          ...prev,
          title: parsed.title,
          type: parsed.type,
          city: parsed.city,
          guestCount: parsed.guestCount || prev.guestCount,
          budgetInput: parsed.budgetMinor ? (parsed.budgetMinor / 100).toString() : prev.budgetInput,
          date: parsed.date || prev.date,
        }));
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }

      const savedDraft = localStorage.getItem(WIZARD_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({ ...prev, ...parsed }));
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      // Fallback to initial
    }
  }, []);

  // Autosave draft on changes
  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(formData));
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      // Storage quota or private mode fallback
    }
  }, [formData]);

  const updateField = <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error when user starts correcting it
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem(WIZARD_DRAFT_KEY);
    setFormData({ ...INITIAL_FORM_STATE });
    setFieldErrors({});
    setLastSavedAt(null);
    setCurrentStep(1);
    showToast({
      type: 'info',
      title: 'Draft Cleared',
      description: 'Reset wizard to blank default state.',
    });
  };

  // Validates current step using respective Zod schema
  const validateStep = (stepNumber: number): boolean => {
    let result;
    const errors: Record<string, string> = {};

    switch (stepNumber) {
      case 1:
        result = step1Schema.safeParse({
          title: formData.title,
          type: formData.type,
          date: formData.date,
          durationHours: formData.durationHours,
        });
        break;
      case 2:
        result = step2Schema.safeParse({
          city: formData.city,
          venueType: formData.venueType,
          venueName: formData.venueName,
        });
        break;
      case 3:
        result = step3Schema.safeParse({
          guestCount: formData.guestCount,
          currency: formData.currency,
          budgetInput: formData.budgetInput,
        });
        break;
      case 4:
        result = step4Schema.safeParse({
          themePreference: formData.themePreference,
        });
        break;
      case 5:
        result = step5Schema.safeParse({
          dietaryPreferences: formData.dietaryPreferences,
        });
        break;
      case 6:
        result = step6Schema.safeParse({
          culturalTraditions: formData.culturalTraditions,
          specialRequests: formData.specialRequests,
          weddingFunctionsCount: formData.weddingFunctionsCount,
          corporateAVNeeds: formData.corporateAVNeeds,
          collegePermissionsNeeded: formData.collegePermissionsNeeded,
        });
        break;
      case 7:
        result = fullWizardSchema.safeParse(formData);
        break;
      default:
        result = { success: true } as const;
    }

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'general';
        errors[fieldName] = issue.message;
      });
      setFieldErrors(errors);
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: Object.values(errors)[0] || 'Please review highlighted fields.',
      });
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGeneratePlan = async () => {
    // Validate entire form with full Zod schema before executing AI generator
    const validation = fullWizardSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'general';
        errors[fieldName] = issue.message;
      });
      setFieldErrors(errors);
      showToast({
        type: 'error',
        title: 'Please fix validation errors',
        description: Object.values(errors)[0],
      });
      return;
    }

    const budgetMinor = parseCurrencyInputToMinor(formData.budgetInput);
    setIsGenerating(true);

    try {
      const generated = await apiGeneratePlan({
        title: formData.title,
        type: formData.type,
        date: formData.date,
        city: formData.city,
        guestCount: formData.guestCount,
        totalBudgetMinor: budgetMinor,
        currency: formData.currency,
        themePreference: formData.themePreference,
        dietaryPreferences: formData.dietaryPreferences,
        culturalTraditions: formData.culturalTraditions,
        specialRequests: formData.specialRequests,
      });

      const newEventId = `evt_${Date.now()}`;
      const currentUser = getCurrentUser();
      const currentOwnerId = firebaseUser?.uid || authUser?.id || currentUser.id;

      // Convert generated sections to full PlanSection model
      const planSections: PlanSection[] = [
        { id: `sec_${Date.now()}_1`, sectionKey: 'overview', title: 'Overview & Vision', content: generated.overview, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_2`, sectionKey: 'theme', title: 'Theme & Aesthetic', content: generated.theme, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_3`, sectionKey: 'venue_requirements', title: 'Venue Requirements', content: generated.venue_requirements, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_4`, sectionKey: 'decor_concept', title: 'Decor & Floral Concepts', content: generated.decor_concept, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_5`, sectionKey: 'catering_plan', title: 'Catering & Dining Plan', content: generated.catering_plan, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_6`, sectionKey: 'entertainment', title: 'Entertainment & Flow', content: generated.entertainment, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_7`, sectionKey: 'guest_experience', title: 'Guest Experience', content: generated.guest_experience, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_8`, sectionKey: 'preparation_schedule', title: 'Preparation Schedule', content: generated.preparation_schedule, lastUpdated: new Date().toISOString(), versions: [] },
        { id: `sec_${Date.now()}_9`, sectionKey: 'risks_contingencies', title: 'Risks & Contingencies', content: generated.risks_contingencies, lastUpdated: new Date().toISOString(), versions: [] },
      ];

      // Convert allocations to budget items
      const allocations = generated.budget_allocations.length > 0
        ? generated.budget_allocations.map((a) => ({ category: a.category, targetPercentage: a.percentage }))
        : (DEFAULT_BUDGET_CATEGORIES[formData.type] || []).map((c) => ({ category: c.category, targetPercentage: c.defaultPercent }));

      const budgetItems: BudgetItem[] = allocations.map((alloc, idx) => {
        const estMinor = Math.round((budgetMinor * alloc.targetPercentage) / 100);
        return {
          id: `item_${Date.now()}_${idx}`,
          category: alloc.category,
          name: `${alloc.category} Allocation`,
          estimatedAmountMinor: estMinor,
          actualAmountMinor: estMinor,
          paidAmountMinor: 0,
          status: 'pending',
          dueDate: formData.date,
        };
      });

      // Calculate initial timeline tasks
      const eventTargetDate = new Date(formData.date);
      const tasks = generated.suggested_tasks.map((t, idx) => {
        const deadlineDate = new Date(eventTargetDate);
        deadlineDate.setDate(deadlineDate.getDate() - t.leadTimeWeeksBefore * 7);
        return {
          id: `tsk_${Date.now()}_${idx}`,
          title: t.title,
          deadline: deadlineDate.toISOString().split('T')[0],
          phase: t.phase,
          priority: t.priority,
          status: 'not_started' as const,
          dependencies: [],
          assignee: authUser?.name || currentUser.name,
        };
      });

      // Image selection based on event type
      let cover = HERO_IMAGES.wedding;
      if (formData.type === 'college_fest') cover = HERO_IMAGES.collegeFest;
      else if (formData.type === 'birthday') cover = HERO_IMAGES.birthday;

      const newFullEvent: EventFull = {
        details: {
          id: newEventId,
          title: formData.title,
          type: formData.type,
          date: formData.date,
          durationHours: formData.durationHours,
          city: formData.city,
          venueType: formData.venueType,
          venueName: formData.venueName || undefined,
          estimatedGuestCount: formData.guestCount,
          totalBudgetMinor: budgetMinor,
          currency: formData.currency,
          themePreference: formData.themePreference,
          dietaryPreferences: formData.dietaryPreferences,
          culturalTraditions: formData.culturalTraditions,
          specialRequests: formData.specialRequests,
          ownerId: currentOwnerId,
          collaborators: [
            {
              id: currentOwnerId,
              name: authUser?.name || currentUser.name,
              email: firebaseUser?.email || authUser?.email || currentUser.email,
              role: 'owner',
              addedAt: new Date().toISOString(),
            },
          ],
          status: 'planning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          coverImage: cover,
          ecoScore: {
            score: 82,
            rating: 'Gold',
            tips: [
              'Locally sourced decor and seasonal cuisine minimizes transportation carbon footprint.',
              'Digital invitation distribution eliminates paper waste.',
            ],
          },
        },
        planSections,
        budgetAllocations: allocations,
        budgetItems,
        savingsSuggestions: [],
        tasks,
        vendors: generated.vendor_categories.map((vc, idx) => ({
          id: `vnd_${Date.now()}_${idx}`,
          category: vc.category,
          name: `Unassigned ${vc.category}`,
          contactPerson: '',
          phone: '',
          email: '',
          estimatedCostMinor: Math.round((budgetMinor * (vc.estimatedCostPercentage || 15)) / 100),
          bookingStatus: 'not_contacted',
          requirements: vc.requirements || [],
          questionsToAsk: vc.questionsToAsk || [],
          quotes: [],
          linkedTasks: [],
        })),
        guests: [],
        seatingTables: [],
        themes: [],
        menu: [],
        venues: [],
        runOfShow: [],
        issues: [],
        chatHistory: [],
      };

      // 1. Save locally
      upsertEvent(newFullEvent);

      // 2. Persist to Firestore if user is authenticated
      try {
        if (firebaseUser) {
          await saveEventToFirestore(newFullEvent);
        }
      } catch (firestoreErr) {
        console.warn('Could not save event directly to Firestore:', firestoreErr);
      }

      // Clear local draft
      localStorage.removeItem(WIZARD_DRAFT_KEY);

      // Celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4B2A7B', '#FF7A6B', '#FBF7F0'],
      });

      showToast({
        type: 'success',
        title: 'Plan Generated Successfully!',
        description: `Your custom event architecture for "${formData.title}" is ready.`,
      });

      navigate(`/events/${newEventId}`);
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      showToast({
        type: 'error',
        title: 'Generation Failed',
        description: err.message || 'Please check your inputs and try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Wizard Header with Autosave Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-[#4B2A7B]/15 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B2A7B] bg-[#F3EEF8] px-3 py-1 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A6B]" />
            <span>AI Event Planning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1E1B24]">
            Plan Your Next Event
          </h1>
          <p className="text-xs sm:text-sm text-[#5C5765]">
            Complete the 7 steps below. Gemini AI synthesizes schedules, budgets, and vendors.
          </p>
        </div>

        {/* Autosave badge & Clear button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {lastSavedAt && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#5C5765] bg-[#F3EEF8]/70 border border-[#4B2A7B]/10 px-2.5 py-1 rounded-lg">
              <Save className="w-3 h-3 text-emerald-600" />
              <span>Autosaved {lastSavedAt}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDraft}
            leftIcon={<RotateCcw className="w-3 h-3 text-[#5C5765]" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="py-2">
        <Stepper
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onStepClick={(s) => {
            if (s < currentStep || validateStep(currentStep)) {
              setCurrentStep(s);
            }
          }}
        />
      </div>

      {/* Wizard Card Body */}
      <Card variant="default" padding="lg" className="min-h-[440px] flex flex-col justify-between">
        {/* Step 1: Basics */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Step 1: Event Basics</h2>
                <p className="text-xs text-[#5C5765]">Give your event a memorable title, format, and scheduled date.</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#5C5765]">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7A6B]" />
                <span className="font-semibold text-[#4B2A7B]">Quick-Start Templates:</span>
              </div>
            </div>

            {/* Template Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EVENT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-3 rounded-xl border border-[#4B2A7B]/15 bg-white hover:border-[#4B2A7B] hover:bg-[#F3EEF8]/40 transition-all text-left shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{tpl.icon}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F3EEF8] text-[#4B2A7B]">
                      {tpl.badge}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#1E1B24] block truncate group-hover:text-[#4B2A7B]">
                    {tpl.name}
                  </span>
                  <span className="text-[10px] text-[#5C5765] block mt-0.5">
                    Click to load preset
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                  Event Title <span className="text-[#FF7A6B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g. Maya & Karthik Wedding, IGNITE Fest 2026, Aarav's 5th Birthday"
                  className={`w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    fieldErrors.title
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Event Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value as EventType)}
                  className="w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                >
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                  Target Date <span className="text-[#FF7A6B]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className={`w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    fieldErrors.date
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
                {fieldErrors.date && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Duration (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={formData.durationHours}
                  onChange={(e) => updateField('durationHours', parseInt(e.target.value) || 4)}
                  className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                />
                {fieldErrors.durationHours && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.durationHours}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Venue */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Step 2: Location & Venue Type</h2>
              <p className="text-xs text-[#5C5765]">Specify the hosting city and physical environment preferences.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                  City / Region <span className="text-[#FF7A6B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. Chennai, Bengaluru, Mumbai, Delhi, Hyderabad"
                  className={`w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    fieldErrors.city
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Venue Environment</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['indoor', 'outdoor', 'hybrid'] as const).map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => updateField('venueType', v)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition-colors cursor-pointer ${
                        formData.venueType === v
                          ? 'bg-[#4B2A7B] text-white border-[#4B2A7B]'
                          : 'bg-[#F3EEF8]/40 text-[#5C5765] border-[#4B2A7B]/15 hover:bg-[#F3EEF8]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                  Preferred Venue Name or Area (Optional)
                </label>
                <input
                  type="text"
                  value={formData.venueName || ''}
                  onChange={(e) => updateField('venueName', e.target.value)}
                  placeholder="e.g. The Leela Palace, Palace Grounds, Taj Lands End, or 'Open Lawn'"
                  className="w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Guests & Budget */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Step 3: Guest Count & Budget</h2>
              <p className="text-xs text-[#5C5765]">Set your realistic budget and expected headcount. All math is computed deterministically in code.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                  Expected Guest Count <span className="text-[#FF7A6B]">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={50000}
                  value={formData.guestCount}
                  onChange={(e) => updateField('guestCount', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] font-mono tabular-nums focus:outline-none focus:ring-2 ${
                    fieldErrors.guestCount
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
                {fieldErrors.guestCount && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.guestCount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => updateField('currency', e.target.value as any)}
                  className="w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                >
                  <option value="INR">INR (₹ - Indian Rupee, Lakhs & Crores)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                  Total Target Budget Amount <span className="text-[#FF7A6B]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-[#4B2A7B]">
                    {formData.currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.budgetInput}
                    onChange={(e) => updateField('budgetInput', e.target.value)}
                    placeholder="e.g. 500000 (₹5 Lakhs)"
                    className={`w-full pl-8 pr-4 py-2.5 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] font-mono tabular-nums focus:outline-none focus:ring-2 ${
                      fieldErrors.budgetInput
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                    }`}
                  />
                </div>
                {fieldErrors.budgetInput && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.budgetInput}
                  </p>
                )}
                <p className="text-[11px] text-[#5C5765] mt-1 font-mono">
                  Standard representation:{' '}
                  {formatMinorToCurrency(parseCurrencyInputToMinor(formData.budgetInput), formData.currency, { compact: false })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Theme & Aesthetic */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Step 4: Theme & Decor Direction</h2>
              <p className="text-xs text-[#5C5765]">Choose the visual signature and color story.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                Theme Preference & Color Palette <span className="text-[#FF7A6B]">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.themePreference}
                onChange={(e) => updateField('themePreference', e.target.value)}
                placeholder="e.g. Royal Dravidian Heritage (Deep violet, antique brass, fresh marigolds), Minimalist Botanical Sage, Cyberpunk Neon..."
                className={`w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                  fieldErrors.themePreference
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                }`}
              />
              {fieldErrors.themePreference && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.themePreference}
                </p>
              )}

              {/* Quick Inspiration Pills */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  'Royal Velvet & Brass (Heritage)',
                  'Bohemian Pampas & Terracotta',
                  'Cyberpunk Neon & Chrome',
                  'Emerald Greenery & Gold Accents',
                  'Pastel Rose & Ivory Elegance',
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => updateField('themePreference', preset)}
                    className="text-[11px] px-3 py-1 bg-[#F3EEF8] text-[#4B2A7B] rounded-full border border-[#4B2A7B]/15 hover:bg-[#EAE2F3] cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Food & Dietary */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Step 5: Dining & Dietary Requirements</h2>
              <p className="text-xs text-[#5C5765]">Select banquet styles and dietary considerations.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-2">
                Dietary Coverage Needed <span className="text-[#FF7A6B]">*</span>
              </label>
              {fieldErrors.dietaryPreferences && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 mb-2">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.dietaryPreferences}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  'Vegetarian',
                  'Vegan',
                  'Jain Options Available',
                  'Halal',
                  'Gluten-Free',
                  'Nut-Free',
                  'Kids Menu',
                  'Live Food Stations',
                ].map((item) => {
                  const isChecked = formData.dietaryPreferences.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => {
                        const next = isChecked
                          ? formData.dietaryPreferences.filter((x) => x !== item)
                          : [...formData.dietaryPreferences, item];
                        updateField('dietaryPreferences', next);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-colors cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#F3EEF8] text-[#4B2A7B] border-[#4B2A7B] font-semibold'
                          : 'bg-[#F3EEF8]/30 text-[#5C5765] border-[#4B2A7B]/15 hover:bg-[#F3EEF8]/60'
                      }`}
                    >
                      <span>{item}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#4B2A7B]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Culture, Accessibility & Type-Specific Questions */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Step 6: Culture, Accessibility & Logistics</h2>
              <p className="text-xs text-[#5C5765]">Tailored follow-ups for your {formData.type} celebration.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Traditions & Rituals</label>
                <input
                  type="text"
                  value={formData.culturalTraditions || ''}
                  onChange={(e) => updateField('culturalTraditions', e.target.value)}
                  placeholder="e.g. Muhurtham, Sangeet, Cake cutting, Robowars tournament, Keynote speech..."
                  className="w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Accessibility & Special Requests</label>
                <textarea
                  rows={2}
                  value={formData.specialRequests || ''}
                  onChange={(e) => updateField('specialRequests', e.target.value)}
                  placeholder="e.g. Wheelchair ramp, elderly quiet seating, designated photo booth zone..."
                  className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                />
              </div>

              {formData.type === 'wedding' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Number of Functions / Ceremonies</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.weddingFunctionsCount || 2}
                    onChange={(e) => updateField('weddingFunctionsCount', parseInt(e.target.value) || 2)}
                    className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                  />
                </div>
              )}

              {formData.type === 'college_fest' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Campus Permissions & Sound NOC</label>
                  <input
                    type="text"
                    value={formData.collegePermissionsNeeded || ''}
                    onChange={(e) => updateField('collegePermissionsNeeded', e.target.value)}
                    placeholder="e.g. Police curfew license, Dean NOC, Fire brigade inspection"
                    className="w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 7: Review & Generate */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Step 7: Plan Review & AI Generation</h2>
              <p className="text-xs text-[#5C5765]">Review your specifications before generating the structured event architecture.</p>
            </div>

            <div className="bg-[#F3EEF8]/60 p-5 rounded-2xl border border-[#4B2A7B]/15 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start justify-between p-3 bg-white rounded-xl border border-[#4B2A7B]/10">
                  <div>
                    <span className="text-[#5C5765] block">Event Title</span>
                    <span className="font-semibold text-[#1E1B24] text-sm">{formData.title || 'Untitled'}</span>
                  </div>
                  <button onClick={() => setCurrentStep(1)} className="text-[#4B2A7B] hover:underline flex items-center gap-1 text-[11px]">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="flex items-start justify-between p-3 bg-white rounded-xl border border-[#4B2A7B]/10">
                  <div>
                    <span className="text-[#5C5765] block">Format & Location</span>
                    <span className="font-semibold text-[#1E1B24] capitalize">{formData.type} · {formData.city}</span>
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="text-[#4B2A7B] hover:underline flex items-center gap-1 text-[11px]">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="flex items-start justify-between p-3 bg-white rounded-xl border border-[#4B2A7B]/10">
                  <div>
                    <span className="text-[#5C5765] block">Date & Duration</span>
                    <span className="font-semibold text-[#1E1B24]">{formData.date || 'Not set'} ({formData.durationHours} hrs)</span>
                  </div>
                  <button onClick={() => setCurrentStep(1)} className="text-[#4B2A7B] hover:underline flex items-center gap-1 text-[11px]">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="flex items-start justify-between p-3 bg-white rounded-xl border border-[#4B2A7B]/10">
                  <div>
                    <span className="text-[#5C5765] block">Guest Count</span>
                    <span className="font-semibold text-[#1E1B24]">{formData.guestCount} Attendees</span>
                  </div>
                  <button onClick={() => setCurrentStep(3)} className="text-[#4B2A7B] hover:underline flex items-center gap-1 text-[11px]">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="sm:col-span-2 flex items-start justify-between p-3 bg-white rounded-xl border border-[#4B2A7B]/10">
                  <div>
                    <span className="text-[#5C5765] block">Target Budget Pool</span>
                    <span className="font-semibold font-mono text-[#4B2A7B] text-base">
                      {formatMinorToCurrency(parseCurrencyInputToMinor(formData.budgetInput), formData.currency)}
                    </span>
                  </div>
                  <button onClick={() => setCurrentStep(3)} className="text-[#4B2A7B] hover:underline flex items-center gap-1 text-[11px]">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-[#4B2A7B]/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#5C5765] block">Theme & Dietary Coverage</span>
                    <button onClick={() => setCurrentStep(4)} className="text-[#4B2A7B] hover:underline flex items-center gap-1 text-[11px]">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <p className="font-medium text-[#1E1B24]">{formData.themePreference}</p>
                  <p className="text-[#5C5765] mt-1">
                    Dietary: {formData.dietaryPreferences.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Deterministic Computation Guarantee</span>
              </div>
              <p>
                Budget items are computed deterministically in code into exact minor unit sums (paise/cents). No hallucinated pricing or arbitrary sums.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#4B2A7B]/10 mt-6">
          <Button
            variant="outline"
            size="md"
            onClick={handleBack}
            disabled={currentStep === 1 || isGenerating}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < 7 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                leftIcon={
                  isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF7A6B]" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[#FF7A6B]" />
                  )
                }
              >
                {isGenerating ? 'Synthesizing Architecture...' : 'Generate Event Architecture'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
