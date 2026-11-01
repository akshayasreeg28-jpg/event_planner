import React, { useRef } from 'react';
import { EventFull } from '../../types';
import { formatDateDisplay, getDaysRemaining } from '../../lib/formatters';
import { calculateGamification } from '../../lib/gamification';
import { EcoRibbonRosette } from '../gamification/EcoRibbonRosette';
import { Calendar, MapPin, Sparkles, ExternalLink, Globe } from 'lucide-react';

export type SocialPlatformMode = 'twitter' | 'facebook' | 'whatsapp';

interface EventSocialPreviewCardProps {
  event: EventFull;
  mode?: SocialPlatformMode;
  className?: string;
}

export const EventSocialPreviewCard: React.FC<EventSocialPreviewCardProps> = ({
  event,
  mode = 'twitter',
  className = '',
}) => {
  const remaining = getDaysRemaining(event.details.date);
  const gamification = calculateGamification(event);
  const publicUrl = typeof window !== 'undefined' ? `${window.location.host}/share/${event.details.id}` : `event-ai.app/share/${event.details.id}`;

  const coverImage =
    event.details.coverImage ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80';

  if (mode === 'facebook') {
    return (
      <div className={`overflow-hidden rounded-xl border border-[#CED0D4] bg-white shadow-xs font-sans text-left transition-all ${className}`}>
        {/* Cover Image Container */}
        <div className="relative aspect-[1.91/1] w-full bg-slate-900 overflow-hidden">
          <img
            src={coverImage}
            alt={event.details.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {/* Subtle top banner badge */}
          <div className="absolute top-3 left-3 bg-[#1E1B24]/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF7A6B]" />
            <span>Event AI Plan</span>
          </div>

          {/* Eco Ribbon Pill */}
          {gamification.ecoRibbon.unlocked && (
            <div className="absolute top-3 right-3 bg-emerald-950/85 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
              <EcoRibbonRosette tier={gamification.ecoRibbon.tier} size="sm" />
              <span>{gamification.ecoRibbon.title}</span>
            </div>
          )}

          {/* Date pill overlay */}
          <div className="absolute bottom-3 left-3 bg-[#4B2A7B]/90 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#FF7A6B]" />
            <span>{formatDateDisplay(event.details.date)}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-[#FF7A6B]">{remaining.label}</span>
          </div>
        </div>

        {/* Facebook Link Snippet Box */}
        <div className="p-3.5 bg-[#F0F2F5] border-t border-[#CED0D4] space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#65676B] font-semibold block">
            EVENT-AI.APP
          </span>
          <h4 className="text-sm font-bold text-[#050505] leading-snug line-clamp-1">
            {event.details.title}
          </h4>
          <p className="text-xs text-[#65676B] line-clamp-1">
            {event.details.city} {event.details.venueName ? `· ${event.details.venueName}` : ''} — View full run-of-show, theme palette, and RSVP.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'whatsapp') {
    return (
      <div className={`overflow-hidden rounded-2xl border border-emerald-200 bg-[#EFEAE2] p-2.5 text-left max-w-sm ${className}`}>
        {/* WhatsApp Chat Bubble */}
        <div className="rounded-xl bg-white shadow-xs overflow-hidden border border-emerald-100">
          <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
            <img
              src={coverImage}
              alt={event.details.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {gamification.ecoRibbon.title}
            </div>
          </div>

          <div className="p-3 space-y-1">
            <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
              {event.details.title}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2">
              Official event plan and guest itinerary in {event.details.city} on {formatDateDisplay(event.details.date)}.
            </p>
            <div className="text-[10px] text-emerald-700 font-mono pt-1 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{publicUrl}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Twitter / X Summary with Large Image Card
  return (
    <div className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm font-sans text-left transition-all ${className}`}>
      {/* 2:1 Large Card Image */}
      <div className="relative aspect-[2/1] w-full bg-slate-900 overflow-hidden">
        <img
          src={coverImage}
          alt={event.details.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Gradient dark scrim for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="bg-[#1E1B24]/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A6B]" />
            <span className="font-serif">Event AI Master Plan</span>
          </div>

          {gamification.ecoRibbon.unlocked && (
            <div className="bg-emerald-950/85 backdrop-blur-md text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-400/40 flex items-center gap-1 shadow-sm">
              <EcoRibbonRosette tier={gamification.ecoRibbon.tier} size="sm" />
              <span>{gamification.ecoRibbon.title}</span>
            </div>
          )}
        </div>

        {/* Bottom Banner Content on Image */}
        <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-[#FF7A6B] text-white font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              {event.details.type.replace('_', ' ')}
            </span>
            <span className="text-zinc-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#FF7A6B]" />
              {formatDateDisplay(event.details.date)}
            </span>
            <span>·</span>
            <span className="text-amber-300 font-bold">{remaining.label}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold font-serif text-white line-clamp-1 drop-shadow-sm">
            {event.details.title}
          </h3>
        </div>
      </div>

      {/* Twitter Card Details Footer */}
      <div className="p-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
            <Globe className="w-3 h-3" />
            <span className="truncate">{publicUrl}</span>
          </div>
          <h4 className="text-xs font-bold text-zinc-900 truncate">
            {event.details.title} — Official Event Schedule & RSVP
          </h4>
          <p className="text-[11px] text-zinc-500 truncate">
            {event.details.city} · {event.details.estimatedGuestCount} Guests · Verified architectural specifications
          </p>
        </div>

        <div className="shrink-0 p-2 rounded-xl bg-zinc-200/80 text-zinc-700">
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
