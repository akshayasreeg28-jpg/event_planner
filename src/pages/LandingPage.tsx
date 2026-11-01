import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Flame,
  Users,
  Compass,
  Clock,
  ShieldCheck,
  ChevronRight,
  Layers,
  Heart,
  TrendingUp,
  MapPin,
  Utensils,
  Leaf,
  DollarSign,
  Smartphone,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { HERO_IMAGES, EVENT_TEMPLATES } from '../lib/constants';

const PRESET_QUICK_PLANS = [
  {
    title: "Sister's Mehendi & Sangeet",
    city: 'Jaipur',
    guests: 180,
    budget: '₹12,00,000',
    type: 'wedding',
    highlights: ['Marigold canopy & live folk troupe', 'Chaat & kulfi live counters', 'Stage choreography run-of-show'],
    breakdown: [
      { cat: 'Heritage Haveli Venue', pct: '35%' },
      { cat: 'Royal Rajasthani Feast', pct: '25%' },
      { cat: 'Florals & Folk Decor', pct: '18%' },
      { cat: 'Cinematic Photography', pct: '12%' },
    ],
  },
  {
    title: 'Inter-College Tech Hackathon & Fest',
    city: 'Bengaluru',
    guests: 450,
    budget: '₹4,50,000',
    type: 'college_fest',
    highlights: ['48h uninterrupted power & gigabit WiFi', 'Sponsor booths & dev swag', 'EDM stage concert finale'],
    breakdown: [
      { cat: 'Amphitheater & Audio AV', pct: '32%' },
      { cat: 'Cash Prizes & Mementos', pct: '22%' },
      { cat: 'Campus Food Trucks', pct: '20%' },
      { cat: 'Security & Logistics', pct: '14%' },
    ],
  },
  {
    title: "Aarav's 5th Space Explorer Birthday",
    city: 'Mumbai',
    guests: 50,
    budget: '₹85,000',
    type: 'birthday',
    highlights: ['Planetarium projector dome', 'Astronaut training obstacle course', 'Galaxy cake & return kits'],
    breakdown: [
      { cat: 'Kids Club Rental', pct: '28%' },
      { cat: 'Custom Galaxy Cake & Snacks', pct: '32%' },
      { cat: 'Themed Balloon Art & Props', pct: '22%' },
      { cat: 'Magic & Science Show', pct: '18%' },
    ],
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeHeroTab, setActiveHeroTab] = useState<'wedding' | 'collegeFest' | 'birthday'>('wedding');
  const [promptInput, setPromptInput] = useState('');
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [isGeneratingTeaser, setIsGeneratingTeaser] = useState(false);

  const heroImageMap = {
    wedding: HERO_IMAGES.wedding,
    collegeFest: HERO_IMAGES.collegeFest,
    birthday: HERO_IMAGES.birthday,
  };

  const handleQuickPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    setIsGeneratingTeaser(true);
    setTimeout(() => {
      setIsGeneratingTeaser(false);
      navigate(`/wizard?quickPrompt=${encodeURIComponent(promptInput)}`);
    }, 450);
  };

  const currentPlan = PRESET_QUICK_PLANS[activePresetIndex];

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] selection:bg-[#FF7A6B]/20 selection:text-[#4B2A7B]">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-6 px-6 sm:px-12 py-4 border-b border-[var(--app-border)] bg-[var(--app-surface-raised)]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#4B2A7B] text-white flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-[#FF7A6B]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[var(--app-text)] font-serif">Event AI</span>
            <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--app-text-muted)] -mt-0.5">Celebration Studio</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--app-text-muted)]">
          <a href="#demo-teaser" className="hover:text-[#4B2A7B] transition-colors">Interactive Demo</a>
          <a href="#features" className="hover:text-[#4B2A7B] transition-colors">Features</a>
          <a href="#templates" className="hover:text-[#4B2A7B] transition-colors">Sample Events</a>
          <a href="#social-proof" className="hover:text-[#4B2A7B] transition-colors">Why Event AI</a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/signin')}
            className="text-xs font-semibold"
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Launch Studio
          </Button>
        </div>
      </header>

      {/* Full-Bleed Editorial Hero */}
      <section className="relative overflow-hidden border-b border-[var(--app-border)]">
        {/* Background celebration image with smooth transition and gradient overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImageMap[activeHeroTab]}
            alt="Event celebration banner"
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05] transition-all duration-700 ease-in-out scale-105"
          />
          {/* Subtle multi-layer warm editorial gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E1B24]/90 via-[#1E1B24]/75 to-transparent backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--app-bg)] via-transparent to-[#1E1B24]/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl space-y-6">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A6B]" />
              <span>Modern Celebration Studio & Intelligent Planner</span>
            </div>

            {/* Hero Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-white tracking-tight leading-[1.12]">
              Every unforgettable event begins with precision and soul.
            </h1>

            <p className="text-base sm:text-lg text-white/85 leading-relaxed font-normal max-w-xl">
              Architect grand weddings, vibrant college symposiums, milestones, and corporate galas with deterministic budget math, backward scheduling, and mobile Event Day Mode.
            </p>

            {/* Quick Hero Tabs */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-white/60 uppercase font-mono mr-2">Preview Theme:</span>
              {(['wedding', 'collegeFest', 'birthday'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveHeroTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeHeroTab === tab
                      ? 'bg-white text-[#1E1B24] shadow-md scale-105'
                      : 'bg-white/15 text-white/80 hover:bg-white/25'
                  }`}
                >
                  {tab === 'wedding' ? '💍 Royal Wedding' : tab === 'collegeFest' ? '⚡ College Fest' : '🎂 Birthday'}
                </button>
              ))}
            </div>

            {/* Primary actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/wizard')}
                leftIcon={<Sparkles className="w-5 h-5 text-[#FF7A6B]" />}
                className="shadow-xl shadow-[#4B2A7B]/40 hover:scale-[1.02] transition-transform"
              >
                Plan My Event
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('demo-teaser');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
              >
                See Live Interactive Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section id="social-proof" className="bg-[var(--app-surface-raised)] border-b border-[var(--app-border)] py-6 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs uppercase font-mono tracking-wider text-[var(--app-text-muted)] font-semibold">
              Trusted by 12,000+ Celebrants, Campuses & Planners
            </p>
            <p className="text-sm font-serif font-bold text-[var(--app-text)] mt-0.5">
              Deterministic budget math · Zero rounding errors · Real-time Firestore sync
            </p>
          </div>
          <div className="flex items-center gap-8 text-center sm:text-left">
            <div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#4B2A7B]">100%</span>
              <span className="text-xs text-[var(--app-text-muted)] block font-medium">Integer Math Precision</span>
            </div>
            <div className="w-px h-8 bg-[var(--app-border)]" />
            <div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#FF7A6B]">99.4%</span>
              <span className="text-xs text-[var(--app-text-muted)] block font-medium">On-Time Run of Show</span>
            </div>
            <div className="w-px h-8 bg-[var(--app-border)]" />
            <div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">4.9 / 5</span>
              <span className="text-xs text-[var(--app-text-muted)] block font-medium">User Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Teaser: Type your event → see plan appear */}
      <section id="demo-teaser" className="py-16 sm:py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <Badge variant="purple" size="md">
            Interactive Live Teaser
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--app-text)]">
            Type your event vision. Watch the plan materialize.
          </h2>
          <p className="text-sm sm:text-base text-[var(--app-text-muted)]">
            Enter details or select an event preset below to experience instant architectural breakdown:
          </p>
        </div>

        {/* Search input bar */}
        <form onSubmit={handleQuickPlan} className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center gap-2 p-2 bg-[var(--app-surface)] rounded-2xl border-2 border-[var(--app-border)] shadow-lg focus-within:border-[#4B2A7B] transition-all">
            <Sparkles className="w-5 h-5 text-[#FF7A6B] ml-2 shrink-0" />
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Sister's wedding in Chennai, 250 guests, ₹15 lakh budget, traditional..."
              className="w-full bg-transparent border-none text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] focus:outline-none px-2 py-1"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isGeneratingTeaser}
              className="shrink-0 rounded-xl"
            >
              {isGeneratingTeaser ? 'Drafting...' : 'Generate Plan'}
            </Button>
          </div>
        </form>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {PRESET_QUICK_PLANS.map((preset, idx) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => setActivePresetIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activePresetIndex === idx
                  ? 'bg-[#4B2A7B] text-white border-[#4B2A7B] shadow-md scale-105'
                  : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] border-[var(--app-border)] hover:border-[#4B2A7B]/40'
              }`}
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Interactive Teaser Card */}
        <motion.div
          key={currentPlan.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <Card variant="raised" padding="lg" className="border-2 border-[var(--app-border)] shadow-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--app-border)]">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#FF7A6B] font-semibold">
                  Sample Event Specification
                </span>
                <h3 className="text-2xl font-bold font-serif text-[var(--app-text)] mt-1">{currentPlan.title}</h3>
                <div className="flex items-center gap-4 text-xs text-[var(--app-text-muted)] mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#4B2A7B]" /> {currentPlan.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#4B2A7B]" /> {currentPlan.guests} Guests
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-[#4B2A7B]">
                    {currentPlan.budget}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/wizard')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="self-start sm:self-auto"
              >
                Customize in Studio
              </Button>
            </div>

            {/* Teaser content breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Highlights */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-wider text-[var(--app-text-muted)] font-bold">
                  Curated Architecture & Experiences
                </h4>
                <div className="space-y-2">
                  {currentPlan.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--app-surface-subtle)] border border-[var(--app-border)]">
                      <CheckCircle2 className="w-4 h-4 text-[#FF7A6B] shrink-0 mt-0.5" />
                      <span className="text-xs text-[var(--app-text)] font-medium leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget allocations */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-wider text-[var(--app-text-muted)] font-bold">
                  Target Budget Allocation
                </h4>
                <div className="space-y-2">
                  {currentPlan.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] shadow-sm">
                      <span className="text-xs font-semibold text-[var(--app-text)]">{item.cat}</span>
                      <span className="text-xs font-mono font-bold text-[#4B2A7B] bg-[#F3EEF8] px-2 py-0.5 rounded-lg">
                        {item.pct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-16 sm:py-24 px-6 sm:px-12 bg-[var(--app-surface-raised)] border-t border-[var(--app-border)]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="coral" size="md">
              Complete Feature Suite
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--app-text)]">
              Engineered for seamless celebration execution
            </h2>
            <p className="text-sm sm:text-base text-[var(--app-text-muted)]">
              Every pillar from financial integrity to live backstage coordination is covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: Large card - Integer Budget */}
            <Card variant="default" padding="lg" className="md:col-span-2 space-y-4 border border-[var(--app-border)] shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#4B2A7B]/10 text-[#4B2A7B] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#4B2A7B]" />
              </div>
              <h3 className="text-xl font-bold font-serif text-[var(--app-text)]">
                Deterministic Integer Minor-Unit Budgeting
              </h3>
              <p className="text-xs sm:text-sm text-[var(--app-text-muted)] leading-relaxed">
                Never worry about floating-point rounding errors. Every expense is tracked in integer paise or cents with automatic variance alerts whenever categories drift past 10%. Includes AI cost-saving trade-offs.
              </p>
              <div className="p-3 bg-[var(--app-surface-subtle)] rounded-xl border border-[var(--app-border)] flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--app-text-muted)]">Variance Guard: Active</span>
                <span className="font-bold text-emerald-600">Minor Unit Precision (₹0.00 drift)</span>
              </div>
            </Card>

            {/* Bento 2: Reverse Timelines & Gantt */}
            <Card variant="default" padding="lg" className="space-y-4 border border-[var(--app-border)] shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#FF7A6B]/15 text-[#FF7A6B] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FF7A6B]" />
              </div>
              <h3 className="text-xl font-bold font-serif text-[var(--app-text)]">
                Backward Scheduling & Gantt
              </h3>
              <p className="text-xs sm:text-sm text-[var(--app-text-muted)] leading-relaxed">
                Work backward from your event day with phased milestones, dependency graph tracking, and automatic overdue escalation.
              </p>
            </Card>

            {/* Bento 3: Interactive Seating Floorplan & 3D */}
            <Card variant="default" padding="lg" className="space-y-4 border border-[var(--app-border)] shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-serif text-[var(--app-text)]">
                2D & 3D Interactive Floorplan
              </h3>
              <p className="text-xs sm:text-sm text-[var(--app-text-muted)] leading-relaxed">
                Visual drag-and-drop table arrangements with instant top-down and 3D isometric perspectives and dietary allergy badges.
              </p>
            </Card>

            {/* Bento 4: Mobile Event Day Mode & PWA */}
            <Card variant="default" padding="lg" className="space-y-4 border border-[var(--app-border)] shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-serif text-[var(--app-text)]">
                Event Day Mode & PWA
              </h3>
              <p className="text-xs sm:text-sm text-[var(--app-text-muted)] leading-relaxed">
                Offline-capable run-of-show with minute-by-minute coordinator assignments, one-tap vendor calling, and live issue triage.
              </p>
            </Card>

            {/* Bento 5: Grounded Search & Eco-Gamification */}
            <Card variant="default" padding="lg" className="space-y-4 border border-[var(--app-border)] shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-serif text-[var(--app-text)]">
                Eco-Ribbons & Grounded Venues
              </h3>
              <p className="text-xs sm:text-sm text-[var(--app-text-muted)] leading-relaxed">
                Discover verified venues via Google Search grounding. Earn Eco-Champion ribbons and XP for sustainable vendor choices.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Event Templates */}
      <section id="templates" className="py-16 sm:py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge variant="purple" size="md">
            Production Ready Presets
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--app-text)]">
            Explore Pre-Configured Showcase Events
          </h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            Each template comes loaded with architectural plans, budget allocations, and run-of-show schedules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {EVENT_TEMPLATES.map((tmpl) => (
            <Card
              key={tmpl.id}
              variant="default"
              padding="none"
              className="group overflow-hidden rounded-2xl border border-[var(--app-border)] hover:border-[#4B2A7B]/40 transition-all hover:shadow-xl flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={tmpl.coverImage}
                  alt={tmpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <Badge variant="coral" size="sm">
                    {tmpl.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-mono font-bold">
                    {tmpl.guestCount} Guests · {tmpl.city}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-serif text-[var(--app-text)] group-hover:text-[#4B2A7B] transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-[var(--app-text-muted)] line-clamp-3 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--app-border)] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#4B2A7B]">
                    ₹{(tmpl.budgetMinor / 10000000).toFixed(1)} Lakh
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/wizard')}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Final Polished CTA Section */}
      <section className="py-20 px-6 sm:px-12 bg-gradient-to-br from-[#4B2A7B] to-[#371C5D] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center">
            <Flame className="w-6 h-6 text-[#FF7A6B]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif">
            Start Planning Your Celebration Today
          </h2>
          <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            Join thousands of event organizers creating seamless memories with AI-assisted architectural rigor.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/wizard')}
              leftIcon={<Sparkles className="w-5 h-5 text-[#FF7A6B]" />}
              className="bg-white text-[#4B2A7B] hover:bg-white/95 shadow-2xl hover:scale-105 transition-transform"
            >
              Launch Event AI Studio
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 sm:px-12 border-t border-[var(--app-border)] bg-[var(--app-surface)] text-xs text-[var(--app-text-muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#FF7A6B]" />
          <span className="font-serif font-bold text-[var(--app-text)]">Event AI</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="hover:underline">Features</a>
          <a href="#demo-teaser" className="hover:underline">Interactive Demo</a>
          <span className="font-mono text-[10px]">Deterministic Minor-Unit Engine</span>
        </div>
      </footer>
    </div>
  );
};
