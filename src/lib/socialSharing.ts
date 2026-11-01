import { EventFull } from '../types';
import { formatDateDisplay } from './formatters';

export interface SocialShareConfig {
  event: EventFull;
  customMessage?: string;
  baseUrl?: string;
}

export interface SocialShareUrls {
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  email: string;
  publicUrl: string;
}

export function getEventPublicUrl(eventId: string, customBaseUrl?: string): string {
  const origin =
    customBaseUrl ||
    (typeof window !== 'undefined' && window.location ? window.location.origin : 'https://event-ai.app');
  return `${origin}/share/${eventId}`;
}

export function getDefaultShareCaption(event: EventFull): string {
  const title = event.details.title;
  const date = formatDateDisplay(event.details.date);
  const city = event.details.city;
  return `Join us for ${title}! Taking place on ${date} in ${city}. Check out the full event schedule, theme, and details.`;
}

export function generateSocialShareUrls(config: SocialShareConfig): SocialShareUrls {
  const { event, customMessage, baseUrl } = config;
  const publicUrl = getEventPublicUrl(event.details.id, baseUrl);
  const text = customMessage || getDefaultShareCaption(event);

  // Twitter / X intent
  const twitterParams = new URLSearchParams({
    text,
    url: publicUrl,
    hashtags: `${event.details.type.replace('_', '')},EventPlanning,Celebration`,
  });
  const twitter = `https://twitter.com/intent/tweet?${twitterParams.toString()}`;

  // Facebook share dialog
  const facebookParams = new URLSearchParams({
    u: publicUrl,
    quote: text,
  });
  const facebook = `https://www.facebook.com/sharer/sharer.php?${facebookParams.toString()}`;

  // LinkedIn share dialog
  const linkedinParams = new URLSearchParams({
    url: publicUrl,
  });
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?${linkedinParams.toString()}`;

  // WhatsApp intent
  const whatsappText = `${text}\n\n${publicUrl}`;
  const whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  // Email
  const emailParams = new URLSearchParams({
    subject: `Invitation & Plan: ${event.details.title}`,
    body: `${text}\n\nView the verified event plan and itinerary here:\n${publicUrl}`,
  });
  const email = `mailto:?${emailParams.toString()}`;

  return {
    twitter,
    facebook,
    linkedin,
    whatsapp,
    email,
    publicUrl,
  };
}

export function generateEventSchemaJsonLd(event: EventFull, customBaseUrl?: string): string {
  const publicUrl = getEventPublicUrl(event.details.id, customBaseUrl);
  const startDate = event.details.startTime
    ? `${event.details.date}T${event.details.startTime}:00`
    : `${event.details.date}T10:00:00`;
  const endDate = event.details.endDate
    ? event.details.endTime
      ? `${event.details.endDate}T${event.details.endTime}:00`
      : `${event.details.endDate}T22:00:00`
    : `${event.details.date}T22:00:00`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.details.title,
    startDate,
    endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.details.venueName || `${event.details.city} Celebration Venue`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.details.city,
        addressCountry: 'IN',
      },
    },
    image: event.details.coverImage ? [event.details.coverImage] : [],
    description:
      event.planSections[0]?.content ||
      `${event.details.title} — structured celebration planning with Event AI.`,
    organizer: {
      '@type': 'Organization',
      name: 'Event AI Planner',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://event-ai.app',
    },
    offers: {
      '@type': 'Offer',
      url: publicUrl,
      price: '0',
      priceCurrency: event.details.currency || 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  return JSON.stringify(schema, null, 2);
}

export async function shareViaWebShareApi(
  event: EventFull,
  customMessage?: string
): Promise<boolean> {
  const publicUrl = getEventPublicUrl(event.details.id);
  const text = customMessage || getDefaultShareCaption(event);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: event.details.title,
        text,
        url: publicUrl,
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed, falling back to modal:', err);
      }
      return false;
    }
  }
  return false;
}
