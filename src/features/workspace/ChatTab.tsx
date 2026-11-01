import React, { useState, useRef, useEffect } from 'react';
import { EventFull, ChatMessage, TimelineTask, Guest, BudgetItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { apiStreamChatMessage } from '../../services/api';
import { upsertEvent } from '../../lib/storage';
import { updateTaskInFirestore, saveEventToFirestore } from '../../services/firestoreService';
import { getDaysRemaining } from '../../lib/formatters';
import { ChatActionProposal } from '../../../server/ai/chatAssistant';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  TrendingDown,
  CheckCircle2,
  HelpCircle,
  Flame,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';

const SUGGESTED_CHIPS = [
  'What should I finish in the next 7 days?',
  'Add a task to confirm catering headcount',
  'How can I save ₹20,000 on decor?',
  'Suggest a rain contingency plan for the lawn',
];

export const ChatTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(event.chatHistory || []);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingActions, setStreamingActions] = useState<ChatActionProposal[]>([]);
  const [activeSource, setActiveSource] = useState<'ai' | 'fallback'>('ai');
  const [activeReason, setActiveReason] = useState<string | undefined>();
  const [followUps, setFollowUps] = useState<string[]>(SUGGESTED_CHIPS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Action confirmation card state
  const [actionConfirmTarget, setActionConfirmTarget] = useState<ChatActionProposal | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isStreaming]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');
    setStreamingActions([]);

    // Context snapshot
    const remaining = getDaysRemaining(event.details.date);
    const totalSpentMinor = event.budgetItems.reduce((acc, i) => acc + i.actualAmountMinor, 0);
    const confirmedGuests = event.guests.filter((g) => g.rsvpStatus === 'confirmed').length;
    const pendingTasks = event.tasks.filter((t) => t.status !== 'completed');
    const overdueTasks = pendingTasks.filter(
      (t) => t.deadline < new Date().toISOString().split('T')[0]
    );

    const snapshot = {
      title: event.details.title,
      type: event.details.type,
      date: event.details.date,
      daysRemaining: remaining.days,
      city: event.details.city,
      guestCount: event.details.estimatedGuestCount,
      confirmedGuests,
      totalBudgetMinor: event.details.totalBudgetMinor,
      actualSpentMinor: totalSpentMinor,
      currency: event.details.currency,
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      topPriorities: pendingTasks.slice(0, 3).map((t) => t.title),
      tasks: event.tasks.slice(0, 8),
      budgetItems: event.budgetItems.slice(0, 8),
      guests: event.guests.slice(0, 8),
    };

    let accumulatedText = '';
    const accumulatedActions: ChatActionProposal[] = [];

    await apiStreamChatMessage(
      {
        message: text,
        conversationHistory: updatedHistory.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          text: m.text,
        })),
        eventSnapshot: snapshot,
      },
      {
        onToken: (chunk, source, reason) => {
          accumulatedText += chunk;
          setStreamingText(accumulatedText);
          if (source) setActiveSource(source);
          if (reason) setActiveReason(reason);
        },
        onAction: (action) => {
          accumulatedActions.push(action);
          setStreamingActions([...accumulatedActions]);
        },
        onDone: (newFollowUps, source) => {
          if (source) setActiveSource(source);
          const assistantMsg: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            text: accumulatedText || 'I have analyzed your request.',
            actions: accumulatedActions as any,
          };

          const finalMessages = [...updatedHistory, assistantMsg];
          setMessages(finalMessages);
          upsertEvent({ ...event, chatHistory: finalMessages });
          if (newFollowUps && newFollowUps.length > 0) {
            setFollowUps(newFollowUps);
          }
          setIsStreaming(false);
          setStreamingText('');
          setStreamingActions([]);
        },
        onError: (err) => {
          console.warn('[Chat Error]:', err);
          setIsStreaming(false);
          showToast({ type: 'error', title: 'Connection Interrupted', description: err.message });
        },
      }
    );
  };

  const handleApplyActionConfirmed = async () => {
    if (!actionConfirmTarget) return;
    const action = actionConfirmTarget;
    setActionConfirmTarget(null);

    try {
      if (action.action === 'add_task') {
        const newTask: TimelineTask = {
          id: `tsk_chat_${Date.now()}`,
          title: action.params.title || 'New Task',
          phase: action.params.phase || 'Booking & Vendors',
          priority: action.params.priority || 'high',
          status: 'not_started',
          deadline: action.params.deadline || event.details.date,
          dependencies: [],
          assignee: 'Event Lead',
        };

        const updated = { ...event, tasks: [...event.tasks, newTask] };
        upsertEvent(updated);
        await saveEventToFirestore(updated).catch(() => {});
        showToast({
          type: 'success',
          title: 'Task Created',
          description: `Added "${newTask.title}" to Timeline.`,
        });
      } else if (action.action === 'add_guest') {
        const newGuest: Guest = {
          id: `gst_chat_${Date.now()}`,
          name: action.params.name,
          groupSide: 'general',
          rsvpStatus: 'pending',
          dietaryNeeds: (action.params.dietaryNeeds as any) || 'standard',
          plusOnes: action.params.plusOnes || 0,
          invitationStatus: 'unsent',
          rsvpToken: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        };

        const updated = { ...event, guests: [...event.guests, newGuest] };
        upsertEvent(updated);
        await saveEventToFirestore(updated).catch(() => {});
        showToast({
          type: 'success',
          title: 'Guest Added',
          description: `Added ${newGuest.name} to Guest Manager.`,
        });
      } else if (action.action === 'update_budget_item') {
        const newItem: BudgetItem = {
          id: `bgt_chat_${Date.now()}`,
          category: action.params.category || 'General',
          name: action.params.name || 'Expense Line',
          estimatedAmountMinor: action.params.estimatedCostMinor || 500000,
          actualAmountMinor: action.params.actualCostMinor || 0,
          paidAmountMinor: 0,
          status: 'pending',
          receiptNote: 'Added via AI assistant recommendation',
        };

        const updated = { ...event, budgetItems: [...event.budgetItems, newItem] };
        upsertEvent(updated);
        await saveEventToFirestore(updated).catch(() => {});
        showToast({
          type: 'success',
          title: 'Budget Line Created',
          description: `Added "${newItem.name}" to budget category ${newItem.category}.`,
        });
      } else if (action.action === 'mark_task_done') {
        const targetId = action.params.taskId;
        const updatedTasks = event.tasks.map((t) =>
          t.id === targetId || t.title.toLowerCase().includes(targetId.toLowerCase())
            ? { ...t, status: 'completed' as const }
            : t
        );
        const updated = { ...event, tasks: updatedTasks };
        upsertEvent(updated);
        await saveEventToFirestore(updated).catch(() => {});
        showToast({
          type: 'success',
          title: 'Task Completed',
          description: 'Marked task as done in workspace.',
        });
      }
    } catch {
      showToast({ type: 'error', title: 'Action Failed' });
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-h-[750px]">
      {/* Header bar */}
      <div className="p-4 bg-white border border-[#4B2A7B]/10 rounded-t-2xl flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4B2A7B] to-[#371C5D] text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5 text-[#FF7A6B]" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif text-[#1E1B24]">Event AI Concierge</h3>
            <span className="text-[10px] text-[#5C5765]">
              Real-time snapshot loaded for "{event.details.title}"
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSource === 'ai' ? (
            <Badge variant="purple" size="sm" icon={<Sparkles className="w-3 h-3 text-[#FF7A6B]" />}>
              Live AI
            </Badge>
          ) : (
            <Badge variant="coral" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
              Offline Fallback
            </Badge>
          )}
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FFFDF9]/60 border-x border-[#4B2A7B]/10 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EEF8] text-[#4B2A7B] flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6 text-[#FF7A6B]" />
            </div>
            <h4 className="text-base font-bold font-serif text-[#1E1B24]">
              How can I assist your planning today?
            </h4>
            <p className="text-xs text-[#5C5765] max-w-md mx-auto">
              I have full real-time access to your budget items, guest RSVP states, confirmed vendors, and timeline tasks.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user' ? 'bg-[#FF7A6B] text-white' : 'bg-[#4B2A7B] text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#FF7A6B]" />}
            </div>

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2.5`}>
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#4B2A7B] text-white rounded-tr-none'
                    : 'bg-white border border-[#4B2A7B]/10 text-[#1E1B24] rounded-tl-none shadow-xs whitespace-pre-wrap'
                }`}
              >
                {msg.text}
              </div>

              {/* Action proposals cards */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="space-y-2 pt-1">
                  {msg.actions.map((act: any, idx: number) => (
                    <Card
                      key={act.id || idx}
                      variant="default"
                      padding="sm"
                      className="bg-[#FFFDF9] border border-[#FF7A6B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#FF7A6B]/10 text-[#FF7A6B] shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1E1B24]">{act.label}</p>
                          <span className="text-[10px] text-[#5C5765]">
                            Action will update workspace and sync live
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setActionConfirmTarget(act)}
                        className="bg-[#FF7A6B] hover:bg-[#E56A5B] text-white shrink-0 self-end sm:self-auto"
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Apply Change
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Streaming Message Bubble */}
        {isStreaming && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#4B2A7B] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#FF7A6B] animate-pulse" />
            </div>
            <div className="max-w-[85%] sm:max-w-[75%] space-y-2.5">
              <div className="p-4 rounded-2xl text-xs sm:text-sm bg-white border border-[#4B2A7B]/15 text-[#1E1B24] rounded-tl-none shadow-xs whitespace-pre-wrap">
                {streamingText || (
                  <span className="flex items-center gap-2 text-[#5C5765] italic">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing event constraints...
                  </span>
                )}
              </div>

              {streamingActions.map((act, idx) => (
                <Card
                  key={idx}
                  variant="default"
                  padding="sm"
                  className="bg-[#FFFDF9] border border-[#FF7A6B]/30 flex items-center justify-between gap-3 animate-in fade-in"
                >
                  <p className="text-xs font-semibold text-[#1E1B24]">{act.label}</p>
                  <Button size="sm" variant="outline" disabled>
                    Proposed
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-ups bar */}
      <div className="p-2.5 bg-white border-x border-t border-[#4B2A7B]/10 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[10px] font-semibold text-[#5C5765] uppercase tracking-wider shrink-0 pl-1">
          Suggestions:
        </span>
        {followUps.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isStreaming}
            onClick={() => handleSendMessage(chip)}
            className="px-2.5 py-1 rounded-lg bg-[#F3EEF8]/80 hover:bg-[#4B2A7B]/10 text-[#4B2A7B] text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="p-3 bg-white border border-[#4B2A7B]/10 rounded-b-2xl shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about budget, tasks, menu, or schedule..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#FFFDF9] border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B] disabled:opacity-60"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!input.trim() || isStreaming}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </div>

      {/* Action Proposal Confirmation Dialog */}
      {actionConfirmTarget && (
        <ConfirmDialog
          isOpen={!!actionConfirmTarget}
          onClose={() => setActionConfirmTarget(null)}
          onConfirm={handleApplyActionConfirmed}
          title="Apply Event Modification?"
          message={`Confirm applying this action to your workspace: "${actionConfirmTarget.label}". Your event timeline, budget, or guest list will be immediately updated.`}
          confirmLabel="Confirm & Apply"
          variant="primary"
        />
      )}
    </div>
  );
};
