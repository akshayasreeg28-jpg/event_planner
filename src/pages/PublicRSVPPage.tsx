import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStoredEvents, upsertEvent } from '../lib/storage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { formatDateDisplay } from '../lib/formatters';
import {
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  MapPin,
  Utensils,
  Users,
} from 'lucide-react';

export const PublicRSVPPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToast();

  const events = getStoredEvents();
  // Find event and guest matching token
  let matchedEvent: any = null;
  let matchedGuest: any = null;

  for (const ev of events) {
    const foundGuest = ev.guests.find((g) => g.rsvpToken === token);
    if (foundGuest) {
      matchedEvent = ev;
      matchedGuest = foundGuest;
      break;
    }
  }

  // Fallback to demo guest if token is generic or demo
  if (!matchedGuest && events.length > 0) {
    matchedEvent = events[0];
    matchedGuest = matchedEvent.guests[0] || {
      id: 'demo_guest',
      name: 'Respected Guest',
      rsvpStatus: 'pending',
      plusOnes: 1,
      dietaryNeeds: 'vegetarian',
    };
  }

  const [rsvpStatus, setRsvpStatus] = useState<'confirmed' | 'declined' | 'pending'>(
    matchedGuest?.rsvpStatus || 'pending'
  );
  const [plusOnes, setPlusOnes] = useState<number>(matchedGuest?.plusOnes || 0);
  const [dietaryNeeds, setDietaryNeeds] = useState(matchedGuest?.dietaryNeeds || 'vegetarian');
  const [dietaryNotes, setDietaryNotes] = useState(matchedGuest?.dietaryNotes || '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedEvent || !matchedGuest) return;

    const updatedGuests = matchedEvent.guests.map((g: any) =>
      g.id === matchedGuest.id
        ? {
            ...g,
            rsvpStatus,
            plusOnes,
            dietaryNeeds,
            dietaryNotes,
            submittedAt: new Date().toISOString(),
          }
        : g
    );

    upsertEvent({ ...matchedEvent, guests: updatedGuests });
    setIsSubmitted(true);
    showToast({
      type: 'success',
      title: 'RSVP Received',
      description: `Thank you, ${matchedGuest.name}. Your response has been recorded.`,
    });
  };

  if (!matchedEvent) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-md space-y-4">
          <HelpCircle className="w-10 h-10 text-[#FF7A6B] mx-auto" />
          <h2 className="text-xl font-bold font-serif text-[#1E1B24]">Invalid RSVP Link</h2>
          <p className="text-xs text-[#5C5765]">This invitation token could not be verified.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-lg mx-auto w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#4B2A7B] text-white flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF7A6B]" />
            </div>
            <span className="text-xl font-bold font-serif text-[#1E1B24]">Event AI</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FF7A6B] block">
            Official Guest Invitation & RSVP
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1E1B24]">
            {matchedEvent.details.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#5C5765] pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#4B2A7B]" />
              {formatDateDisplay(matchedEvent.details.date)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#4B2A7B]" />
              {matchedEvent.details.venueName || matchedEvent.details.city}
            </span>
          </div>
        </div>

        {/* RSVP Card Form */}
        <Card variant="elevated" padding="lg">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif text-[#1E1B24]">Response Recorded!</h3>
              <p className="text-xs text-[#5C5765] leading-relaxed max-w-sm mx-auto">
                Thank you, <strong>{matchedGuest.name}</strong>. Your status is set to{' '}
                <strong className="capitalize">{rsvpStatus}</strong>. The host has been notified.
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)}>
                Update My Response
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-3 bg-[#F3EEF8]/60 rounded-xl text-xs text-[#5C5765]">
                Welcome, <strong className="text-[#1E1B24]">{matchedGuest.name}</strong>. Please confirm your attendance so the hosts can finalize catering and seating.
              </div>

              {/* Attendance Buttons */}
              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-2">Will you be attending? *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('confirmed')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      rsvpStatus === 'confirmed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-[#4B2A7B]/15 text-[#1E1B24] hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Joyfully Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('declined')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      rsvpStatus === 'declined'
                        ? 'bg-[#1E1B24] text-white border-[#1E1B24] shadow-sm'
                        : 'bg-white border-[#4B2A7B]/15 text-[#5C5765] hover:bg-black/5'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Regretfully Decline
                  </button>
                </div>
              </div>

              {rsvpStatus === 'confirmed' && (
                <>
                  {/* Plus Ones */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                      Number of additional guests (Plus-Ones)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={plusOnes}
                      onChange={(e) => setPlusOnes(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl font-mono"
                    />
                  </div>

                  {/* Dietary Requirements */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                      Dietary Preferences
                    </label>
                    <select
                      value={dietaryNeeds}
                      onChange={(e) => setDietaryNeeds(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl capitalize"
                    >
                      <option value="standard">Standard Catering</option>
                      <option value="vegetarian">Strict Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="jain">Jain (No root vegetables, garlic, onion)</option>
                      <option value="halal">Halal</option>
                      <option value="gluten_free">Gluten-Free</option>
                      <option value="allergies">Allergies (Nut/Dairy)</option>
                    </select>
                  </div>

                  {/* Allergy notes */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                      Special Dietary or Accessibility Notes
                    </label>
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="e.g. Peanut allergy, wheelchair access needed"
                      className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
                    />
                  </div>
                </>
              )}

              <Button type="submit" variant="primary" size="md" className="w-full">
                Submit Response
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
