import { AIPlanOutput } from '../../server/ai/planGenerator';
import { BudgetSavingsOutput } from '../../server/ai/budgetSavings';
import { ChatResponse, ChatActionProposal } from '../../server/ai/chatAssistant';
import { auth } from '../lib/firebase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      // Allow test / local dev fallback
      headers['x-bypass-auth'] = 'test_mode';
    }
  } catch {
    headers['x-bypass-auth'] = 'test_mode';
  }

  return headers;
}

export async function apiGeneratePlan(payload: {
  title: string;
  type: string;
  date: string;
  city: string;
  guestCount: number;
  totalBudgetMinor: number;
  currency: string;
  themePreference?: string;
  dietaryPreferences?: string[];
  culturalTraditions?: string;
  specialRequests?: string;
}): Promise<AIPlanOutput> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/plan', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Plan generation failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.plan;
}

export async function apiCheckClarifyingQuestions(payload: {
  title: string;
  type: string;
  date?: string;
  city?: string;
  guestCount?: number;
  totalBudgetMinor?: number;
  currency?: string;
  themePreference?: string;
  culturalTraditions?: string;
  specialRequests?: string;
}): Promise<{ missingFields: string[]; clarifyingQuestions: string[] }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/ai/clarify', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { missingFields: [], clarifyingQuestions: [] };
    const data = await res.json();
    return {
      missingFields: data.missingFields || [],
      clarifyingQuestions: data.clarifyingQuestions || [],
    };
  } catch {
    return { missingFields: [], clarifyingQuestions: [] };
  }
}

export async function apiRegenerateSection(payload: {
  sectionKey: string;
  sectionTitle: string;
  currentContent: string;
  instruction?: string;
  eventContext: {
    title: string;
    type: string;
    city: string;
    guestCount: number;
    themePreference?: string;
  };
}): Promise<{ updatedContent: string; changeSummary: string; source?: 'ai' | 'fallback'; fallbackReason?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/regenerate-section', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Section revision failed');
  }
  return await res.json();
}

export async function apiGetBudgetSavings(payload: {
  eventTitle: string;
  eventType: string;
  guestCount: number;
  totalBudgetMinor: number;
  currency: string;
  categorySpending: { category: string; targetMinor: number; actualMinor: number }[];
}): Promise<BudgetSavingsOutput> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/budget-savings', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to compute budget savings');
  }
  return await res.json();
}

export async function apiSendChatMessage(payload: {
  message: string;
  conversationHistory: { role: 'user' | 'assistant'; text: string }[];
  eventSnapshot: any;
}): Promise<ChatResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Chat assistant failed to respond');
  }
  return await res.json();
}

/**
 * SSE Streaming chat helper that listens to live text chunks and action cards
 */
export async function apiStreamChatMessage(
  payload: {
    message: string;
    conversationHistory: { role: 'user' | 'assistant'; text: string }[];
    eventSnapshot: any;
  },
  callbacks: {
    onToken: (token: string, source?: 'ai' | 'fallback', fallbackReason?: string) => void;
    onAction?: (action: ChatActionProposal) => void;
    onDone: (followUps?: string[], source?: 'ai' | 'fallback') => void;
    onError?: (error: Error) => void;
  }
): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Streaming failed with status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const rawJson = line.replace(/^data:\s*/, '').trim();
        if (rawJson === '[DONE]') {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(rawJson);
          if (parsed.type === 'token') {
            callbacks.onToken(parsed.text, parsed.source, parsed.fallbackReason);
          } else if (parsed.type === 'action' && callbacks.onAction) {
            callbacks.onAction(parsed.action);
          } else if (parsed.type === 'done') {
            callbacks.onDone(parsed.followUps, parsed.source);
          }
        } catch {
          // Ignore unparseable raw chunk
        }
      }
    }
  } catch (err: any) {
    if (callbacks.onError) callbacks.onError(err);
    else console.warn('[Stream Error]:', err);
  }
}

export async function apiGenerateIdeas(payload: {
  eventType: string;
  themeStyle?: string;
  budgetTier?: string;
  targetAudience?: string;
  season?: string;
}): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/ideas', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to generate ideas');
  }
  return await res.json();
}

export async function apiGenerateMenu(payload: {
  eventType: string;
  regionOrCuisine: string;
  season: string;
  timeOfDay: string;
  dietaryRules: string[];
  guestCount: number;
}): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/menu', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to generate menu');
  }
  return await res.json();
}

export async function apiGenerateInvitations(payload: {
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
}): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/invitations', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to generate invitations');
  }
  return await res.json();
}

export async function apiGetWeather(lat: number, lng: number, date: string, city?: string): Promise<any> {
  const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}&date=${date}${city ? `&city=${encodeURIComponent(city)}` : ''}`);
  if (!res.ok) throw new Error('Weather fetch failed');
  return await res.json();
}

export async function apiSearchVenues(city: string, type?: string): Promise<{ venues: any[]; source?: 'ai' | 'fallback' }> {
  const res = await fetch(`/api/venues/search?city=${encodeURIComponent(city)}&type=${type || 'all'}`);
  if (!res.ok) throw new Error('Venues search failed');
  const data = await res.json();
  return {
    venues: data.venues || [],
    source: data.source,
  };
}
