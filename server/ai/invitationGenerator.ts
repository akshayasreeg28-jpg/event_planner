import { z } from 'zod';
import { callGemini, Type, GeminiConfigError } from './geminiClient';

export const InvitationWordingSchema = z.object({
  source: z.enum(['ai', 'fallback']).default('ai'),
  fallbackReason: z.string().optional(),
  isFallback: z.boolean().default(false),
  formal: z.string(),
  casual: z.string(),
  playful: z.string(),
  traditional: z.string(),
  regionalTranslation: z.object({
    language: z.string(),
    text: z.string(),
  }),
  rsvpWhatsAppFormat: z.string(),
});

export type InvitationWording = z.infer<typeof InvitationWordingSchema>;

const invitationSchema = {
  type: Type.OBJECT,
  properties: {
    formal: { type: Type.STRING, description: 'Elegant, ceremonial formal invitation copy.' },
    casual: { type: Type.STRING, description: 'Warm, personal casual invitation copy.' },
    playful: { type: Type.STRING, description: 'High-energy, upbeat modern invitation copy.' },
    traditional: { type: Type.STRING, description: 'Auspicious, culturally anchored invitation copy.' },
    regionalTranslation: {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING },
        text: { type: Type.STRING },
      },
      required: ['language', 'text'],
    },
    rsvpWhatsAppFormat: {
      type: Type.STRING,
      description: 'Concise, beautifully formatted WhatsApp text with emojis and [RSVP_LINK] placeholder.',
    },
  },
  required: ['formal', 'casual', 'playful', 'traditional', 'regionalTranslation', 'rsvpWhatsAppFormat'],
};

export async function generateInvitationWording(params: {
  eventTitle: string;
  eventType: string;
  hostNames?: string;
  date: string;
  time?: string;
  venueName?: string;
  city: string;
  dressCode?: string;
  rsvpDeadline?: string;
  regionalLanguage?: string;
}): Promise<InvitationWording> {
  const systemInstruction = `You are an elite event calligrapher, copywriter, and invitations designer.
Generate invitation messages in 4 distinct tones (Formal, Casual/Warm, Playful/Modern, Traditional/Ceremonial) plus a translation in the requested regional language (e.g. Hindi, Tamil, Telugu, Marathi).
Also generate a pre-formatted short message ready to share directly over WhatsApp.
Return strictly valid JSON adhering to the schema.`;

  const prompt = `Event Details:
Event: ${params.eventTitle} (${params.eventType})
Hosts: ${params.hostNames || 'Our Family'}
Date: ${params.date}
Time: ${params.time || 'Evening'}
Venue: ${params.venueName || 'The Grand Hall'}, ${params.city}
Dress Code: ${params.dressCode || 'Festive Indian / Elegant Evening'}
RSVP Deadline: ${params.rsvpDeadline || '2 weeks before'}
Preferred Regional Language: ${params.regionalLanguage || 'Hindi'}`;

  try {
    let rawText = '';
    try {
      rawText = await callGemini({
        contents: prompt,
        systemInstruction,
        config: {
          responseMimeType: 'application/json',
          responseSchema: invitationSchema,
        },
        timeoutMs: 25000,
      });
    } catch (err: any) {
      if (err instanceof GeminiConfigError) {
        return createFallback(params, 'API_KEY_MISSING');
      }
      throw err;
    }

    let parsed = JSON.parse(rawText);
    const firstCheck = InvitationWordingSchema.safeParse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });

    if (firstCheck.success) {
      return firstCheck.data;
    }

    // Retry once with schema feedback
    const retryPrompt = `${prompt}\n\nATTENTION: Previous response failed schema validation: ${firstCheck.error.message}. Return valid JSON adhering strictly to the schema.`;
    rawText = await callGemini({
      contents: retryPrompt,
      systemInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema: invitationSchema,
      },
      timeoutMs: 20000,
    });
    parsed = JSON.parse(rawText);
    return InvitationWordingSchema.parse({
      ...parsed,
      source: 'ai',
      isFallback: false,
    });
  } catch (err: any) {
    console.warn('[Invitation Generator] Gemini call failed, returning fallback:', err.message);
    const reason = err instanceof GeminiConfigError
      ? 'API_KEY_MISSING'
      : err.name === 'GeminiTimeoutError'
      ? 'TIMEOUT'
      : 'API_ERROR';
    return createFallback(params, reason);
  }
}

function createFallback(
  params: {
    eventTitle: string;
    date: string;
    venueName?: string;
    city: string;
    regionalLanguage?: string;
  },
  reason: string
): InvitationWording {
  const fallback = generateFallbackInvitations(params);
  return {
    ...fallback,
    source: 'fallback',
    fallbackReason: reason,
    isFallback: true,
  };
}

function generateFallbackInvitations(params: {
  eventTitle: string;
  date: string;
  venueName?: string;
  city: string;
  regionalLanguage?: string;
}): {
  formal: string;
  casual: string;
  playful: string;
  traditional: string;
  regionalTranslation: { language: string; text: string };
  rsvpWhatsAppFormat: string;
} {
  const venue = params.venueName ? `${params.venueName}, ${params.city}` : params.city;
  const lang = params.regionalLanguage || 'Hindi';

  return {
    formal: `We request the honor of your presence to celebrate ${params.eventTitle} on ${params.date} at ${venue}. Your gracious blessings and company will illuminate our joyous milestone.`,
    casual: `Save the date! We are gathering all our closest friends and family to celebrate ${params.eventTitle} on ${params.date} at ${venue}. Can't wait to toast, laugh, and celebrate with you!`,
    playful: `Big smiles, great food, and zero stress! Join us for ${params.eventTitle} on ${params.date} at ${venue}. Bring your best energy and dancing shoes!`,
    traditional: `With the benign blessings of the Almighty, we cordially invite you and your family to grace the auspicious occasion of ${params.eventTitle} on ${params.date} at ${venue}.`,
    regionalTranslation: {
      language: lang,
      text:
        lang.toLowerCase() === 'tamil'
          ? `எங்கள் இல்ல ${params.eventTitle} விழாவிற்கு தாங்களும் தங்கள் குடும்பத்தாரும் வருகை தந்து ஆசீர்வதிக்குமாறு அன்புடன் அழைக்கிறோம். இடம்: ${venue}, நாள்: ${params.date}.`
          : `हमारे शुभ अवसर ${params.eventTitle} में आप सपरिवार सादर आमंत्रित हैं। दिनांक: ${params.date}, स्थान: ${venue}। आपकी उपस्थिति हमारे लिए अनमोल है।`,
    },
    rsvpWhatsAppFormat: `✨ You are cordially invited to *${params.eventTitle}*! ✨\n\n📅 Date: ${params.date}\n📍 Venue: ${venue}\n\nPlease confirm your RSVP by tapping the link below:\n👉 [RSVP_LINK]`,
  };
}
