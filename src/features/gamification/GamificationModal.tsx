import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { EventFull, GamificationBadge, BadgeCategory } from '../../types';
import { calculateGamification } from '../../lib/gamification';
import { EcoRibbonRosette } from './EcoRibbonRosette';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatMinorToCurrency } from '../../lib/formatters';
import {
  Leaf,
  ShieldCheck,
  Award,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  MapPin,
  CheckSquare,
  Lock,
  Flame,
  Info,
  Share2,
} from 'lucide-react';

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventFull;
  onNavigateToTab?: (tabKey: string) => void;
}

export const GamificationModal: React.FC<GamificationModalProps> = ({
  isOpen,
  onClose,
  event,
  onNavigateToTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | BadgeCategory>('all');
  const gamification = calculateGamification(event);

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#FF7A6B', '#4B2A7B', '#F59E0B'],
    });
  };

  const getBadgeIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-6 h-6 ${unlocked ? 'text-[#4B2A7B]' : 'text-stone-400'}`;
    switch (iconName) {
      case 'Leaf':
        return <Leaf className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'TrendingDown':
        return <TrendingDown className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'MapPin':
        return <MapPin className={className} />;
      case 'CheckSquare':
        return <CheckSquare className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  const filteredBadges =
    selectedCategory === 'all'
      ? gamification.badges
      : gamification.badges.filter((b) => b.category === selectedCategory);

  const unlockedCount = gamification.badges.filter((b) => b.unlocked).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eco-Champion & Budget Efficiency Awards"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Ribbon & Level Hero Spotlight */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D184C] via-[#4B2A7B] to-[#1E1133] p-6 text-white shadow-xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF7A6B]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
            {/* Eco Ribbon Rosette */}
            <div className="flex flex-col items-center text-center shrink-0">
              <EcoRibbonRosette tier={gamification.ecoRibbon.tier} size="lg" />
              <div className="mt-6 text-center">
                <span className="inline-block text-[11px] font-mono tracking-widest text-emerald-300 uppercase font-bold">
                  Official Award Ribbon
                </span>
                <h4 className="text-lg font-bold font-serif text-white leading-tight">
                  {gamification.ecoRibbon.title}
                </h4>
              </div>
            </div>

            {/* Level & XP Overview */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#FF7A6B] font-bold">
                    Planner Rank Lv.{gamification.currentLevel}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
                    {gamification.levelTitle}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-lg">
                    <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span>{gamification.totalXp} XP</span>
                  </div>
                  <span className="text-[11px] text-zinc-300">
                    {gamification.currentLevel === 5
                      ? 'Maximum Rank Achieved'
                      : `${gamification.nextLevelXp - gamification.totalXp} XP to Level ${gamification.currentLevel + 1}`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${gamification.progressToNextLevel}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-300 font-mono">
                  <span>Lv.{gamification.currentLevel}</span>
                  <span>{gamification.progressToNextLevel}% progress</span>
                  <span>Lv.{gamification.currentLevel === 5 ? 'MAX' : gamification.currentLevel + 1}</span>
                </div>
              </div>

              {/* Quick Actions & Celebration */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleCelebrate}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Celebrate Achievement
                </button>
                <span className="text-xs text-zinc-300">
                  {unlockedCount} of {gamification.badges.length} Badges Earned
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Sustainable Vendors */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#4B2A7B]/10 space-y-1">
            <div className="flex items-center justify-between text-[#5C5765]">
              <span className="text-xs font-semibold">Green Vendors</span>
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-[#1E1B24]">
              {gamification.stats.sustainableVendors} / {gamification.stats.totalVendors}
            </div>
            <p className="text-[10px] text-[#5C5765]">
              {Math.round(gamification.stats.sustainabilityRatio * 100)}% Eco-Certified
            </p>
          </div>

          {/* Budget Adherence */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#4B2A7B]/10 space-y-1">
            <div className="flex items-center justify-between text-[#5C5765]">
              <span className="text-xs font-semibold">Budget Variance</span>
              <TrendingDown
                className={`w-4 h-4 ${
                  gamification.stats.budgetStatus === 'deficit' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              />
            </div>
            <div
              className={`text-lg font-bold font-mono ${
                gamification.stats.budgetStatus === 'deficit' ? 'text-rose-600' : 'text-[#4B2A7B]'
              }`}
            >
              {gamification.stats.budgetVarianceMinor >= 0 ? '+' : ''}
              {formatMinorToCurrency(gamification.stats.budgetVarianceMinor, event.details.currency, {
                compact: true,
              })}
            </div>
            <p className="text-[10px] text-[#5C5765]">
              {gamification.stats.budgetStatus === 'deficit'
                ? 'Budget Overrun'
                : 'Surplus / On Track'}
            </p>
          </div>

          {/* Eco Score */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#4B2A7B]/10 space-y-1">
            <div className="flex items-center justify-between text-[#5C5765]">
              <span className="text-xs font-semibold">Eco Score</span>
              <Award className="w-4 h-4 text-[#FF7A6B]" />
            </div>
            <div className="text-lg font-bold font-mono text-[#1E1B24]">
              {gamification.stats.ecoScore}/100
            </div>
            <p className="text-[10px] text-[#5C5765]">{event.details.ecoScore?.rating || 'Gold'} Rating</p>
          </div>

          {/* Savings Applied */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#4B2A7B]/10 space-y-1">
            <div className="flex items-center justify-between text-[#5C5765]">
              <span className="text-xs font-semibold">AI Savings</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold font-mono text-[#1E1B24]">
              {gamification.stats.savingsAppliedCount} Applied
            </div>
            <p className="text-[10px] text-[#5C5765]">
              {formatMinorToCurrency(gamification.stats.totalSavingsMinor, event.details.currency, {
                compact: true,
              })}
            </p>
          </div>
        </div>

        {/* Actionable Tips to Ascend Next Level */}
        {gamification.actionableTips.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Recommendations to Unlock More Badges & XP</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-950">
              {gamification.actionableTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Badges Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4B2A7B]/10 pb-2">
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'all', label: 'All Badges' },
                { id: 'sustainability', label: 'Eco & Sustainability' },
                { id: 'budget', label: 'Budget Adherence' },
                { id: 'efficiency', label: 'Efficiency' },
                { id: 'planning', label: 'Milestones' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#4B2A7B] text-white shadow-xs'
                    : 'text-[#5C5765] hover:bg-[#F3EEF8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
          {filteredBadges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'bg-white border-[#4B2A7B]/20 shadow-xs'
                  : 'bg-stone-50/80 border-stone-200 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Badge Icon Medallion */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    badge.unlocked
                      ? badge.category === 'sustainability'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : badge.category === 'budget' || badge.category === 'efficiency'
                        ? 'bg-purple-50 border-purple-200 text-[#4B2A7B]'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-stone-100 border-stone-200 text-stone-400'
                  }`}
                >
                  {getBadgeIcon(badge.iconName, badge.unlocked)}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold font-serif text-[#1E1B24] truncate">
                      {badge.title}
                    </h4>
                    {badge.unlocked ? (
                      <Badge variant="success" size="sm">
                        +{badge.xpReward} XP
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#5C5765] leading-snug line-clamp-2">
                    {badge.description}
                  </p>

                  {/* Progress & Status */}
                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-[#5C5765]">
                      <span>{badge.progressLabel}</span>
                      <span className="font-mono font-semibold">{badge.progress}%</span>
                    </div>
                    <ProgressBar
                      value={badge.progress}
                      color={
                        badge.unlocked
                          ? badge.category === 'sustainability'
                            ? 'green'
                            : 'purple'
                          : undefined
                      }
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#4B2A7B]/10">
          <div className="text-xs text-[#5C5765]">
            Eco-Champion ribbons and badges update in real-time as you tag sustainable vendors and control budget.
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigateToTab('vendors');
                }}
                leftIcon={<Leaf className="w-4 h-4 text-emerald-600" />}
              >
                Go to Vendors
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
