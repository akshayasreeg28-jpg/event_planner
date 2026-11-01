import React from 'react';
import { RibbonTier } from '../../types';
import { Leaf, Award, Shield, Sparkles, Lock } from 'lucide-react';

interface EcoRibbonRosetteProps {
  tier: RibbonTier;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export const EcoRibbonRosette: React.FC<EcoRibbonRosetteProps> = ({
  tier,
  size = 'md',
  showLabel = false,
  className = '',
  onClick,
}) => {
  const isUnlocked = tier !== 'none';

  // Sizing definitions
  const dimensions = {
    sm: { rosette: 'w-10 h-10', icon: 'w-4 h-4', tails: 'w-6 h-5', text: 'text-[10px]' },
    md: { rosette: 'w-16 h-16', icon: 'w-7 h-7', tails: 'w-10 h-8', text: 'text-xs' },
    lg: { rosette: 'w-24 h-24', icon: 'w-10 h-10', tails: 'w-16 h-12', text: 'text-sm' },
    xl: { rosette: 'w-32 h-32', icon: 'w-14 h-14', tails: 'w-20 h-16', text: 'text-base' },
  }[size];

  // Visual themes per tier
  const themes = {
    emerald: {
      rosetteBg: 'from-emerald-700 via-emerald-600 to-teal-800',
      borderRing: 'border-emerald-300/60 shadow-emerald-900/30',
      centerBg: 'bg-emerald-950 text-emerald-200 border-emerald-400',
      tailGradient: 'from-emerald-700 to-teal-900',
      tailBorder: 'border-emerald-500/40',
      ribbonLabel: 'Emerald Eco-Champion',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
      laurelColor: '#34D399',
    },
    gold: {
      rosetteBg: 'from-amber-600 via-yellow-500 to-amber-700',
      borderRing: 'border-amber-200/70 shadow-amber-900/30',
      centerBg: 'bg-amber-950 text-amber-200 border-amber-300',
      tailGradient: 'from-amber-600 to-amber-800',
      tailBorder: 'border-amber-400/40',
      ribbonLabel: 'Gold Eco-Champion',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
      laurelColor: '#FBBF24',
    },
    silver: {
      rosetteBg: 'from-slate-500 via-gray-400 to-slate-700',
      borderRing: 'border-slate-200/60 shadow-slate-900/30',
      centerBg: 'bg-slate-900 text-slate-200 border-slate-300',
      tailGradient: 'from-slate-600 to-slate-800',
      tailBorder: 'border-slate-400/40',
      ribbonLabel: 'Silver Eco-Advocate',
      glow: 'shadow-[0_0_15px_rgba(156,163,175,0.25)]',
      laurelColor: '#CBD5E1',
    },
    bronze: {
      rosetteBg: 'from-amber-800 via-amber-700 to-amber-900',
      borderRing: 'border-amber-400/40 shadow-amber-950/30',
      centerBg: 'bg-stone-900 text-amber-300 border-amber-600',
      tailGradient: 'from-amber-800 to-stone-900',
      tailBorder: 'border-amber-700/40',
      ribbonLabel: 'Bronze Eco-Pioneer',
      glow: 'shadow-[0_0_15px_rgba(180,83,9,0.25)]',
      laurelColor: '#D97706',
    },
    none: {
      rosetteBg: 'from-zinc-400 via-zinc-500 to-zinc-600',
      borderRing: 'border-zinc-300/40 shadow-zinc-900/20',
      centerBg: 'bg-zinc-800 text-zinc-400 border-zinc-600',
      tailGradient: 'from-zinc-500 to-zinc-700',
      tailBorder: 'border-zinc-600/40',
      ribbonLabel: 'Eco Aspirant',
      glow: 'shadow-none',
      laurelColor: '#9CA3AF',
    },
  }[tier];

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center select-none relative group ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {/* Outer Rosette with ruffled scalloped effect */}
      <div className="relative flex items-center justify-center">
        {/* Pleated Rosette Backing Petals */}
        <div
          className={`${dimensions.rosette} rounded-full bg-gradient-to-tr ${themes.rosetteBg} p-1 shadow-lg ${themes.glow} transition-all duration-300 flex items-center justify-center relative`}
        >
          {/* Subtle sunburst / rosette segments */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/20 animate-spin-slow opacity-60 pointer-events-none" />

          {/* Inner Medallion Disc */}
          <div
            className={`w-4/5 h-4/5 rounded-full ${themes.centerBg} border-2 flex items-center justify-center shadow-inner relative z-10`}
          >
            {isUnlocked ? (
              tier === 'emerald' ? (
                <Leaf className={`${dimensions.icon} text-emerald-400 drop-shadow`} />
              ) : tier === 'gold' ? (
                <Award className={`${dimensions.icon} text-yellow-300 drop-shadow`} />
              ) : tier === 'silver' ? (
                <Shield className={`${dimensions.icon} text-slate-200 drop-shadow`} />
              ) : (
                <Sparkles className={`${dimensions.icon} text-amber-400 drop-shadow`} />
              )
            ) : (
              <Lock className={`${dimensions.icon} text-zinc-400 opacity-70`} />
            )}
          </div>
        </div>

        {/* Hanging Ribbon Tails (Swallowtail ribbons draping below rosette) */}
        {size !== 'sm' && (
          <div className="absolute -bottom-4 sm:-bottom-5 flex justify-center gap-1.5 z-0 pointer-events-none">
            {/* Left tail angled outward */}
            <div
              className={`${dimensions.tails} bg-gradient-to-b ${themes.tailGradient} border-x ${themes.tailBorder} transform -rotate-12 origin-top shadow-md`}
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)',
              }}
            />
            {/* Right tail angled outward */}
            <div
              className={`${dimensions.tails} bg-gradient-to-b ${themes.tailGradient} border-x ${themes.tailBorder} transform rotate-12 origin-top shadow-md`}
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)',
              }}
            />
          </div>
        )}
      </div>

      {/* Optional Under-Ribbon Label */}
      {showLabel && (
        <div className={`mt-5 sm:mt-6 text-center font-bold font-serif ${themes.ribbonLabel ? '' : ''} ${dimensions.text}`}>
          <span className="block text-[#1E1B24] tracking-wide">{themes.ribbonLabel}</span>
          <span className="block text-[10px] font-sans font-normal text-[#5C5765] uppercase tracking-wider">
            {isUnlocked ? 'Official Ribbon' : 'Unearned'}
          </span>
        </div>
      )}
    </div>
  );
};
