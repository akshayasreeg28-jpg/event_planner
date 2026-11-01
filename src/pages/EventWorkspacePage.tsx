import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useEvent } from '../features/events/useEventData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabItem } from '../components/ui/Tabs';
import { TabErrorBoundary } from '../components/ui/TabErrorBoundary';
import { CardSkeleton } from '../components/ui/Skeleton';
import { formatMinorToCurrency, getDaysRemaining, formatDateDisplay } from '../lib/formatters';
import { getEventTheme, getEventThemeStyle } from '../lib/themeTokens';

// 11 Workspace Tabs
import { OverviewTab } from '../features/workspace/OverviewTab';
import { AIPlanTab } from '../features/workspace/AIPlanTab';
import { BudgetTab } from '../features/workspace/BudgetTab';
import { TimelineTab } from '../features/workspace/TimelineTab';
import { VendorsTab } from '../features/workspace/VendorsTab';
import { GuestsTab } from '../features/workspace/GuestsTab';
import { ThemesTab } from '../features/workspace/ThemesTab';
import { MenuTab } from '../features/workspace/MenuTab';
import { LocationsTab } from '../features/workspace/LocationsTab';
import { EventDayTab } from '../features/workspace/EventDayTab';
import { ChatTab } from '../features/workspace/ChatTab';

import {
  LayoutDashboard,
  Sparkles,
  DollarSign,
  Clock,
  Building,
  Users,
  Palette,
  Utensils,
  MapPin,
  Radio,
  MessageSquare,
  ArrowLeft,
  Share2,
  Calendar,
  PartyPopper,
} from 'lucide-react';
import { calculateGamification } from '../lib/gamification';
import { EcoRibbonRosette } from '../features/gamification/EcoRibbonRosette';
import { GamificationModal } from '../features/gamification/GamificationModal';
import { SocialShareModal } from '../features/sharing/SocialShareModal';

export const EventWorkspacePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: event, isLoading } = useEvent(eventId || '');
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (tabKey: string) => {
    setSearchParams({ tab: tabKey });
  };

  const triggerMilestoneConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4B2A7B', '#FF7A6B', '#D4AF37', '#00CEC9'],
    });
  };

  if (isLoading && !event) {
    return (
      <div className="space-y-6 animate-pulse py-6">
        <div className="h-8 bg-[#4B2A7B]/10 rounded-xl w-64" />
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-[var(--app-text)]">Event Not Found</h2>
        <p className="text-xs text-[var(--app-text-muted)]">This event may have been removed or does not exist in your workspace.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/events')}>
          Return to My Events
        </Button>
      </div>
    );
  }

  const remaining = getDaysRemaining(event.details.date);
  const gamification = calculateGamification(event);
  const theme = getEventTheme(event.details.type);
  const themeStyle = getEventThemeStyle(event.details.type);

  const confirmedGuestsCount = (event.guests || []).filter((g) => g.rsvpStatus === 'confirmed').length;
  const completedTasksCount = (event.tasks || []).filter((t) => t.status === 'completed').length;

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'plan', label: 'AI Plan', icon: <Sparkles className="w-4 h-4 text-[#FF7A6B]" /> },
    { id: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline & Gantt', icon: <Clock className="w-4 h-4" />, count: (event.tasks || []).length },
    { id: 'vendors', label: 'Vendors', icon: <Building className="w-4 h-4" />, count: (event.vendors || []).length },
    { id: 'guests', label: 'Guests', icon: <Users className="w-4 h-4" />, count: (event.guests || []).length },
    { id: 'themes', label: 'Themes & Decor', icon: <Palette className="w-4 h-4" /> },
    { id: 'menu', label: 'Menu & Catering', icon: <Utensils className="w-4 h-4" /> },
    { id: 'locations', label: 'Venues & Weather', icon: <MapPin className="w-4 h-4" /> },
    { id: 'day', label: 'Event Day', icon: <Radio className="w-4 h-4 text-[#FF7A6B]" /> },
    { id: 'chat', label: 'AI Assistant', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div style={themeStyle} className="space-y-6 animate-in fade-in duration-150">
      {/* Sticky Header with Cover Image and Quick Stats */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--event-border)] shadow-md bg-[var(--app-surface)]">
        {/* Cover backdrop */}
        <div className="relative h-44 sm:h-52 overflow-hidden bg-gradient-to-r from-black/80 to-black/40">
          {event.details.coverImage && (
            <img
              src={event.details.coverImage}
              alt={event.details.title}
              className="w-full h-full object-cover object-center filter brightness-[0.75]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Top navigation row inside cover */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs">
            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Events
            </button>

            <div className="flex items-center gap-2">
              {/* Celebrate Milestone Button */}
              <button
                type="button"
                onClick={triggerMilestoneConfetti}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold transition-all hover:scale-105"
                title="Celebrate Progress!"
              >
                <PartyPopper className="w-3.5 h-3.5 text-[#FF7A6B]" />
                <span className="hidden sm:inline">Celebrate Milestone</span>
              </button>

              {/* Eco Ribbon Rosette */}
              <button
                onClick={() => setIsGamificationOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold transition-all"
              >
                <EcoRibbonRosette tier={gamification.ecoRibbon.tier} size="sm" />
                <span className="font-serif hidden sm:inline">{gamification.ecoRibbon.title}</span>
              </button>

              {/* Share event */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#1E1B24] font-bold shadow-md hover:bg-white/90 transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-[#FF7A6B]" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Title & Quick Stats pinned to bottom of cover */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  {theme.name}
                </span>
                <span className="text-xs text-white/80">
                  {event.details.city} · {formatDateDisplay(event.details.date)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight drop-shadow-sm">
                {event.details.title}
              </h1>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-mono">
              <div>
                <span className="text-[10px] text-white/60 block">COUNTDOWN</span>
                <span className="font-bold text-[#FF7A6B]">{remaining.label}</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div>
                <span className="text-[10px] text-white/60 block">BUDGET</span>
                <span className="font-bold text-white">
                  {formatMinorToCurrency(event.details.totalBudgetMinor, event.details.currency)}
                </span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div>
                <span className="text-[10px] text-white/60 block">RSVPS</span>
                <span className="font-bold text-emerald-400">
                  {confirmedGuestsCount} / {event.details.estimatedGuestCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Tabs Navigation Bar */}
        <div className="bg-[var(--app-surface)] border-t border-[var(--event-border)] px-4 py-1">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            variant="underline"
          />
        </div>
      </div>

      {/* Tab View Render Wrapped in per-tab Error Boundaries */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <TabErrorBoundary tabName="Overview">
            <OverviewTab event={event} onTabChange={handleTabChange} />
          </TabErrorBoundary>
        )}
        {activeTab === 'plan' && (
          <TabErrorBoundary tabName="AI Plan">
            <AIPlanTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'budget' && (
          <TabErrorBoundary tabName="Budget">
            <BudgetTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'timeline' && (
          <TabErrorBoundary tabName="Timeline & Gantt">
            <TimelineTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'vendors' && (
          <TabErrorBoundary tabName="Vendors">
            <VendorsTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'guests' && (
          <TabErrorBoundary tabName="Guests">
            <GuestsTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'themes' && (
          <TabErrorBoundary tabName="Themes & Decor">
            <ThemesTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'menu' && (
          <TabErrorBoundary tabName="Menu & Catering">
            <MenuTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'locations' && (
          <TabErrorBoundary tabName="Venues & Weather">
            <LocationsTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'day' && (
          <TabErrorBoundary tabName="Event Day">
            <EventDayTab event={event} />
          </TabErrorBoundary>
        )}
        {activeTab === 'chat' && (
          <TabErrorBoundary tabName="AI Assistant">
            <ChatTab event={event} />
          </TabErrorBoundary>
        )}
      </div>

      {/* Gamification Modal */}
      <GamificationModal
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        event={event}
        onNavigateToTab={handleTabChange}
      />

      {/* Social Media Sharing Modal */}
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        event={event}
      />
    </div>
  );
};
