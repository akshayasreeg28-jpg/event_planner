import { z } from 'zod';
import { ai, MODEL_NAME, Type, GeminiConfigError } from './geminiClient';
import { Response } from 'express';

export const ChatActionProposalSchema = z.object({
  id: z.string(),
  action: z.enum(['add_task', 'add_guest', 'update_budget_item', 'mark_task_done']),
  label: z.string(),
  params: z.record(z.string(), z.any()),
  confirmed: z.boolean().default(false),
});

export type ChatActionProposal = z.infer<typeof ChatActionProposalSchema>;

export const ChatResponseSchema = z.object({
  source: z.enum(['ai', 'fallback']).default('ai'),
  fallbackReason: z.string().optional(),
  replyText: z.string(),
  suggestedFollowUps: z.array(z.string()).optional(),
  actions: z.array(ChatActionProposalSchema).optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export interface ChatContextParams {
  message: string;
  conversationHistory: { role: 'user' | 'assistant'; text: string }[];
  eventSnapshot: {
    title: string;
    type: string;
    date: string;
    daysRemaining: number;
    city: string;
    guestCount: number;
    confirmedGuests: number;
    totalBudgetMinor: number;
    actualSpentMinor: number;
    currency: string;
    pendingTasksCount: number;
    overdueTasksCount: number;
    topPriorities: string[];
    // Extended live context
    tasks?: { id: string; title: string; phase: string; priority: string; completed: boolean }[];
    budgetItems?: { id: string; category: string; name: string; estimatedCostMinor: number; actualCostMinor: number }[];
    guests?: { id: string; name: string; group?: string; rsvpStatus: string; dietaryNeeds?: string }[];
    vendors?: { id: string; category: string; name: string; status: string }[];
  };
}

// Function tools for the chat assistant
const chatTools: any = [
  {
    functionDeclarations: [
      {
        name: 'add_task',
        description: 'Propose adding a new task to the event checklist.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Task title' },
            phase: {
              type: Type.STRING,
              description: 'One of: Initial Planning, Booking & Vendors, Purchasing & Decor, Final Confirmations, Event Day',
            },
            priority: {
              type: Type.STRING,
              description: 'One of: low, medium, high, critical',
            },
            deadline: { type: Type.STRING, description: 'ISO date string or relative deadline' },
          },
          required: ['title', 'phase', 'priority'],
        },
      },
      {
        name: 'add_guest',
        description: 'Propose adding a guest to the guest list.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Full name of the guest' },
            group: { type: Type.STRING, description: 'Family, Friends, Colleagues, VIP, etc.' },
            dietaryNeeds: { type: Type.STRING, description: 'Vegetarian, Vegan, Jain, Nut Allergy, etc.' },
            plusOnes: { type: Type.INTEGER, description: 'Number of extra attendees' },
          },
          required: ['name'],
        },
      },
      {
        name: 'update_budget_item',
        description: 'Propose creating or updating an expense line item in the event budget.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'Budget category (e.g. Catering, Venue, Decor)' },
            name: { type: Type.STRING, description: 'Name of the expense line item' },
            estimatedCostMinor: { type: Type.INTEGER, description: 'Estimated amount in minor units (paise/cents)' },
            actualCostMinor: { type: Type.INTEGER, description: 'Actual amount in minor units (paise/cents)' },
          },
          required: ['category', 'name', 'estimatedCostMinor'],
        },
      },
      {
        name: 'mark_task_done',
        description: 'Propose marking an existing task as completed.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            taskId: { type: Type.STRING, description: 'ID of the task to mark done' },
            taskTitle: { type: Type.STRING, description: 'Title of the task' },
          },
          required: ['taskId'],
        },
      },
    ],
  },
];

function buildSystemInstruction(snapshot: ChatContextParams['eventSnapshot']): string {
  const currencySymbol = snapshot.currency === 'INR' ? '₹' : '$';
  const totalBudgetMajor = Math.round(snapshot.totalBudgetMinor / 100);
  const spentMajor = Math.round(snapshot.actualSpentMinor / 100);

  const sampleTasks = (snapshot.tasks || []).slice(0, 10).map((t) => `- [${t.completed ? 'X' : ' '}] ${t.title} (${t.priority}, ${t.phase})`).join('\n');
  const sampleBudget = (snapshot.budgetItems || []).slice(0, 8).map((b) => `- ${b.category}: ${b.name} (${currencySymbol}${Math.round(b.estimatedCostMinor / 100).toLocaleString()})`).join('\n');

  return `You are "Event AI", an expert luxury and enterprise event producer embedded inside the user's workspace for "${snapshot.title}".

LIVE EVENT SNAPSHOT:
- Type: ${snapshot.type}
- Target Date: ${snapshot.date} (${snapshot.daysRemaining} days remaining)
- City: ${snapshot.city}
- Headcount: ${snapshot.confirmedGuests} confirmed / ${snapshot.guestCount} planned
- Budget: ${currencySymbol}${spentMajor.toLocaleString()} spent of ${currencySymbol}${totalBudgetMajor.toLocaleString()} total (${snapshot.currency})
- Tasks: ${snapshot.pendingTasksCount} pending (${snapshot.overdueTasksCount} overdue)
- Top Open Priorities: ${snapshot.topPriorities.join(', ') || 'None'}

RECENT TASKS IN WORKSPACE:
${sampleTasks || 'No tasks entered yet'}

ACTIVE BUDGET LINE ITEMS:
${sampleBudget || 'No budget items entered yet'}

OPERATIONAL GUIDELINES:
1. Always ground your advice in this specific event, its date, city, and financial budget.
2. If the user asks you to add a task, add a guest, adjust budget, or mark something done, ALWAYS invoke the corresponding tool so the user receives a confirmation card to apply it.
3. Be encouraging, concise, and structured with bold highlights and numbered steps.`;
}

/**
 * Standard non-streaming chat endpoint with tool call detection.
 */
export async function askEventAssistant(params: ChatContextParams): Promise<ChatResponse> {
  if (!ai) {
    return generateFallbackChatResponse(params.message, params.eventSnapshot, 'API_KEY_MISSING');
  }

  const systemInstruction = buildSystemInstruction(params.eventSnapshot);
  const conversationFormatted = params.conversationHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n\n');

  const fullPrompt = `${conversationFormatted ? `Conversation History:\n${conversationFormatted}\n\n` : ''}User Question:
"${params.message}"`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullPrompt,
      config: {
        systemInstruction,
        tools: chatTools,
      },
    });

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall)?.map((p: any) => p.functionCall) || [];

    const actions: ChatActionProposal[] = [];
    for (const fc of functionCalls) {
      if (['add_task', 'add_guest', 'update_budget_item', 'mark_task_done'].includes(fc.name)) {
        actions.push({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          action: fc.name as any,
          label: formatActionLabel(fc.name, fc.args),
          params: fc.args || {},
          confirmed: false,
        });
      }
    }

    const replyText = response.text || (actions.length > 0 ? `I've prepared the following action for your review:` : `Here is my assessment for ${params.eventSnapshot.title}.`);

    return {
      source: 'ai',
      replyText,
      actions,
      suggestedFollowUps: generateSuggestedFollowUps(params.message, params.eventSnapshot),
    };
  } catch (err: any) {
    console.warn('[Chat Assistant] Gemini call failed, returning fallback:', err.message);
    const reason = err instanceof GeminiConfigError
      ? 'API_KEY_MISSING'
      : err.name === 'GeminiTimeoutError'
      ? 'TIMEOUT'
      : 'API_ERROR';
    return generateFallbackChatResponse(params.message, params.eventSnapshot, reason);
  }
}

/**
 * Server-Sent Events (SSE) streaming chat endpoint with function calling.
 */
export async function streamEventAssistant(params: ChatContextParams, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!ai) {
    const fallback = generateFallbackChatResponse(params.message, params.eventSnapshot, 'API_KEY_MISSING');
    res.write(`data: ${JSON.stringify({ type: 'token', text: fallback.replyText, source: 'fallback', fallbackReason: 'API_KEY_MISSING' })}\n\n`);
    if (fallback.actions) {
      for (const action of fallback.actions) {
        res.write(`data: ${JSON.stringify({ type: 'action', action })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ type: 'done', followUps: fallback.suggestedFollowUps })}\n\n`);
    res.end();
    return;
  }

  const systemInstruction = buildSystemInstruction(params.eventSnapshot);
  const conversationFormatted = params.conversationHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n\n');

  const fullPrompt = `${conversationFormatted ? `Conversation History:\n${conversationFormatted}\n\n` : ''}User Question:
"${params.message}"`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: fullPrompt,
      config: {
        systemInstruction,
        tools: chatTools,
      },
    });

    const actions: ChatActionProposal[] = [];

    for await (const chunk of responseStream) {
      // Check for function calls
      const candidate = chunk.candidates?.[0];
      const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall)?.map((p: any) => p.functionCall) || [];

      for (const fc of functionCalls) {
        if (['add_task', 'add_guest', 'update_budget_item', 'mark_task_done'].includes(fc.name)) {
          const actionObj: ChatActionProposal = {
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            action: fc.name as any,
            label: formatActionLabel(fc.name, fc.args),
            params: fc.args || {},
            confirmed: false,
          };
          actions.push(actionObj);
          res.write(`data: ${JSON.stringify({ type: 'action', action: actionObj })}\n\n`);
        }
      }

      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ type: 'token', text: chunk.text, source: 'ai' })}\n\n`);
      }
    }

    const followUps = generateSuggestedFollowUps(params.message, params.eventSnapshot);
    res.write(`data: ${JSON.stringify({ type: 'done', followUps, source: 'ai' })}\n\n`);
    res.end();
  } catch (err: any) {
    console.warn('[Stream Chat Assistant] Error during streaming:', err.message);
    const fallback = generateFallbackChatResponse(params.message, params.eventSnapshot, 'API_ERROR');
    res.write(`data: ${JSON.stringify({ type: 'token', text: `\n\n(Note: Switched to offline backup response due to temporary connection issue)\n\n${fallback.replyText}`, source: 'fallback', fallbackReason: 'API_ERROR' })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', followUps: fallback.suggestedFollowUps })}\n\n`);
    res.end();
  }
}

function formatActionLabel(name: string, args: any): string {
  switch (name) {
    case 'add_task':
      return `Add Task: "${args.title || 'New Task'}" (${args.phase || 'General'})`;
    case 'add_guest':
      return `Add Guest: ${args.name} (${args.group || 'Guest'})`;
    case 'update_budget_item':
      return `Update Budget: ${args.category} - ${args.name}`;
    case 'mark_task_done':
      return `Mark Task Done: ${args.taskTitle || args.taskId}`;
    default:
      return `Apply Event Action: ${name}`;
  }
}

function generateSuggestedFollowUps(message: string, snapshot: ChatContextParams['eventSnapshot']): string[] {
  const lower = message.toLowerCase();
  if (lower.includes('budget') || lower.includes('cost')) {
    return ['How do I negotiate caterer prices?', 'Where can we save 10% on decor?', 'Show category variance'];
  }
  if (lower.includes('guest') || lower.includes('rsvp')) {
    return ['Draft a gentle WhatsApp RSVP reminder', 'Check dietary restrictions breakdown', 'Suggest seating arrangement'];
  }
  return [
    `What should I complete this week for ${snapshot.city}?`,
    'Analyze our current budget health',
    'Review critical day-of contingency checklist',
  ];
}

function generateFallbackChatResponse(
  message: string,
  snapshot: ChatContextParams['eventSnapshot'],
  reason: string
): ChatResponse {
  const lower = message.toLowerCase();

  if (lower.includes('7 days') || lower.includes('finish') || lower.includes('next week') || lower.includes('urgent')) {
    return {
      source: 'fallback',
      fallbackReason: reason,
      replyText: `With **${snapshot.daysRemaining} days** remaining for *${snapshot.title}*, here is your priority checklist for the next 7 days in **${snapshot.city}**:\n\n1. **Reconcile RSVPs**: Follow up with unconfirmed guests to lock catering count.\n2. **Vendor Technical Rehearsal**: Confirm arrival schedules and generator backup.\n3. **Run-of-Show Distribution**: Share the hourly schedule with key coordinators.\n\nYou currently have **${snapshot.overdueTasksCount} overdue tasks** that need immediate review.`,
      suggestedFollowUps: ['How do I handle last-minute dietary changes?', 'What should I pack for event day?'],
      actions: [
        {
          id: `act_${Date.now()}_1`,
          action: 'add_task',
          label: 'Add Task: "Lock Final Catering Headcount Buffer"',
          params: { title: 'Lock Final Catering Headcount Buffer', priority: 'critical', phase: 'Final Confirmations' },
          confirmed: false,
        },
      ],
    };
  }

  if (lower.includes('budget') || lower.includes('save') || lower.includes('reduce')) {
    return {
      source: 'fallback',
      fallbackReason: reason,
      replyText: `To optimize spending without losing quality:\n\n• **Direct Sourcing**: Procure fresh florals directly from city wholesale flower markets in ${snapshot.city}.\n• **Digital Touchpoints**: Transition day-of schedules and table guide maps to digital QR codes.\n• **Consolidated Lighting**: Use warm 2700K tungsten string clusters over high-traffic spots rather than full-tent flood lighting.`,
      suggestedFollowUps: ['Show me category variance', 'How much buffer is recommended?'],
    };
  }

  return {
    source: 'fallback',
    fallbackReason: reason,
    replyText: `For *${snapshot.title}* in **${snapshot.city}**, I recommend focusing on a cohesive guest experience, verified vendor logistics, and a strict timeline.\n\nWhat specific element would you like me to calibrate right now? (e.g. Budget breakdown, vendor questions, seating arrangement, or day-of schedule).`,
    suggestedFollowUps: ['What should I finish in the next 7 days?', 'How can I reduce decor budget?', 'Suggest an eco-friendly idea'],
  };
}
