import React, { useState } from 'react';
import { EventFull } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatMinorToCurrency, getDaysRemaining, formatDateDisplay } from '../../lib/formatters';
import {
  Calendar,
  Users,
  DollarSign,
  CheckSquare,
  Sparkles,
  MapPin,
  Clock,
  Leaf,
  ArrowRight,
  Share2,
  FileText,
  Printer,
  Download,
  Award,
  ShieldCheck,
  BarChart2,
  Flag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { calculateGamification } from '../../lib/gamification';
import { GamificationModal } from '../gamification/GamificationModal';
import { EcoRibbonRosette } from '../gamification/EcoRibbonRosette';
import { SocialShareModal } from '../sharing/SocialShareModal';

export const OverviewTab: React.FC<{ event: EventFull; onTabChange: (tabKey: string) => void }> = ({
  event,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSocialShareOpen, setIsSocialShareOpen] = useState(false);
  const remaining = getDaysRemaining(event.details.date);
  const [isGamificationModalOpen, setIsGamificationModalOpen] = useState(false);
  const gamification = calculateGamification(event);

  const totalSpentMinor = event.budgetItems.reduce((acc, i) => acc + i.actualAmountMinor, 0);
  const totalPaidMinor = event.budgetItems.reduce((acc, i) => acc + i.paidAmountMinor, 0);
  const budgetUtilization = Math.round((totalSpentMinor / (event.details.totalBudgetMinor || 1)) * 100);

  const completedTasks = event.tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = event.tasks.filter(
    (t) => t.status !== 'completed' && t.deadline < new Date().toISOString().split('T')[0]
  ).length;

  const confirmedGuests = event.guests.filter((g) => g.rsvpStatus === 'confirmed').length;
  const pendingGuests = event.guests.filter((g) => g.rsvpStatus === 'pending').length;

  // Key Milestones for quick timeline overview
  const upcomingMilestones = event.tasks
    .filter(
      (t) =>
        t.priority === 'critical' ||
        t.deadline === event.details.date ||
        t.title.toLowerCase().includes('deposit') ||
        t.title.toLowerCase().includes('contract') ||
        t.title.toLowerCase().includes('rsvp') ||
        t.title.toLowerCase().includes('final')
    )
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const handleShareSummary = () => {
    setIsSocialShareOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Hero Overview Card */}
      <Card variant="highlight" padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" size="sm">
                {event.details.type.toUpperCase().replace('_', ' ')}
              </Badge>
              <Badge variant={remaining.isPast ? 'neutral' : 'coral'} size="sm">
                {remaining.label}
              </Badge>
              <span className="text-xs text-[#5C5765]">
                {formatDateDisplay(event.details.date)} · {event.details.city}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#1E1B24]">
              {event.details.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#5C5765] max-w-2xl leading-relaxed">
              {event.planSections[0]?.content || 'Structured celebration plan with live budget and execution schedules.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onTabChange('plan')}
                leftIcon={<Sparkles className="w-4 h-4 text-[#FF7A6B]" />}
              >
                View Full AI Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTabChange('day')}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Event Day Mode
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(true)}
                leftIcon={<FileText className="w-4 h-4 text-[#4B2A7B]" />}
              >
                Export PDF Brief
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareSummary}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Share Summary
              </Button>
            </div>
          </div>

          {/* Eco-Champion & Budget Gamification Trophy Box */}
          <div
            onClick={() => setIsGamificationModalOpen(true)}
            className="bg-white/95 hover:bg-white p-5 rounded-3xl border border-[#4B2A7B]/15 shadow-sm text-center shrink-0 w-full sm:w-64 space-y-2.5 transition-all cursor-pointer hover:shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-[#FF7A6B]" />
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Eco-Champion Ribbon</span>
            </div>

            <div className="py-1">
              <EcoRibbonRosette tier={gamification.ecoRibbon.tier} size="md" />
            </div>

            <div>
              <h4 className="text-sm font-bold font-serif text-[#1E1B24] group-hover:text-[#4B2A7B] transition-colors leading-tight">
                {gamification.ecoRibbon.title}
              </h4>
              <p className="text-[11px] text-[#5C5765] mt-0.5">
                Lv.{gamification.currentLevel} · {gamification.totalXp} XP Earned
              </p>
            </div>

            <div className="pt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#4B2A7B] group-hover:underline">
              <span>Inspect Badges</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Card>

      {/* 4 Core Pillars Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Pillar */}
        <Card
          padding="md"
          hoverable
          className="cursor-pointer space-y-2"
          onClick={() => onTabChange('budget')}
        >
          <div className="flex items-center justify-between text-[#5C5765]">
            <span className="text-xs font-semibold">Budget Pool</span>
            <DollarSign className="w-4 h-4 text-[#4B2A7B]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1E1B24] tabular-nums">
            {formatMinorToCurrency(totalSpentMinor, event.details.currency)}
          </p>
          <ProgressBar
            value={budgetUtilization}
            color={budgetUtilization > 100 ? 'coral' : budgetUtilization > 85 ? 'amber' : 'purple'}
            size="sm"
            showLabel
            label={`Of ${formatMinorToCurrency(event.details.totalBudgetMinor, event.details.currency, { compact: true })}`}
          />
        </Card>

        {/* Tasks Pillar */}
        <Card
          padding="md"
          hoverable
          className="cursor-pointer space-y-2"
          onClick={() => onTabChange('timeline')}
        >
          <div className="flex items-center justify-between text-[#5C5765]">
            <span className="text-xs font-semibold">Timeline & Gantt</span>
            <CheckSquare className="w-4 h-4 text-[#4B2A7B]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1E1B24] tabular-nums">
            {completedTasks} / {event.tasks.length} Done
          </p>
          <div className="text-xs text-[#5C5765] flex items-center justify-between">
            <span>{event.tasks.length - completedTasks} remaining</span>
            {overdueTasks > 0 && (
              <span className="text-rose-600 font-semibold font-mono">{overdueTasks} overdue</span>
            )}
          </div>
        </Card>

        {/* Guests Pillar */}
        <Card
          padding="md"
          hoverable
          className="cursor-pointer space-y-2"
          onClick={() => onTabChange('guests')}
        >
          <div className="flex items-center justify-between text-[#5C5765]">
            <span className="text-xs font-semibold">Guest RSVPs</span>
            <Users className="w-4 h-4 text-[#4B2A7B]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1E1B24] tabular-nums">
            {confirmedGuests} Confirmed
          </p>
          <div className="text-xs text-[#5C5765] flex items-center justify-between">
            <span>{pendingGuests} pending</span>
            <span className="text-[#4B2A7B] font-semibold">{event.details.estimatedGuestCount} total target</span>
          </div>
        </Card>

        {/* Vendors Pillar */}
        <Card
          padding="md"
          hoverable
          className="cursor-pointer space-y-2"
          onClick={() => onTabChange('vendors')}
        >
          <div className="flex items-center justify-between text-[#5C5765]">
            <span className="text-xs font-semibold">Vendor Bookings</span>
            <MapPin className="w-4 h-4 text-[#4B2A7B]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1E1B24] tabular-nums">
            {event.vendors.filter((v) => v.bookingStatus === 'booked').length} / {event.vendors.length} Booked
          </p>
          <div className="text-xs text-[#5C5765]">
            <span>{event.vendors.filter((v) => v.bookingStatus === 'quote_received').length} quotes under review</span>
          </div>
        </Card>
      </div>

      {/* Visual Gantt Milestones Spotlight */}
      {upcomingMilestones.length > 0 && (
        <Card variant="default" padding="md" className="space-y-3 border-[#4B2A7B]/15 bg-[#FFFDF9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4B2A7B] text-white flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-serif text-[#1E1B24] flex items-center gap-1.5">
                  Upcoming Planning Milestones
                  <Badge variant="purple" size="sm">
                    Gantt Schedule
                  </Badge>
                </h4>
                <p className="text-[11px] text-[#5C5765]">
                  Reverse-scheduled critical path milestones leading to {formatDateDisplay(event.details.date)}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onTabChange('timeline')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Gantt Timeline
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {upcomingMilestones.map((m) => {
              const rem = getDaysRemaining(m.deadline);
              const isDone = m.status === 'completed';
              return (
                <div
                  key={m.id}
                  onClick={() => onTabChange('timeline')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : rem.isPast
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-white border-[#4B2A7B]/10 hover:border-[#4B2A7B]/30 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[#5C5765]">
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      ◆ Milestone
                    </span>
                    <span className="font-mono">{m.deadline}</span>
                  </div>
                  <h5 className={`text-xs font-bold truncate mt-1 ${isDone ? 'line-through text-[#5C5765]' : 'text-[#1E1B24]'}`}>
                    {m.title}
                  </h5>
                  <div className="flex items-center justify-between text-[10px] mt-1 text-[#5C5765]">
                    <span className="capitalize">{m.phase.replace(' & ', '/')}</span>
                    <span className={isDone ? 'text-emerald-700 font-bold' : rem.isPast ? 'text-rose-600 font-bold' : 'text-[#4B2A7B] font-semibold'}>
                      {isDone ? 'Completed' : rem.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Launchpad to Other Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { tab: 'themes', label: 'Themes & Decor', desc: 'Color palettes & zones' },
          { tab: 'menu', label: 'Catering & Menu', desc: 'Portions & dietary checks' },
          { tab: 'locations', label: 'Venues & Weather', desc: 'Maps & rain contingencies' },
          { tab: 'chat', label: 'AI Assistant', desc: 'Contextual advisory chat' },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => onTabChange(item.tab)}
            className="p-4 rounded-2xl bg-white border border-[#4B2A7B]/10 hover:border-[#4B2A7B]/30 hover:bg-[#F3EEF8]/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#1E1B24] group-hover:text-[#4B2A7B] transition-colors">
                {item.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#4B2A7B] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[11px] text-[#5C5765]">{item.desc}</p>
          </button>
        ))}
      </div>

      {/* Printable Event Executive Brief Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Event Executive Brief & PDF Export"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#4B2A7B]/10">
            <span className="text-xs text-[#5C5765]">
              Clean executive summary formatted for distribution to co-hosts, family, or printers.
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print / Save as PDF
            </Button>
          </div>

          <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-[#4B2A7B]/15 space-y-5 text-[#1E1B24] print:border-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#4B2A7B]/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF7A6B]">
                  Official Event Brief
                </span>
                <h1 className="text-2xl font-bold font-serif text-[#1E1B24]">{event.details.title}</h1>
                <p className="text-xs text-[#5C5765]">
                  {formatDateDisplay(event.details.date)} · {event.details.city} {event.details.venueName && `· ${event.details.venueName}`}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="purple" size="sm">
                  {event.details.type.toUpperCase().replace('_', ' ')}
                </Badge>
                <span className="block text-[11px] text-[#5C5765] mt-1 font-mono">
                  {event.details.estimatedGuestCount} Guests Planned
                </span>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-[#F3EEF8]/40 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-[#5C5765] uppercase font-semibold">Total Budget</span>
                <p className="font-mono font-bold text-sm text-[#4B2A7B]">
                  {formatMinorToCurrency(event.details.totalBudgetMinor, event.details.currency)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#5C5765] uppercase font-semibold">Actual Committed</span>
                <p className="font-mono font-bold text-sm text-[#1E1B24]">
                  {formatMinorToCurrency(totalSpentMinor, event.details.currency)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#5C5765] uppercase font-semibold">Confirmed Attendees</span>
                <p className="font-mono font-bold text-sm text-emerald-700">
                  {confirmedGuests} Guests
                </p>
              </div>
            </div>

            {/* Budget Allocations */}
            <div>
              <h4 className="text-xs font-bold text-[#1E1B24] uppercase tracking-wider mb-2">
                Budget Allocations
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {event.budgetAllocations.map((a) => (
                  <div key={a.category} className="flex justify-between p-2 rounded-lg bg-white border border-[#4B2A7B]/10">
                    <span className="text-[#5C5765]">{a.category}</span>
                    <span className="font-mono font-semibold text-[#1E1B24]">{a.targetPercentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Highlights */}
            <div>
              <h4 className="text-xs font-bold text-[#1E1B24] uppercase tracking-wider mb-2">
                Event Day Schedule Highlights
              </h4>
              <div className="space-y-1.5 text-xs">
                {event.runOfShow.slice(0, 4).map((ros) => (
                  <div key={ros.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#4B2A7B]/10">
                    <span className="font-mono font-bold text-[#4B2A7B]">{ros.time}</span>
                    <span className="font-medium text-[#1E1B24] flex-1 px-3">{ros.title}</span>
                    <span className="text-[11px] text-[#5C5765]">{ros.owner}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency & Key Contacts */}
            <div>
              <h4 className="text-xs font-bold text-[#1E1B24] uppercase tracking-wider mb-2">
                Vendor & Key Logistics Contacts
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {event.vendors.slice(0, 4).map((v) => (
                  <div key={v.id} className="p-2 rounded-lg bg-white border border-[#4B2A7B]/10">
                    <span className="font-semibold text-[#1E1B24] block">{v.name} ({v.category})</span>
                    <span className="text-[11px] text-[#5C5765] block font-mono">{v.phone || 'Phone pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Gamification Showcase Modal */}
      <GamificationModal
        isOpen={isGamificationModalOpen}
        onClose={() => setIsGamificationModalOpen(false)}
        event={event}
        onNavigateToTab={onTabChange}
      />

      {/* Social Media Sharing & Preview Card Modal */}
      <SocialShareModal
        isOpen={isSocialShareOpen}
        onClose={() => setIsSocialShareOpen(false)}
        event={event}
      />
    </div>
  );
};
