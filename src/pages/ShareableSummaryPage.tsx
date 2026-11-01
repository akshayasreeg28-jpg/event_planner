import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { getEventById, getStoredEvents, upsertEvent } from '../lib/storage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatMinorToCurrency, formatDateDisplay, getDaysRemaining } from '../lib/formatters';
import { getEventTheme, getEventThemeStyle } from '../lib/themeTokens';
import { generateEventSchemaJsonLd, generateSocialShareUrls } from '../lib/socialSharing';
import { useToast } from '../components/ui/Toast';
import { EventFull, Guest } from '../types';
import {
  Flame,
  Printer,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  Check,
  Send,
  Sparkles,
  CloudSun,
  Navigation,
  MessageCircle,
  ExternalLink,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type InvitationTone = 'traditional' | 'warm' | 'poetic' | 'festive';

export const ShareableSummaryPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { showToast } = useToast();

  const events = getStoredEvents();
  const [event, setEvent] = useState<EventFull | null>(
    () => events.find((e) => e.details.id === eventId) || events[0] || null
  );

  const [activeTone, setActiveTone] = useState<InvitationTone>('warm');
  const [copiedTone, setCopiedTone] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [showFullPlan, setShowFullPlan] = useState(false);

  // Guest RSVP form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState<Guest['dietaryNeeds']>('standard');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  useEffect(() => {
    if (!event) return;
    const prevTitle = document.title;
    document.title = `${event.details.title} — Official Celebration & RSVP`;

    // Dynamic Schema.org JSON-LD
    let scriptTag = document.getElementById('event-schema-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'event-schema-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = generateEventSchemaJsonLd(event);

    return () => {
      document.title = prevTitle;
    };
  }, [event]);

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-4">
        <p className="text-sm text-[var(--app-text-muted)]">Event not found.</p>
      </div>
    );
  }

  const remaining = getDaysRemaining(event.details.date);
  const theme = getEventTheme(event.details.type);
  const themeStyle = getEventThemeStyle(event.details.type);

  // 4 Curated Invitation Tones
  const invitationTexts: Record<InvitationTone, { label: string; text: string }> = {
    traditional: {
      label: 'Traditional & Royal',
      text: `With the divine grace and blessings of our families, we cordially invite you to celebrate the joyous occasion of ${event.details.title}.\n\n📅 Date: ${formatDateDisplay(event.details.date)}\n📍 Venue: ${event.details.venueName || 'Premier Celebration Venue'}, ${event.details.city}\n\nYour presence and warm blessings will make our special day truly memorable. Kindly confirm your presence by RSVPing here: ${window.location.origin}/share/${event.details.id}`,
    },
    warm: {
      label: 'Warm & Casual',
      text: `We're getting together to celebrate ${event.details.title} and it wouldn't be complete without you!\n\nJoin us for good food, laughter, and great memories on ${formatDateDisplay(event.details.date)} in ${event.details.city}.\n\nPlease let us know if you can make it here: ${window.location.origin}/share/${event.details.id}`,
    },
    poetic: {
      label: 'Poetic & Emotional',
      text: `Moments become cherished memories when shared with the people who matter most. We invite you to be part of our milestone at ${event.details.title}.\n\n✨ When: ${formatDateDisplay(event.details.date)}\n🏛️ Where: ${event.details.city}\n\nJoin hands with us in making this chapter unforgettable. RSVP at ${window.location.origin}/share/${event.details.id}`,
    },
    festive: {
      label: 'Modern & Festive',
      text: `Get ready for music, delicious dining, and high-energy celebration! You're officially invited to ${event.details.title}!\n\n🎉 ${formatDateDisplay(event.details.date)} | ${event.details.city}\n\nDress up, bring your best vibes, and tap below to confirm your spot: ${window.location.origin}/share/${event.details.id}`,
    },
  };

  const handleCopyInvitation = async () => {
    try {
      await navigator.clipboard.writeText(invitationTexts[activeTone].text);
      setCopiedTone(true);
      showToast({ type: 'success', title: 'Invitation Text Copied!' });
      setTimeout(() => setCopiedTone(false), 2000);
    } catch {
      showToast({ type: 'error', title: 'Failed to copy text' });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopiedLink(true);
      showToast({ type: 'success', title: 'Celebration Link Copied!' });
      setTimeout(() => setIsCopiedLink(false), 2000);
    } catch {
      showToast({ type: 'error', title: 'Failed to copy link' });
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(invitationTexts[activeTone].text);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleGuestRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newGuest: Guest = {
      id: `gst_${Date.now()}`,
      name: guestName.trim(),
      email: guestEmail.trim() || undefined,
      phone: guestPhone.trim() || undefined,
      groupSide: 'general',
      plusOnes: Number(plusOnes) || 0,
      dietaryNeeds: dietary,
      dietaryNotes: dietaryNotes.trim() || undefined,
      invitationStatus: 'delivered',
      rsvpStatus: 'confirmed',
      rsvpToken: `tok_${Math.random().toString(36).substring(2, 9)}`,
      submittedAt: new Date().toISOString(),
    };

    const updatedEvent: EventFull = {
      ...event,
      guests: [...(event.guests || []), newGuest],
      details: { ...event.details, updatedAt: new Date().toISOString() },
    };

    upsertEvent(updatedEvent);
    setEvent(updatedEvent);
    setRsvpSuccess(true);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    showToast({
      type: 'success',
      title: 'RSVP Confirmed!',
      description: `Thank you ${guestName}! Your response has been recorded.`,
    });
  };

  return (
    <div style={themeStyle} className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] selection:bg-[#FF7A6B]/20 selection:text-[#4B2A7B]">
      {/* Top Bar for Navigating Back */}
      <header className="sticky top-0 z-30 bg-[var(--app-surface-raised)]/90 backdrop-blur-md border-b border-[var(--event-border)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          to={`/events/${event.details.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--event-primary)] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Workspace
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {isCopiedLink ? 'Link Copied' : 'Copy Link'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRsvpModalOpen(true)}
            leftIcon={<Heart className="w-4 h-4 text-[#FF7A6B]" />}
          >
            RSVP Now
          </Button>
        </div>
      </header>

      {/* Hero Celebration Showcase Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-black/85 via-black/70 to-black/85 text-white">
        {event.details.coverImage && (
          <img
            src={event.details.coverImage}
            alt={event.details.title}
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.55] scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--app-bg)] via-transparent to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-white border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A6B]" />
            <span>Honored Celebration Invitation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight drop-shadow-md">
            {event.details.title}
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
            You are warmly invited to be part of our milestone celebration in {event.details.city}.
          </p>

          {/* Quick Date, Venue & Countdown Pill Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 text-xs sm:text-sm font-medium">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Calendar className="w-4 h-4 text-[#FF7A6B]" />
              {formatDateDisplay(event.details.date)}
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {event.details.venueName || 'Premier Celebration Venue'}, {event.details.city}
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-md font-mono font-bold text-[#FF7A6B]">
              <Clock className="w-4 h-4" />
              {remaining.label}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsRsvpModalOpen(true)}
              leftIcon={<Heart className="w-5 h-5 text-[#FF7A6B]" />}
              className="shadow-xl hover:scale-105 transition-transform"
            >
              Confirm My Attendance
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleShareWhatsApp}
              leftIcon={<MessageCircle className="w-5 h-5 text-[#25D366]" />}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
            >
              Share via WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Invitation Copy Generator Card (4 Tones) */}
        <Card variant="raised" padding="lg" className="space-y-4 border-2 border-[var(--event-border)] shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF7A6B]" />
                <h3 className="text-base font-bold font-serif text-[var(--app-text)]">
                  Personalized Invitation Wording
                </h3>
              </div>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Select your preferred tone to invite guests via WhatsApp or message.
              </p>
            </div>

            {/* Tone selector buttons */}
            <div className="flex items-center gap-1 p-1 bg-[var(--app-surface-subtle)] rounded-xl overflow-x-auto no-scrollbar">
              {(['traditional', 'warm', 'poetic', 'festive'] as InvitationTone[]).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setActiveTone(tone)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTone === tone
                      ? 'bg-[var(--app-surface)] text-[var(--event-primary)] shadow-sm font-bold'
                      : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                  }`}
                >
                  {invitationTexts[tone].label}
                </button>
              ))}
            </div>
          </div>

          {/* Invitation Text Box */}
          <div className="p-4 rounded-xl bg-[var(--app-surface-subtle)] border border-[var(--event-border)] relative">
            <p className="text-xs sm:text-sm text-[var(--app-text)] whitespace-pre-line leading-relaxed font-serif">
              {invitationTexts[activeTone].text}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--event-border)] mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInvitation}
                leftIcon={copiedTone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedTone ? 'Copied!' : 'Copy Wording'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShareWhatsApp}
                leftIcon={<MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />}
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white border-transparent"
              >
                Send on WhatsApp
              </Button>
            </div>
          </div>
        </Card>

        {/* Schedule & Venue Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schedule / Run-of-Show */}
          <Card variant="default" padding="lg" className="space-y-4 border border-[var(--event-border)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--event-primary)]" />
              <h3 className="text-base font-bold font-serif text-[var(--app-text)]">
                Celebration Schedule
              </h3>
            </div>

            {event.runOfShow && event.runOfShow.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--event-border)]">
                {event.runOfShow.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-4 pl-8 text-xs">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[var(--event-primary)] border-2 border-[var(--app-surface)] shadow-xs" />
                    <div>
                      <span className="font-mono font-bold text-[var(--event-primary)] block">
                        {item.time}
                      </span>
                      <span className="font-semibold text-[var(--app-text)] block">{item.title}</span>
                      {item.notes && (
                        <p className="text-[11px] text-[var(--app-text-muted)] mt-0.5">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--app-surface-subtle)] text-xs text-[var(--app-text-muted)] text-center">
                Detailed run-of-show will be published closer to the event date.
              </div>
            )}
          </Card>

          {/* Venue & Weather Card */}
          <Card variant="default" padding="lg" className="space-y-4 border border-[var(--event-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold font-serif text-[var(--app-text)]">
                  Venue & Climate
                </h3>
              </div>
              <CloudSun className="w-4 h-4 text-amber-500" />
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--app-surface-subtle)] border border-[var(--event-border)] space-y-2">
              <div>
                <span className="text-xs font-bold text-[var(--app-text)] block">
                  {event.details.venueName || `${event.details.city} Convention & Banquet Center`}
                </span>
                <span className="text-[11px] text-[var(--app-text-muted)] block">
                  {event.details.city}, India
                </span>
              </div>

              <div className="pt-2 border-t border-[var(--event-border)] flex items-center justify-between text-xs">
                <span className="text-[11px] text-amber-700 font-medium">
                  Expected Weather: 28°C · Sunny & Pleasant
                </span>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${event.details.venueName || ''} ${event.details.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--event-primary)] hover:underline"
                >
                  <Navigation className="w-3 h-3" /> Get Directions
                </a>
              </div>
            </div>

            {/* Dietary Hospitality Note */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">Hospitality & Dining:</span>
              <p className="text-[11px]">
                {event.details.dietaryPreferences.length > 0
                  ? `Curated culinary selections available including ${event.details.dietaryPreferences.join(', ')}.`
                  : 'Multi-course banquet with vegetarian, vegan, and special dietary care provided.'}
              </p>
            </div>
          </Card>
        </div>

        {/* Optional Collapsible Master Plan Export */}
        <div className="border-t border-[var(--event-border)] pt-6">
          <button
            type="button"
            onClick={() => setShowFullPlan(!showFullPlan)}
            className="flex items-center justify-between w-full p-4 rounded-xl bg-[var(--app-surface)] border border-[var(--event-border)] text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--app-surface-subtle)] transition-colors"
          >
            <span>Architectural Master Plan & Specifications</span>
            {showFullPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullPlan && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.planSections.map((sec) => (
                  <div key={sec.id} className="p-4 rounded-xl bg-[var(--app-surface)] border border-[var(--event-border)] space-y-1">
                    <h4 className="text-xs font-bold text-[var(--event-primary)]">{sec.title}</h4>
                    <p className="text-xs text-[var(--app-text)] leading-relaxed whitespace-pre-line">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-3.5 h-3.5" />}>
                  Print Master Plan
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Guest RSVP Modal */}
      <Modal
        isOpen={isRsvpModalOpen}
        onClose={() => {
          setIsRsvpModalOpen(false);
          setRsvpSuccess(false);
        }}
        title={`RSVP for ${event.details.title}`}
      >
        {rsvpSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold font-serif text-[var(--app-text)]">You're on the Guest List!</h4>
            <p className="text-xs text-[var(--app-text-muted)] max-w-xs mx-auto">
              We look forward to celebrating with you on {formatDateDisplay(event.details.date)}!
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsRsvpModalOpen(false);
                setRsvpSuccess(false);
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleGuestRsvp} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[var(--app-text)]">Full Name *</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[var(--app-text)]">Phone Number</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--app-text)]">Email Address</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="vikram@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[var(--app-text)]">Plus-Ones Attending</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--app-text)]">Dietary Preference</label>
                <select
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
                >
                  <option value="standard">Standard (Non-Veg / All)</option>
                  <option value="vegetarian">Pure Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="jain">Jain (No Root Veg)</option>
                  <option value="halal">Halal</option>
                  <option value="gluten_free">Gluten Free</option>
                  <option value="allergies">Nut / Severe Allergy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[var(--app-text)]">Allergies or Special Notes</label>
              <input
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g. Peanut allergy, wheelchair access"
                className="w-full px-3 py-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsRsvpModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
                Submit RSVP
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
