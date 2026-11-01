import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { apiGenerateIdeas } from '../services/api';
import { getStoredEvents, upsertEvent } from '../lib/storage';
import {
  Sparkles,
  Palette,
  Gift,
  Gamepad2,
  Leaf,
  DollarSign,
  Bookmark,
  RefreshCw,
  Columns2,
  Check,
} from 'lucide-react';

export const IdeasStudioPage: React.FC = () => {
  const { showToast } = useToast();
  const events = getStoredEvents();

  // Filter controls
  const [eventType, setEventType] = useState('wedding');
  const [themeStyle, setThemeStyle] = useState('Royal Heritage');
  const [budgetTier, setBudgetTier] = useState('Balanced Luxury');
  const [targetAudience, setTargetAudience] = useState('Family & Friends of all ages');
  const [season, setSeason] = useState('Winter');

  const [isLoading, setIsLoading] = useState(false);
  const [concepts, setConcepts] = useState<any[]>([
    {
      id: 'c1',
      title: 'Botanical Herb & Living Planter Lounge',
      category: 'decor',
      summary: 'Living potted rosemary, lavender, and dwarf palms in warm terracotta planters instead of cut flowers.',
      details: 'Guests take home the potted herbs at the conclusion of the event as sustainable living favors.',
      colorPalette: [
        { name: 'Sage Green', hex: '#8A9A86' },
        { name: 'Terracotta Rust', hex: '#C86D51' },
        { name: 'Warm Sand', hex: '#EAE3D2' },
        { name: 'Deep Olive', hex: '#4B5320' },
      ],
      costImpact: 'budget_saver',
      estimatedSavingOrCost: 'Saves ~20% vs ephemeral cut flowers',
    },
    {
      id: 'c2',
      title: 'Interactive Vintage Audio Guestbook',
      category: 'games_activities',
      summary: 'A vintage rotary telephone booth where guests pick up the receiver to record voice messages and blessings.',
      details: 'Recordings are curated into a master vinyl audio podcast delivered to the hosts post-event.',
      costImpact: 'medium',
      estimatedSavingOrCost: 'Rental approx. ₹8,000 - ₹12,000',
    },
    {
      id: 'c3',
      title: 'Zero-Waste Banana Leaf Dining Architecture',
      category: 'eco_friendly',
      summary: '100% compostable meal service diverting banquet waste directly to local community farms.',
      details: 'Replaces plastic tableware and disposable bottles with copper vessels and organic fresh leaves.',
      costImpact: 'budget_saver',
      estimatedSavingOrCost: 'Reduces cleanup and waste disposal fees by 35%',
    },
    {
      id: 'c4',
      title: 'Artisanal Single-Origin Coffee & Spice Bar',
      category: 'return_gifts',
      summary: 'Live custom blending station where guests curate personalized filter coffee beans or chai spices.',
      details: 'Packaged in reusable unbleached linen pouches with custom stamped calligraphed nametags.',
      costImpact: 'medium',
      estimatedSavingOrCost: 'Approx. ₹180 - ₹250 per guest',
    },
  ]);

  // Save to Event Modal
  const [selectedConceptToSave, setSelectedConceptToSave] = useState<any | null>(null);
  const [targetEventId, setTargetEventId] = useState<string>(events[0]?.details.id || '');

  // Compare mode
  const [compareList, setCompareList] = useState<any[]>([]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await apiGenerateIdeas({
        eventType,
        themeStyle,
        budgetTier,
        targetAudience,
        season,
      });
      setConcepts(data.concepts || []);
      showToast({ type: 'success', title: 'Ideas Generated', description: 'Curated 4 fresh creative concepts.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Generation Failed', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToEvent = () => {
    if (!selectedConceptToSave || !targetEventId) return;
    const targetEvent = events.find((e) => e.details.id === targetEventId);
    if (!targetEvent) return;

    // Add as a task or note
    const updated = {
      ...targetEvent,
      details: {
        ...targetEvent.details,
        specialRequests: (targetEvent.details.specialRequests || '') + `\n• Idea: ${selectedConceptToSave.title}`,
      },
    };
    upsertEvent(updated);
    setSelectedConceptToSave(null);
    showToast({
      type: 'success',
      title: 'Idea Saved to Event',
      description: `Appended to "${targetEvent.details.title}".`,
    });
  };

  const handleToggleCompare = (concept: any) => {
    if (compareList.some((c) => c.id === concept.id)) {
      setCompareList(compareList.filter((c) => c.id !== concept.id));
    } else {
      if (compareList.length >= 2) {
        setCompareList([compareList[1], concept]);
      } else {
        setCompareList([...compareList, concept]);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEF8] text-[#4B2A7B] text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A6B]" />
            <span>Creative Ideation Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1E1B24]">AI Ideas Studio</h1>
          <p className="text-xs sm:text-sm text-[#5C5765]">
            Brainstorm themes, decor palettes, guest entertainment, return gifts, and eco-friendly alternatives.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          isLoading={isLoading}
          leftIcon={<Sparkles className="w-4 h-4 text-[#FF7A6B]" />}
        >
          Generate Fresh Concepts
        </Button>
      </div>

      {/* Control Studio Parameters Strip */}
      <Card variant="default" padding="md" className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#5C5765] uppercase mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full text-xs p-2 rounded-xl bg-[#F3EEF8]/60 border border-[#4B2A7B]/15"
            >
              <option value="wedding">Wedding</option>
              <option value="college_fest">College Fest</option>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C5765] uppercase mb-1">Aesthetic Style</label>
            <select
              value={themeStyle}
              onChange={(e) => setThemeStyle(e.target.value)}
              className="w-full text-xs p-2 rounded-xl bg-[#F3EEF8]/60 border border-[#4B2A7B]/15"
            >
              <option value="Royal Heritage">Royal Heritage</option>
              <option value="Traditional Temple">Traditional Temple</option>
              <option value="Minimalist Botanical">Minimalist Botanical</option>
              <option value="Cyberpunk Neon">Cyberpunk Neon</option>
              <option value="Rustic Terracotta">Rustic Terracotta</option>
              <option value="Boho Chic">Boho Chic</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C5765] uppercase mb-1">Budget Tier</label>
            <select
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="w-full text-xs p-2 rounded-xl bg-[#F3EEF8]/60 border border-[#4B2A7B]/15"
            >
              <option value="Budget Saver">Budget Saver (DIY & Local)</option>
              <option value="Balanced Luxury">Balanced Luxury</option>
              <option value="High-End Bespoke">High-End Bespoke</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C5765] uppercase mb-1">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full text-xs p-2 rounded-xl bg-[#F3EEF8]/60 border border-[#4B2A7B]/15"
            >
              <option value="Family & Elders">Family & Elders</option>
              <option value="College Students">College Students</option>
              <option value="Toddlers & Parents">Toddlers & Parents</option>
              <option value="Corporate Executives">Corporate Executives</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C5765] uppercase mb-1">Season</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full text-xs p-2 rounded-xl bg-[#F3EEF8]/60 border border-[#4B2A7B]/15"
            >
              <option value="Winter">Winter (Nov - Feb)</option>
              <option value="Spring / Summer">Spring / Summer</option>
              <option value="Monsoon">Monsoon (Rain Contingency)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Side-by-Side Comparison Drawer if 2 items selected */}
      {compareList.length === 2 && (
        <Card variant="highlight" padding="lg" className="border-[#4B2A7B]/30 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#4B2A7B]/15 mb-4">
            <div className="flex items-center gap-2">
              <Columns2 className="w-5 h-5 text-[#4B2A7B]" />
              <h3 className="text-base font-bold font-serif text-[#1E1B24]">Side-by-Side Comparison</h3>
            </div>
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-[#5C5765] hover:underline cursor-pointer"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#4B2A7B]/10">
            {compareList.map((comp) => (
              <div key={comp.id} className="space-y-3 pt-4 md:pt-0 md:px-4">
                <Badge variant="purple" size="sm">
                  {comp.category}
                </Badge>
                <h4 className="text-base font-bold font-serif text-[#1E1B24]">{comp.title}</h4>
                <p className="text-xs text-[#5C5765] leading-relaxed">{comp.details}</p>
                <div className="p-2.5 rounded-xl bg-white border border-[#4B2A7B]/10 text-xs">
                  <span className="font-semibold text-[#4B2A7B] block">Financial / Operational Impact:</span>
                  <span className="text-[#5C5765]">{comp.estimatedSavingOrCost}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Generated Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {concepts.map((concept) => {
          const isComparing = compareList.some((c) => c.id === concept.id);

          return (
            <Card
              key={concept.id}
              variant="default"
              padding="lg"
              className="flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#4B2A7B]/10 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A6B]">
                      {concept.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold font-serif text-[#1E1B24]">{concept.title}</h3>
                  </div>

                  <Badge
                    variant={concept.costImpact === 'budget_saver' ? 'success' : 'purple'}
                    size="sm"
                  >
                    {concept.costImpact.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-[#1E1B24] leading-relaxed">{concept.summary}</p>
                <p className="text-xs text-[#5C5765] leading-relaxed">{concept.details}</p>

                {/* Color Palette if present */}
                {concept.colorPalette && (
                  <div className="flex items-center gap-2 pt-1">
                    {concept.colorPalette.map((col: any, idx: number) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                        style={{ backgroundColor: col.hex }}
                        title={`${col.name} (${col.hex})`}
                      />
                    ))}
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-[#F3EEF8]/40 border border-[#4B2A7B]/10 text-xs text-[#5C5765]">
                  <span className="font-semibold text-[#4B2A7B]">Impact: </span>
                  {concept.estimatedSavingOrCost}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#4B2A7B]/10 flex items-center justify-between">
                <button
                  onClick={() => handleToggleCompare(concept)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    isComparing
                      ? 'bg-[#4B2A7B] text-white border-[#4B2A7B]'
                      : 'text-[#5C5765] border-[#4B2A7B]/20 hover:bg-[#F3EEF8]'
                  }`}
                >
                  {isComparing ? 'Comparing' : 'Compare'}
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedConceptToSave(concept)}
                  leftIcon={<Bookmark className="w-3.5 h-3.5" />}
                >
                  Save to Event
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Save Concept to Event Modal */}
      <Modal
        isOpen={!!selectedConceptToSave}
        onClose={() => setSelectedConceptToSave(null)}
        title="Save Concept to Event"
        description={`Save "${selectedConceptToSave?.title}" into one of your active event plans.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Select Target Event</label>
            <select
              value={targetEventId}
              onChange={(e) => setTargetEventId(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            >
              {events.map((ev) => (
                <option key={ev.details.id} value={ev.details.id}>
                  {ev.details.title} ({ev.details.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedConceptToSave(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveToEvent}>
              Confirm & Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
