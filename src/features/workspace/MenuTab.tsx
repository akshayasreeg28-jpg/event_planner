import React, { useState } from 'react';
import { EventFull, MenuItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { upsertEvent } from '../../lib/storage';
import { formatMinorToCurrency } from '../../lib/formatters';
import { apiGenerateMenu } from '../../services/api';
import {
  Utensils,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  PieChart,
  RefreshCw,
} from 'lucide-react';

const COURSES = [
  { key: 'welcome_drinks', label: 'Welcome Drinks' },
  { key: 'starters', label: 'Starters & Finger Food' },
  { key: 'mains', label: 'Main Courses & Breads' },
  { key: 'desserts', label: 'Desserts & Sweets' },
  { key: 'late_night', label: 'Late Night / Filter Coffee' },
];

export const MenuTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [bufferPercentage, setBufferPercentage] = useState<number>(10); // 10% standard catering buffer
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    course: 'starters' as MenuItem['course'],
    name: '',
    description: '',
    isVegetarian: true,
    isJainFriendly: false,
    isVegan: false,
    isGlutenFree: false,
    perHeadPortion: 150,
    unit: 'grams',
  });

  const guestCount = event.details.estimatedGuestCount || 100;
  const effectiveGuestsWithBuffer = Math.round(guestCount * (1 + bufferPercentage / 100));

  // Default menu if empty
  const menuItems: MenuItem[] = event.menu.length > 0 ? event.menu : [
    {
      id: 'mn_1',
      course: 'welcome_drinks',
      name: 'Chilled Kokum & Fresh Mint Cooler',
      description: 'Cold-pressed wild kokum with black salt and crushed spearmint.',
      isVegetarian: true,
      isVegan: true,
      isJainFriendly: true,
      isGlutenFree: true,
      perHeadPortionGramsOrUnits: 180,
      unit: 'ml',
    },
    {
      id: 'mn_2',
      course: 'starters',
      name: 'Vazhaipoo Banana Blossom Cutlet & Paneer Tikka',
      description: 'Golden fried spiced lentil patties and artisanal malai paneer skewers.',
      isVegetarian: true,
      isVegan: false,
      isJainFriendly: true,
      isGlutenFree: true,
      perHeadPortionGramsOrUnits: 3,
      unit: 'pieces',
    },
    {
      id: 'mn_3',
      course: 'mains',
      name: 'Traditional Royal 24-Item Virundhu & Biryani',
      description: 'Steamed ponni rice, drumstick sambar, avial, poriyal, vegetable dum biryani.',
      isVegetarian: true,
      isVegan: false,
      isJainFriendly: true,
      isGlutenFree: true,
      perHeadPortionGramsOrUnits: 550,
      unit: 'grams',
    },
    {
      id: 'mn_4',
      course: 'desserts',
      name: 'Warm Akkaravadisal & Mango Kulfi',
      description: 'Slow-cooked palm jaggery temple pudding and Alphonso mango kulfi.',
      isVegetarian: true,
      isVegan: false,
      isJainFriendly: true,
      perHeadPortionGramsOrUnits: 120,
      unit: 'grams',
    },
  ];

  // Dietary check against registered guest list
  const specialDietGuests = event.guests.filter((g) => g.dietaryNeeds !== 'standard');
  const hasJainGuests = event.guests.some((g) => g.dietaryNeeds === 'jain');
  const hasJainItems = menuItems.some((i) => i.isJainFriendly);
  const hasVeganGuests = event.guests.some((g) => g.dietaryNeeds === 'vegan');
  const hasVeganItems = menuItems.some((i) => i.isVegan);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: MenuItem = {
      id: `mn_${Date.now()}`,
      course: itemForm.course,
      name: itemForm.name,
      description: itemForm.description,
      isVegetarian: itemForm.isVegetarian,
      isJainFriendly: itemForm.isJainFriendly,
      isVegan: itemForm.isVegan,
      isGlutenFree: itemForm.isGlutenFree,
      perHeadPortionGramsOrUnits: itemForm.perHeadPortion,
      unit: itemForm.unit,
    };

    upsertEvent({ ...event, menu: [...menuItems, newItem] });
    setIsAddModalOpen(false);
    showToast({ type: 'success', title: 'Menu Item Added' });
  };

  const handleRegenerateMenu = async () => {
    setIsGeneratingAI(true);
    try {
      const data = await apiGenerateEventMenu({
        eventType: event.details.type,
        regionOrCuisine: event.details.culturalTraditions || 'Traditional Indian Gourmet',
        season: 'Winter',
        timeOfDay: 'Evening',
        dietaryRules: event.details.dietaryPreferences,
        guestCount,
      });

      upsertEvent({ ...event, menu: data.items });
      showToast({
        type: 'success',
        title: 'New AI Menu Generated',
        description: data.themeTitle || 'Curated banquet menu updated.',
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Menu Generation Failed', description: err.message });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Safe wrapper helper for API call
  async function apiGenerateEventMenu(params: any) {
    const res = await fetch('/api/ai/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const d = await res.json();
    return d;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
            Catering Architecture & Quantity Estimation
          </h2>
          <p className="text-xs text-[#5C5765]">
            Deterministic food portion math: per-head units × guest count × buffer %.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateMenu}
            isLoading={isGeneratingAI}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#FF7A6B]" />}
          >
            Regenerate with AI
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Buffer Controller & Deterministic Math Strip */}
      <Card variant="highlight" padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[11px] font-semibold text-[#5C5765] block uppercase">Target Guests</span>
            <span className="text-xl font-bold font-mono text-[#1E1B24] tabular-nums">{guestCount} Pax</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#5C5765] mb-1">
              <span>Catering Buffer</span>
              <span className="font-mono text-[#4B2A7B]">+{bufferPercentage}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={5}
              value={bufferPercentage}
              onChange={(e) => setBufferPercentage(parseInt(e.target.value))}
              className="w-full accent-[#4B2A7B]"
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[#5C5765] block uppercase">Computed Headcount</span>
            <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
              {effectiveGuestsWithBuffer} Pax
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[#5C5765] block uppercase">Estimated Plate Cost</span>
            <span className="text-xl font-bold font-mono text-[#4B2A7B] tabular-nums">
              ₹850 – ₹1,200
            </span>
            <span className="text-[10px] text-[#5C5765] block">AI estimate — verify with caterer</span>
          </div>
        </div>
      </Card>

      {/* Dietary Coverage Guard Banner */}
      {hasJainGuests && !hasJainItems && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Dietary Coverage Warning:</strong> You have registered Jain guests, but no menu item is currently flagged as Jain-friendly. Consider adding root-free dishes.
          </span>
        </div>
      )}

      {/* Menu Courses Breakdown */}
      <div className="space-y-6">
        {COURSES.map((course) => {
          const items = menuItems.filter((i) => i.course === course.key);
          if (items.length === 0) return null;

          return (
            <div key={course.key} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4B2A7B] border-b border-[#4B2A7B]/10 pb-1.5">
                {course.label} ({items.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => {
                  // Deterministic total batch quantity
                  const totalRawQuantity = item.perHeadPortionGramsOrUnits * effectiveGuestsWithBuffer;
                  const displayQuantity =
                    item.unit === 'grams'
                      ? `${(totalRawQuantity / 1000).toFixed(1)} kg`
                      : item.unit === 'ml'
                      ? `${(totalRawQuantity / 1000).toFixed(1)} L`
                      : `${totalRawQuantity} ${item.unit}`;

                  return (
                    <Card key={item.id} variant="default" padding="md" className="space-y-2 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-[#1E1B24]">{item.name}</h4>
                          <div className="flex items-center gap-1">
                            {item.isVegetarian && <Badge variant="success" size="sm">Veg</Badge>}
                            {item.isJainFriendly && <Badge variant="coral" size="sm">Jain</Badge>}
                            {item.isVegan && <Badge variant="neutral" size="sm">Vegan</Badge>}
                          </div>
                        </div>

                        <p className="text-xs text-[#5C5765]">{item.description}</p>
                      </div>

                      {/* Deterministic Batch Computation Strip */}
                      <div className="pt-2 border-t border-[#4B2A7B]/10 flex items-center justify-between text-xs font-mono">
                        <span className="text-[#5C5765]">
                          {item.perHeadPortionGramsOrUnits} {item.unit} / head
                        </span>
                        <span className="font-semibold text-[#4B2A7B] bg-[#F3EEF8] px-2 py-0.5 rounded">
                          Batch Total: {displayQuantity}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Custom Menu Item">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Course *</label>
            <select
              value={itemForm.course}
              onChange={(e) => setItemForm({ ...itemForm, course: e.target.value as any })}
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            >
              {COURSES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Dish Name *</label>
            <input
              type="text"
              required
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              placeholder="e.g. Saffron Rasamalai with Pistachios"
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Per-Head Portion</label>
              <input
                type="number"
                min={1}
                value={itemForm.perHeadPortion}
                onChange={(e) => setItemForm({ ...itemForm, perHeadPortion: parseInt(e.target.value) || 100 })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Unit</label>
              <select
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              >
                <option value="grams">Grams</option>
                <option value="pieces">Pieces</option>
                <option value="ml">Milliliters (ml)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isVegetarian}
                onChange={(e) => setItemForm({ ...itemForm, isVegetarian: e.target.checked })}
              />
              <span>Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isJainFriendly}
                onChange={(e) => setItemForm({ ...itemForm, isJainFriendly: e.target.checked })}
              />
              <span>Jain Friendly</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isVegan}
                onChange={(e) => setItemForm({ ...itemForm, isVegan: e.target.checked })}
              />
              <span>Vegan</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
