import React, { useState } from 'react';
import { EventFull, PlanSection, PlanVersion } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { AiStatusBanner } from '../../components/ui/AiStatusBanner';
import { apiRegenerateSection } from '../../services/api';
import { upsertEvent } from '../../lib/storage';
import { useToast } from '../../components/ui/Toast';
import {
  Sparkles,
  Edit3,
  History,
  Check,
  RotateCcw,
  RefreshCw,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatDateDisplay } from '../../lib/formatters';

export const AIPlanTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  // Regenerate modal state
  const [regenerateTarget, setRegenerateTarget] = useState<PlanSection | null>(null);
  const [instruction, setInstruction] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Version history modal state
  const [historyTarget, setHistoryTarget] = useState<PlanSection | null>(null);

  const handleStartEdit = (section: PlanSection) => {
    setEditingSectionId(section.id);
    setEditedText(section.content);
  };

  const handleSaveEdit = (section: PlanSection) => {
    // Save previous version to history
    const newVersion: PlanVersion = {
      version: (section.versions?.length || 0) + 1,
      timestamp: new Date().toISOString(),
      content: section.content,
      summary: 'Manual user edit',
    };

    const updatedSections = event.planSections.map((sec) => {
      if (sec.id === section.id) {
        return {
          ...sec,
          content: editedText,
          lastUpdated: new Date().toISOString(),
          versions: [newVersion, ...(sec.versions || [])].slice(0, 5), // last 5 versions
        };
      }
      return sec;
    });

    upsertEvent({ ...event, planSections: updatedSections });
    setEditingSectionId(null);
    showToast({ type: 'success', title: 'Section Saved', description: `Updated "${section.title}".` });
  };

  const handleRegenerate = async () => {
    if (!regenerateTarget) return;
    setIsRegenerating(true);

    try {
      const result = await apiRegenerateSection({
        sectionKey: regenerateTarget.sectionKey,
        sectionTitle: regenerateTarget.title,
        currentContent: regenerateTarget.content,
        instruction,
        eventContext: {
          title: event.details.title,
          type: event.details.type,
          city: event.details.city,
          guestCount: event.details.estimatedGuestCount,
          themePreference: event.details.themePreference,
        },
      });

      const newVersion: PlanVersion = {
        version: (regenerateTarget.versions?.length || 0) + 1,
        timestamp: new Date().toISOString(),
        content: regenerateTarget.content,
        summary: result.changeSummary || `AI Revision: ${instruction || 'Refined'}`,
      };

      const updatedSections = event.planSections.map((sec) => {
        if (sec.id === regenerateTarget.id) {
          return {
            ...sec,
            content: result.updatedContent,
            lastUpdated: new Date().toISOString(),
            versions: [newVersion, ...(sec.versions || [])].slice(0, 5),
          };
        }
        return sec;
      });

      upsertEvent({ ...event, planSections: updatedSections });
      setRegenerateTarget(null);
      setInstruction('');
      showToast({
        type: 'success',
        title: 'Section Revised by AI',
        description: result.changeSummary || 'Applied new creative detailing.',
      });
    } catch (err: any) {
      console.error('Section regeneration failed:', err);
      showToast({ type: 'error', title: 'Revision Failed', description: err.message });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRestoreVersion = (section: PlanSection, versionToRestore: PlanVersion) => {
    // Current becomes a version, restored becomes content
    const archivedVersion: PlanVersion = {
      version: (section.versions?.length || 0) + 1,
      timestamp: new Date().toISOString(),
      content: section.content,
      summary: 'Before restoring prior version',
    };

    const updatedSections = event.planSections.map((sec) => {
      if (sec.id === section.id) {
        return {
          ...sec,
          content: versionToRestore.content,
          lastUpdated: new Date().toISOString(),
          versions: [archivedVersion, ...(sec.versions || [])].slice(0, 5),
        };
      }
      return sec;
    });

    upsertEvent({ ...event, planSections: updatedSections });
    setHistoryTarget(null);
    showToast({
      type: 'success',
      title: 'Version Restored',
      description: `Restored version from ${formatDateDisplay(versionToRestore.timestamp)}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
            AI Event Plan & Specifications
          </h2>
          <p className="text-xs text-[#5C5765]">
            9-pillar structured event architecture. Edit any section or prompt the AI to calibrate tone and details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md" icon={<Sparkles className="w-3.5 h-3.5 text-[#FF7A6B]" />}>
            Verified Structured Output
          </Badge>
        </div>
      </div>

      {/* AI Synthesis Status */}
      <AiStatusBanner
        source={event.planSections.some((s: any) => s.isFallback || s.source === 'fallback') ? 'fallback' : 'ai'}
        fallbackReason={event.planSections.some((s: any) => s.isFallback) ? 'API_KEY_MISSING' : undefined}
        onRetry={() => {
          if (event.planSections.length > 0) {
            setRegenerateTarget(event.planSections[0]);
            setInstruction('Recalibrate and expand with hyper-specific local detailing and named vendor elements.');
          }
        }}
      />

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {event.planSections.map((sec) => {
          const isEditing = editingSectionId === sec.id;
          const versionCount = sec.versions?.length || 0;

          return (
            <Card key={sec.id} variant="default" padding="lg" className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#4B2A7B]/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold font-serif text-[#1E1B24]">{sec.title}</h3>
                    <span className="text-[10px] text-[#5C5765]">
                      Updated {formatDateDisplay(sec.lastUpdated)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {versionCount > 0 && (
                      <button
                        onClick={() => setHistoryTarget(sec)}
                        className="p-1.5 rounded-lg text-[#5C5765] hover:text-[#4B2A7B] hover:bg-[#F3EEF8] transition-colors cursor-pointer"
                        title={`View version history (${versionCount} saved)`}
                      >
                        <History className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setRegenerateTarget(sec);
                        setInstruction('');
                      }}
                      className="p-1.5 rounded-lg text-[#5C5765] hover:text-[#4B2A7B] hover:bg-[#F3EEF8] transition-colors cursor-pointer"
                      title="Regenerate with AI instructions"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(sec)}
                        className="p-1.5 rounded-lg text-[#5C5765] hover:text-[#1E1B24] hover:bg-[#F3EEF8] transition-colors cursor-pointer"
                        title="Edit manually"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      rows={6}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full p-3 text-xs sm:text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/20 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingSectionId(null)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleSaveEdit(sec)}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-[#1E1B24] whitespace-pre-line leading-relaxed">
                    {sec.content}
                  </p>
                )}
              </div>

              {!isEditing && (
                <div className="pt-2 flex items-center justify-between text-[11px] text-[#5C5765]">
                  <span>{versionCount > 0 ? `${versionCount} revisions in history` : 'Original generation'}</span>
                  <button
                    onClick={() => {
                      setRegenerateTarget(sec);
                      setInstruction('');
                    }}
                    className="text-[#4B2A7B] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#FF7A6B]" /> Revise with AI
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* AI Section Regeneration Modal */}
      <Modal
        isOpen={!!regenerateTarget}
        onClose={() => setRegenerateTarget(null)}
        title={`Revise "${regenerateTarget?.title}" with AI`}
        description="Provide optional guidance like 'make it more traditional', 'emphasize eco-friendly decor', or 'add outdoor contingency'."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
              Specific Instruction (Optional)
            </label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Make it more intimate and focused on heirloom brass lamps..."
              className="w-full px-4 py-2.5 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
            />
          </div>

          <div className="p-3 bg-[#F3EEF8]/60 rounded-xl text-xs text-[#5C5765]">
            <p className="font-semibold text-[#1E1B24] mb-1">Current Section Content Preview:</p>
            <p className="line-clamp-3 italic">"{regenerateTarget?.content}"</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRegenerateTarget(null)} disabled={isRegenerating}>
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleRegenerate}
              isLoading={isRegenerating}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Regenerate Section
            </Button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        title={`Version History — ${historyTarget?.title}`}
        description="Review and restore up to the last 5 saved iterations of this section."
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {historyTarget?.versions && historyTarget.versions.length > 0 ? (
            historyTarget.versions.map((ver, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#4B2A7B]/15 bg-white space-y-2 hover:border-[#4B2A7B]/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      v{ver.version}
                    </Badge>
                    <span className="text-xs text-[#5C5765]">{formatDateDisplay(ver.timestamp)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreVersion(historyTarget, ver)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#4B2A7B]" />}
                  >
                    Restore
                  </Button>
                </div>

                {ver.summary && (
                  <p className="text-xs font-semibold text-[#4B2A7B]">{ver.summary}</p>
                )}

                <p className="text-xs text-[#1E1B24] bg-[#F3EEF8]/40 p-2.5 rounded-lg whitespace-pre-line">
                  {ver.content}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#5C5765] text-center py-6">No previous versions saved yet.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};
