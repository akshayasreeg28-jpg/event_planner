import React, { useState } from 'react';
import { EventFull, ThemeIdea } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { upsertEvent } from '../../lib/storage';
import { formatMinorToCurrency } from '../../lib/formatters';
import { HERO_IMAGES } from '../../lib/constants';
import {
  Palette,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Bookmark,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const ThemesTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [selectedStyle, setSelectedStyle] = useState<ThemeIdea['style']>('royal');
  const [isRegeneratingTheme, setIsRegeneratingTheme] = useState(false);

  // Active theme idea
  const currentTheme: ThemeIdea = event.themes[0] || {
    id: 'thm_default',
    name: event.details.themePreference || 'Royal Dravidian Heritage',
    description: 'Intricate temple brass, royal purple silk, fresh Madurai malli jasmine, and warm candlelight.',
    style: 'royal',
    colorPalette: [
      { name: 'Royal Velvet Purple', hex: '#4B2A7B' },
      { name: 'Temple Gold', hex: '#D4AF37' },
      { name: 'Warm Ivory', hex: '#FBF7F0' },
      { name: 'Koyambedu Marigold', hex: '#FF9900' },
      { name: 'Lotus Coral', hex: '#FF7A6B' },
    ],
    decorZones: [
      { zone: 'entrance', concept: '10ft brass Urlis with lotus floats & bell torans', materials: 'Antique brass, tuberoses, terracotta' },
      { zone: 'stage', concept: 'Hand-carved wooden pillar Mandap draped in ivory silk', materials: 'Kanchipuram raw silk, jasmine strings' },
      { zone: 'tables', concept: 'Brass candle lanterns with banana leaf runner accents', materials: 'Brass, linen, fresh marigolds' },
      { zone: 'photobooth', concept: 'Chettinad vintage wood carved swing with floral mesh', materials: 'Teakwood, marigolds, fairy lights' },
      { zone: 'lighting', concept: 'Warm 2700K tungsten fairy canopies & diya clusters', materials: 'Edison filament, brass diyas' },
    ],
    flowersAndProps: ['Madurai Malli (Jasmine)', 'Orange & Yellow Marigolds', 'Pink Lotus Buds', 'Brass Urlis', 'Temple Bells'],
    costTiers: [
      { tier: 'DIY', estimatedCostMinor: 4500000, description: 'Direct wholesale procurement from flower market; simple brass lanterns' },
      { tier: 'Rent', estimatedCostMinor: 8500000, description: 'Full turnkey rental of carved pillars, brass urlis, and ambient lighting' },
      { tier: 'Buy / Custom', estimatedCostMinor: 14000000, description: 'Bespoke custom backdrops and hand-woven floral chandeliers' },
    ],
    pinnedImage: HERO_IMAGES.moodboard,
  };

  const handleRegenerateByStyle = (style: ThemeIdea['style']) => {
    setIsRegeneratingTheme(true);
    setSelectedStyle(style);

    setTimeout(() => {
      let updatedPalette = currentTheme.colorPalette;
      let newName = `${style.toUpperCase()} Aesthetic`;

      if (style === 'minimalist') {
        updatedPalette = [
          { name: 'Crisp White', hex: '#FFFFFF' },
          { name: 'Eucalyptus Sage', hex: '#8A9A86' },
          { name: 'Brushed Brass', hex: '#C59B27' },
          { name: 'Warm Sand', hex: '#EAE3D2' },
        ];
        newName = 'Minimalist Botanical Serenity';
      } else if (style === 'rustic') {
        updatedPalette = [
          { name: 'Terracotta Rust', hex: '#C86D51' },
          { name: 'Warm Walnut', hex: '#5D4037' },
          { name: 'Cream Linen', hex: '#FDFBF7' },
          { name: 'Olive Green', hex: '#556B2F' },
        ];
        newName = 'Earthy Rustic Heritage';
      } else if (style === 'modern') {
        updatedPalette = [
          { name: 'Midnight Navy', hex: '#0F1E36' },
          { name: 'Electric Violet', hex: '#673E9F' },
          { name: 'Champagne Gold', hex: '#F7E7CE' },
          { name: 'Soft Coral', hex: '#FF7A6B' },
        ];
        newName = 'Contemporary Cosmopolitan';
      }

      const revised: ThemeIdea = {
        ...currentTheme,
        name: newName,
        style,
        colorPalette: updatedPalette,
      };

      upsertEvent({ ...event, themes: [revised] });
      setIsRegeneratingTheme(false);
      showToast({ type: 'success', title: 'Theme Style Updated', description: `Applied ${newName}.` });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
            Theme, Palette & Decor Architecture
          </h2>
          <p className="text-xs text-[#5C5765]">
            Hex color palettes, zone-by-zone concept styling, and DIY vs. Rent vs. Buy cost tiers.
          </p>
        </div>

        {/* Style switcher buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F3EEF8]/80 rounded-xl overflow-x-auto no-scrollbar">
          {(['royal', 'traditional', 'minimalist', 'rustic', 'modern', 'boho'] as const).map((st) => (
            <button
              key={st}
              onClick={() => handleRegenerateByStyle(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedStyle === st ? 'bg-white text-[#4B2A7B] shadow-xs' : 'text-[#5C5765] hover:text-[#1E1B24]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Theme Spotlight & Moodboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card variant="highlight" padding="lg" className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="purple" size="sm">
                Active Theme Concept
              </Badge>
              <span className="text-xs font-semibold uppercase text-[#FF7A6B]">
                {currentTheme.style} Style
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-serif text-[#1E1B24]">{currentTheme.name}</h3>
              <p className="text-xs sm:text-sm text-[#5C5765] mt-1 leading-relaxed">
                {currentTheme.description}
              </p>
            </div>

            {/* Hex Color Swatches Bar */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-[#1E1B24] block">Curated Color Palette Swatches</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {currentTheme.colorPalette.map((col, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-black/5 bg-white shadow-xs space-y-1.5"
                  >
                    <div
                      className="h-10 w-full rounded-lg shadow-inner"
                      style={{ backgroundColor: col.hex }}
                    />
                    <div className="text-[11px] leading-tight truncate">
                      <span className="font-semibold text-[#1E1B24] block truncate">{col.name}</span>
                      <span className="text-[#5C5765] font-mono text-[10px]">{col.hex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flowers & Props */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-[#1E1B24] block">Recommended Flowers & Props</span>
              <div className="flex flex-wrap gap-2">
                {currentTheme.flowersAndProps.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-lg bg-white border border-[#4B2A7B]/15 text-[#1E1B24] font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Moodboard Flat-Lay Visual Asset */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-md min-h-[300px]">
          <img
            src={currentTheme.pinnedImage || HERO_IMAGES.moodboard}
            alt="Event Styling Moodboard"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-5">
            <div className="text-white text-xs space-y-1">
              <span className="font-bold text-sm block">Artisanal Moodboard Reference</span>
              <p className="text-white/80 text-[11px]">
                Silk fabric swatches, Pantone color tiles & pressed floral botanicals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decor Concepts Per Zone */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold font-serif text-[#1E1B24]">Zone-by-Zone Decor Concepts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentTheme.decorZones.map((zone, idx) => (
            <Card key={idx} variant="default" padding="sm" className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A6B] block">
                {zone.zone}
              </span>
              <p className="text-xs font-semibold text-[#1E1B24]">{zone.concept}</p>
              <p className="text-[11px] text-[#5C5765] border-t border-[#4B2A7B]/10 pt-1.5">
                <strong>Materials:</strong> {zone.materials}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* DIY vs Rent vs Buy Cost Tiers */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold font-serif text-[#1E1B24]">Implementation Cost Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentTheme.costTiers.map((tier, idx) => (
            <Card key={idx} variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={tier.tier === 'DIY' ? 'success' : 'purple'} size="sm">
                    {tier.tier}
                  </Badge>
                  <span className="text-base font-bold font-mono text-[#4B2A7B]">
                    {formatMinorToCurrency(tier.estimatedCostMinor, event.details.currency)}
                  </span>
                </div>
                <p className="text-xs text-[#5C5765] mt-2 leading-relaxed">{tier.description}</p>
              </div>

              <div className="pt-2 border-t border-[#4B2A7B]/10">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() =>
                    showToast({
                      type: 'info',
                      title: `Tier Selected: ${tier.tier}`,
                      description: `Budget benchmark aligned with ${tier.tier} approach.`,
                    })
                  }
                >
                  Adopt {tier.tier} Tier
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
