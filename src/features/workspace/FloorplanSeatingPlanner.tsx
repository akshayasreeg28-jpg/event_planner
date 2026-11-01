import React, { useState, useRef } from 'react';
import { EventFull, Guest, TableSeating, TableShape } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { upsertEvent } from '../../lib/storage';
import {
  Users,
  Plus,
  AlertTriangle,
  Move,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Utensils,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  Printer,
  X,
  Box,
  Layers,
} from 'lucide-react';
import { Floorplan3DViewer } from './Floorplan3DViewer';

interface FloorplanSeatingPlannerProps {
  event: EventFull;
  onUpdateEvent?: (updated: EventFull) => void;
}

export const DIETARY_BADGE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; glow: string }
> = {
  allergies: {
    label: 'Allergy / Medical',
    icon: '🚨',
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-300',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)] ring-2 ring-rose-500',
  },
  jain: {
    label: 'Jain (No Root Veg)',
    icon: '🕉️',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-amber-500',
  },
  vegan: {
    label: 'Vegan',
    icon: '🥑',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500',
  },
  vegetarian: {
    label: 'Vegetarian',
    icon: '🥗',
    bg: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-300',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.3)] ring-1 ring-green-400',
  },
  gluten_free: {
    label: 'Gluten-Free',
    icon: '🌾',
    bg: 'bg-yellow-100',
    text: 'text-yellow-900',
    border: 'border-yellow-300',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)] ring-2 ring-yellow-500',
  },
  halal: {
    label: 'Halal',
    icon: '🌙',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    border: 'border-sky-300',
    glow: 'shadow-[0_0_15px_rgba(14,165,233,0.4)] ring-2 ring-sky-500',
  },
  standard: {
    label: 'Standard',
    icon: '🍽️',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-200',
    glow: '',
  },
};

export const FloorplanSeatingPlanner: React.FC<FloorplanSeatingPlannerProps> = ({
  event,
  onUpdateEvent,
}) => {
  const { showToast } = useToast();
  const floorplanRef = useRef<HTMLDivElement>(null);

  // Default initial tables if empty
  const initialTables: TableSeating[] =
    event.seatingTables && event.seatingTables.length > 0
      ? event.seatingTables
      : [
          {
            id: 'tbl_1',
            name: 'Table 1 — Elders & VIPs',
            capacity: 8,
            assignedGuestIds: ['gst_1'],
            shape: 'round',
            x: 25,
            y: 35,
          },
          {
            id: 'tbl_2',
            name: 'Table 2 — Family & Relatives',
            capacity: 10,
            assignedGuestIds: ['gst_3'],
            shape: 'round',
            x: 65,
            y: 35,
          },
          {
            id: 'tbl_3',
            name: 'Table 3 — Friends & Colleagues',
            capacity: 10,
            assignedGuestIds: ['gst_2'],
            shape: 'rectangular',
            x: 25,
            y: 70,
          },
          {
            id: 'tbl_4',
            name: 'Table 4 — Bride & Groom Party',
            capacity: 8,
            assignedGuestIds: [],
            shape: 'head_table',
            x: 65,
            y: 70,
          },
        ];

  const [tables, setTables] = useState<TableSeating[]>(initialTables);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);
  const [viewPerspective, setViewPerspective] = useState<'2d' | '3d'>('2d');

  // Table Dragging on floorplan
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dietary requirement tracker & highlight filters
  const [dietaryHighlightFilter, setDietaryHighlightFilter] = useState<string>('all_special');
  const [isDietaryHighlightActive, setIsDietaryHighlightActive] = useState<boolean>(true);

  // Guest search and group filter for sidebar
  const [guestSearch, setGuestSearch] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // Add Table Modal
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableForm, setNewTableForm] = useState<{
    name: string;
    capacity: number;
    shape: TableShape;
    locationNote: string;
  }>({
    name: `Table ${tables.length + 1}`,
    capacity: 8,
    shape: 'round',
    locationNote: 'Main Dining Hall',
  });

  // Kitchen Dietary Manifest Sheet Modal
  const [isKitchenManifestOpen, setIsKitchenManifestOpen] = useState(false);

  // Synchronize helper
  const syncChanges = (newTables: TableSeating[], newGuests?: Guest[]) => {
    setTables(newTables);
    const updatedEvent: EventFull = {
      ...event,
      seatingTables: newTables,
      guests: newGuests || event.guests,
    };
    upsertEvent(updatedEvent);
    if (onUpdateEvent) onUpdateEvent(updatedEvent);
  };

  // Seated & Unassigned calculations
  const allAssignedIds = new Set(tables.flatMap((t) => t.assignedGuestIds));
  const unassignedGuests = event.guests.filter((g) => !allAssignedIds.has(g.id));

  // Dietary breakdown across entire guest list
  const totalDietaryStats = event.guests.reduce((acc: Record<string, number>, g) => {
    const key = g.dietaryNeeds || 'standard';
    acc[key] = (acc[key] || 0) + 1 + (g.plusOnes || 0);
    return acc;
  }, {});

  const totalAllergiesCount = event.guests
    .filter((g) => g.dietaryNeeds === 'allergies' || (g.allergies && g.allergies.length > 0))
    .reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

  const totalJainCount = event.guests
    .filter((g) => g.dietaryNeeds === 'jain')
    .reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

  const totalVeganCount = event.guests
    .filter((g) => g.dietaryNeeds === 'vegan')
    .reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

  const totalGlutenFreeCount = event.guests
    .filter((g) => g.dietaryNeeds === 'gluten_free')
    .reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

  // Table drag start
  const handleTableMouseDown = (e: React.MouseEvent, table: TableSeating) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    const floorplan = floorplanRef.current;
    if (!floorplan) return;

    const rect = floorplan.getBoundingClientRect();
    const currentTablePxX = (table.x || 50) * 0.01 * rect.width;
    const currentTablePxY = (table.y || 50) * 0.01 * rect.height;

    setDraggingTableId(table.id);
    setDragOffset({
      x: e.clientX - rect.left - currentTablePxX,
      y: e.clientY - rect.top - currentTablePxY,
    });
  };

  // Mouse move on floorplan canvas for table positioning
  const handleFloorplanMouseMove = (e: React.MouseEvent) => {
    if (!draggingTableId) return;
    const floorplan = floorplanRef.current;
    if (!floorplan) return;

    const rect = floorplan.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - dragOffset.x;
    const mouseY = e.clientY - rect.top - dragOffset.y;

    const pctX = Math.max(12, Math.min(88, Math.round((mouseX / rect.width) * 100)));
    const pctY = Math.max(15, Math.min(85, Math.round((mouseY / rect.height) * 100)));

    const updated = tables.map((t) => (t.id === draggingTableId ? { ...t, x: pctX, y: pctY } : t));
    setTables(updated);
  };

  const handleFloorplanMouseUp = () => {
    if (draggingTableId) {
      setDraggingTableId(null);
      syncChanges(tables);
    }
  };

  // HTML5 Drag & Drop for Guest Seating
  const handleGuestDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData('text/plain', guestId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedGuestId(guestId);
  };

  const handleTableDragOver = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTableId !== tableId) {
      setDragOverTableId(tableId);
    }
  };

  const handleTableDragLeave = () => {
    setDragOverTableId(null);
  };

  const handleTableDrop = (e: React.DragEvent, targetTableId: string) => {
    e.preventDefault();
    setDragOverTableId(null);
    const guestId = e.dataTransfer.getData('text/plain') || draggedGuestId;
    setDraggedGuestId(null);

    if (!guestId) return;
    assignGuestToTable(guestId, targetTableId);
  };

  const assignGuestToTable = (guestId: string, targetTableId: string) => {
    const targetTable = tables.find((t) => t.id === targetTableId);
    const guest = event.guests.find((g) => g.id === guestId);
    if (!targetTable || !guest) return;

    const targetOccupancy = targetTable.assignedGuestIds
      .map((id) => event.guests.find((g) => g.id === id))
      .filter(Boolean)
      .reduce((sum, g) => sum + 1 + (g?.plusOnes || 0), 0);

    const guestDemand = 1 + (guest.plusOnes || 0);

    if (targetOccupancy + guestDemand > targetTable.capacity) {
      showToast({
        type: 'warning',
        title: 'Table Capacity Alert',
        description: `Adding ${guest.name} (${guestDemand} seats) exceeds ${targetTable.name} capacity (${targetOccupancy + guestDemand}/${targetTable.capacity}).`,
      });
    }

    // Remove guest from any existing table
    const updatedTables = tables.map((t) => {
      const cleanList = t.assignedGuestIds.filter((id) => id !== guestId);
      if (t.id === targetTableId) {
        return { ...t, assignedGuestIds: [...cleanList, guestId] };
      }
      return { ...t, assignedGuestIds: cleanList };
    });

    const updatedGuests = event.guests.map((g) =>
      g.id === guestId ? { ...g, tableAssignment: targetTable.name } : g
    );

    syncChanges(updatedTables, updatedGuests);

    // If guest has special dietary requirements, alert user of placement
    if (guest.dietaryNeeds !== 'standard') {
      const dietaryMeta = DIETARY_BADGE_CONFIG[guest.dietaryNeeds] || DIETARY_BADGE_CONFIG.standard;
      showToast({
        type: 'info',
        title: `${dietaryMeta.icon} Seated at ${targetTable.name}`,
        description: `${guest.name} (${dietaryMeta.label}) assigned. Caterer alert updated.`,
      });
    } else {
      showToast({
        type: 'success',
        title: 'Guest Seated',
        description: `${guest.name} placed at ${targetTable.name}.`,
      });
    }
  };

  const handleUnseatGuest = (guestId: string) => {
    const guest = event.guests.find((g) => g.id === guestId);
    const updatedTables = tables.map((t) => ({
      ...t,
      assignedGuestIds: t.assignedGuestIds.filter((id) => id !== guestId),
    }));

    const updatedGuests = event.guests.map((g) =>
      g.id === guestId ? { ...g, tableAssignment: undefined } : g
    );

    syncChanges(updatedTables, updatedGuests);
    showToast({
      type: 'info',
      title: 'Guest Unseated',
      description: `${guest?.name || 'Guest'} returned to unassigned pool.`,
    });
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `tbl_${Date.now()}`;
    const newTable: TableSeating = {
      id: newId,
      name: newTableForm.name,
      capacity: Number(newTableForm.capacity),
      shape: newTableForm.shape,
      locationNote: newTableForm.locationNote,
      assignedGuestIds: [],
      x: 45,
      y: 50,
    };

    const updated = [...tables, newTable];
    syncChanges(updated);
    setIsAddTableModalOpen(false);
    showToast({ type: 'success', title: 'Table Added to Floorplan' });
  };

  const handleDeleteTable = (tableId: string) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;

    // Unassign guests
    const updatedGuests = event.guests.map((g) =>
      targetTable.assignedGuestIds.includes(g.id) ? { ...g, tableAssignment: undefined } : g
    );

    const updatedTables = tables.filter((t) => t.id !== tableId);
    syncChanges(updatedTables, updatedGuests);
    if (selectedTableId === tableId) setSelectedTableId(null);
    showToast({
      type: 'info',
      title: 'Table Removed',
      description: `Removed ${targetTable.name}. Seated guests moved back to pool.`,
    });
  };

  // Helper to determine if a table has dietary matches
  const getTableDietarySummary = (table: TableSeating) => {
    const seatedGuests = table.assignedGuestIds
      .map((id) => event.guests.find((g) => g.id === id))
      .filter(Boolean) as Guest[];

    const dietaryCounts: Record<string, number> = {};
    let hasAllergies = false;
    let hasSpecial = false;

    seatedGuests.forEach((g) => {
      const count = 1 + (g.plusOnes || 0);
      dietaryCounts[g.dietaryNeeds] = (dietaryCounts[g.dietaryNeeds] || 0) + count;
      if (g.dietaryNeeds !== 'standard') hasSpecial = true;
      if (g.dietaryNeeds === 'allergies' || (g.allergies && g.allergies.length > 0)) {
        hasAllergies = true;
      }
    });

    return {
      seatedGuests,
      totalOccupancy: seatedGuests.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0),
      dietaryCounts,
      hasAllergies,
      hasSpecial,
    };
  };

  // Check if table matches active dietary highlight
  const isTableHighlighted = (table: TableSeating) => {
    if (!isDietaryHighlightActive) return false;
    const summary = getTableDietarySummary(table);

    if (dietaryHighlightFilter === 'all_special') {
      return summary.hasSpecial;
    }
    if (dietaryHighlightFilter === 'allergies') {
      return summary.hasAllergies;
    }
    return Boolean(summary.dietaryCounts[dietaryHighlightFilter]);
  };

  const filteredUnassignedGuests = unassignedGuests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
      g.dietaryNeeds.toLowerCase().includes(guestSearch.toLowerCase()) ||
      (g.dietaryNotes && g.dietaryNotes.toLowerCase().includes(guestSearch.toLowerCase()));

    const matchesGroup = groupFilter === 'all' || g.groupSide === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedTableSummary = selectedTable ? getTableDietarySummary(selectedTable) : null;

  return (
    <div className="space-y-5">
      {/* Top Dietary Requirements Tracker & Floorplan Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2D184C] via-[#4B2A7B] to-[#1E1133] text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF7A6B]">
                Dietary Requirements Tracker & Floorplan
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Kitchen Sync
              </span>
            </div>
            <h3 className="text-lg font-bold font-serif text-white">
              Interactive Table Seating & Catering Manifest
            </h3>
            <p className="text-xs text-zinc-300 max-w-2xl">
              Drag guests onto tables to arrange seating. Guests with allergies and dietary preferences are highlighted in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsKitchenManifestOpen(true)}
              className="text-white border-white/20 hover:bg-white/10"
              leftIcon={<Utensils className="w-3.5 h-3.5 text-emerald-400" />}
            >
              Caterer Dietary Sheet
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddTableModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Table
            </Button>
          </div>
        </div>

        {/* Dietary Statistics Tracker Strip */}
        <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {/* Allergies */}
          <button
            onClick={() => {
              setDietaryHighlightFilter('allergies');
              setIsDietaryHighlightActive(true);
            }}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              isDietaryHighlightActive && dietaryHighlightFilter === 'allergies'
                ? 'bg-rose-500/30 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'bg-white/10 border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-rose-300 text-xs font-semibold">
              <span>Allergies</span>
              <span>🚨</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {totalAllergiesCount} Pax
            </div>
            <span className="text-[10px] text-zinc-300">Strict Kitchen Isolation</span>
          </button>

          {/* Jain */}
          <button
            onClick={() => {
              setDietaryHighlightFilter('jain');
              setIsDietaryHighlightActive(true);
            }}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              isDietaryHighlightActive && dietaryHighlightFilter === 'jain'
                ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-white/10 border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
              <span>Jain Meals</span>
              <span>🕉️</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {totalJainCount} Pax
            </div>
            <span className="text-[10px] text-zinc-300">No Onion / Garlic</span>
          </button>

          {/* Vegan */}
          <button
            onClick={() => {
              setDietaryHighlightFilter('vegan');
              setIsDietaryHighlightActive(true);
            }}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              isDietaryHighlightActive && dietaryHighlightFilter === 'vegan'
                ? 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-white/10 border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
              <span>Vegan</span>
              <span>🥑</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {totalVeganCount} Pax
            </div>
            <span className="text-[10px] text-zinc-300">100% Plant-Based</span>
          </button>

          {/* Gluten-Free */}
          <button
            onClick={() => {
              setDietaryHighlightFilter('gluten_free');
              setIsDietaryHighlightActive(true);
            }}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              isDietaryHighlightActive && dietaryHighlightFilter === 'gluten_free'
                ? 'bg-yellow-500/30 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                : 'bg-white/10 border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-yellow-300 text-xs font-semibold">
              <span>Gluten-Free</span>
              <span>🌾</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {totalGlutenFreeCount} Pax
            </div>
            <span className="text-[10px] text-zinc-300">Millet / Rice Base</span>
          </button>

          {/* Vegetarian */}
          <button
            onClick={() => {
              setDietaryHighlightFilter('vegetarian');
              setIsDietaryHighlightActive(true);
            }}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              isDietaryHighlightActive && dietaryHighlightFilter === 'vegetarian'
                ? 'bg-green-500/30 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                : 'bg-white/10 border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-green-300 text-xs font-semibold">
              <span>Vegetarian</span>
              <span>🥗</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {(totalDietaryStats['vegetarian'] || 0) + (totalDietaryStats['standard'] || 0)} Pax
            </div>
            <span className="text-[10px] text-zinc-300">Standard & Pure Veg</span>
          </button>

          {/* Highlight Toggle Button */}
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-300 uppercase font-semibold">Dietary Halo Mode</span>
            <button
              onClick={() => setIsDietaryHighlightActive(!isDietaryHighlightActive)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isDietaryHighlightActive
                  ? 'bg-[#FF7A6B] text-white shadow-xs'
                  : 'bg-white/20 text-zinc-300 hover:bg-white/30'
              }`}
            >
              {isDietaryHighlightActive ? '✓ Highlights Active' : 'Off (Show Normal)'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Seating Workspace: Drag & Drop Floorplan + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Unassigned & Draggable Guests Pool */}
        <div className="lg:col-span-4 space-y-3">
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold font-serif text-[#1E1B24]">
                  Guest Pool ({unassignedGuests.length} Unseated)
                </h4>
                <p className="text-[11px] text-[#5C5765]">
                  Drag guests directly onto any table on the floorplan.
                </p>
              </div>

              <Badge variant={unassignedGuests.length > 0 ? 'coral' : 'success'} size="sm">
                {unassignedGuests.length === 0 ? 'All Seated' : `${unassignedGuests.length} Pending`}
              </Badge>
            </div>

            {/* Filter and Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Search by name, allergy, or food..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F3EEF8]/60 border border-[#4B2A7B]/15 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'bride', label: 'Bride' },
                    { id: 'groom', label: 'Groom' },
                    { id: 'vip', label: 'VIPs' },
                    { id: 'general', label: 'General' },
                  ] as const
                ).map((grp) => (
                  <button
                    key={grp.id}
                    onClick={() => setGroupFilter(grp.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer capitalize shrink-0 ${
                      groupFilter === grp.id
                        ? 'bg-[#4B2A7B] text-white'
                        : 'bg-[#F3EEF8] text-[#5C5765] hover:text-[#1E1B24]'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Draggable Guest List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredUnassignedGuests.length > 0 ? (
                filteredUnassignedGuests.map((guest) => {
                  const dietary = DIETARY_BADGE_CONFIG[guest.dietaryNeeds] || DIETARY_BADGE_CONFIG.standard;
                  const isAllergy = guest.dietaryNeeds === 'allergies';

                  return (
                    <div
                      key={guest.id}
                      draggable={true}
                      onDragStart={(e) => handleGuestDragStart(e, guest.id)}
                      className={`p-2.5 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing group select-none ${
                        isAllergy
                          ? 'border-rose-300 bg-rose-50/30'
                          : guest.dietaryNeeds !== 'standard'
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-[#4B2A7B]/10 hover:border-[#4B2A7B]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Move className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#4B2A7B] shrink-0" />
                          <span className="text-xs font-semibold text-[#1E1B24] truncate">
                            {guest.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {guest.plusOnes > 0 && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                              +{guest.plusOnes}
                            </span>
                          )}
                          <span className="text-[10px] capitalize px-1.5 py-0.5 rounded bg-[#F3EEF8] text-[#4B2A7B]">
                            {guest.groupSide}
                          </span>
                        </div>
                      </div>

                      {/* Dietary Requirement Tag */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-1 ${dietary.bg} ${dietary.text} ${dietary.border}`}
                        >
                          <span>{dietary.icon}</span>
                          <span>{dietary.label}</span>
                        </span>

                        {guest.dietaryNotes && (
                          <span className="text-zinc-500 italic truncate max-w-[170px]">
                            {guest.dietaryNotes}
                          </span>
                        )}
                      </div>

                      {/* Mobile / 1-Click fallback dropdown */}
                      <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-[#5C5765]">
                        <span>Drag to table or:</span>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) assignGuestToTable(guest.id, e.target.value);
                          }}
                          className="text-[10px] py-1 px-1.5 bg-[#F3EEF8] border border-[#4B2A7B]/15 rounded-md text-[#4B2A7B] font-medium"
                        >
                          <option value="" disabled>
                            Select table...
                          </option>
                          {tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-[#5C5765] border border-dashed rounded-xl">
                  {unassignedGuests.length === 0
                    ? '🎉 All guests have been seated at tables!'
                    : 'No unassigned guests match your filter.'}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Interactive 2D Floorplan Canvas */}
        <div className="lg:col-span-8 space-y-3">
          <Card variant="default" padding="none" className="overflow-hidden border-[#4B2A7B]/15 shadow-sm">
            {/* Floorplan Control Bar */}
            <div className="p-3 bg-[#FBF7F0] border-b border-[#4B2A7B]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1E1B24] flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-[#4B2A7B]" />
                  Main Banquet Floorplan
                </span>
                <span className="text-zinc-400">·</span>
                <span className="text-[11px] text-[#5C5765]">
                  {viewPerspective === '2d'
                    ? 'Click and drag tables to arrange floor layout'
                    : 'Interactive 3D Venue Walkthrough with Top-Down & Isometric views'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* 2D vs 3D Perspective Toggle Button */}
                <div className="flex items-center bg-[#F3EEF8] p-0.5 rounded-xl border border-[#4B2A7B]/15">
                  <button
                    onClick={() => setViewPerspective('2d')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewPerspective === '2d'
                        ? 'bg-[#4B2A7B] text-white shadow-2xs'
                        : 'text-[#5C5765] hover:text-[#1E1B24]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>2D Blueprint</span>
                  </button>

                  <button
                    onClick={() => setViewPerspective('3d')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewPerspective === '3d'
                        ? 'bg-[#FF7A6B] text-white shadow-2xs'
                        : 'text-[#5C5765] hover:text-[#1E1B24]'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Walkthrough</span>
                  </button>
                </div>

                <span className="text-[11px] text-[#5C5765] hidden sm:inline">
                  {tables.length} Tables Active ({tables.reduce((acc, t) => acc + t.capacity, 0)} Total Chairs)
                </span>
              </div>
            </div>

            {viewPerspective === '3d' ? (
              <Floorplan3DViewer
                tables={tables}
                guests={event.guests}
                eventTitle={event.details.title}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
                dietaryFilter={dietaryHighlightFilter}
                isDietaryHighlightActive={isDietaryHighlightActive}
              />
            ) : (
              /* Visual Architectural Canvas */
              <div
                ref={floorplanRef}
                onMouseMove={handleFloorplanMouseMove}
                onMouseUp={handleFloorplanMouseUp}
                onMouseLeave={handleFloorplanMouseUp}
                className="relative w-full h-[580px] bg-[#FAF8F5] select-none overflow-hidden"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(75, 42, 123, 0.08) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
              {/* Floor Landmark: Main Stage / Mandap at Top */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-72 h-10 rounded-b-2xl bg-gradient-to-b from-[#4B2A7B] to-[#361E59] text-white shadow-md flex items-center justify-center gap-2 z-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-serif font-bold text-xs tracking-wider uppercase text-amber-200">
                  Main Stage / Mandap Pavilion
                </span>
              </div>

              {/* Floor Landmark: Entrance & Foyer at Bottom */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-64 h-8 rounded-t-xl bg-[#E2D9F3]/60 border-t border-x border-[#4B2A7B]/20 text-[#4B2A7B] text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 z-0">
                <span>🚪 Grand Entrance & Reception Foyer</span>
              </div>

              {/* Floor Landmark: Buffet & Food Counters on Right */}
              <div className="absolute top-24 right-2 w-10 h-72 rounded-l-2xl bg-emerald-900/10 border-l border-y border-emerald-600/30 text-emerald-800 text-[10px] font-bold flex items-center justify-center [writing-mode:vertical-rl] tracking-wider uppercase py-2 z-0">
                🍽️ Live Food Counters & Virundhu Banquet Bar
              </div>

              {/* Floor Landmark: Dancefloor / Photobooth on Left */}
              <div className="absolute top-24 left-2 w-10 h-72 rounded-r-2xl bg-[#FF7A6B]/10 border-r border-y border-[#FF7A6B]/30 text-[#FF7A6B] text-[10px] font-bold flex items-center justify-center [writing-mode:vertical-rl] tracking-wider uppercase py-2 z-0">
                📸 Photobooth & Sangeet Dancefloor
              </div>

              {/* Tables Rendered Dynamically on the Floorplan */}
              {tables.map((table) => {
                const summary = getTableDietarySummary(table);
                const isOverCapacity = summary.totalOccupancy > table.capacity;
                const isDropTarget = dragOverTableId === table.id;
                const isSelected = selectedTableId === table.id;
                const isHighlighted = isTableHighlighted(table);

                const x = table.x ?? 50;
                const y = table.y ?? 50;

                return (
                  <div
                    key={table.id}
                    onMouseDown={(e) => handleTableMouseDown(e, table)}
                    onDragOver={(e) => handleTableDragOver(e, table.id)}
                    onDragLeave={handleTableDragLeave}
                    onDrop={(e) => handleTableDrop(e, table.id)}
                    onClick={() => setSelectedTableId(table.id)}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-10 cursor-move transition-shadow duration-200 ${
                      isHighlighted
                        ? 'ring-4 ring-amber-400 ring-offset-2'
                        : isDietaryHighlightActive && !summary.hasSpecial
                        ? 'opacity-65'
                        : ''
                    }`}
                  >
                    {/* Table Body Element */}
                    <div
                      className={`relative flex flex-col items-center justify-center p-3 text-center transition-all ${
                        table.shape === 'rectangular'
                          ? 'w-48 h-28 rounded-2xl'
                          : table.shape === 'head_table'
                          ? 'w-52 h-24 rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50'
                          : 'w-36 h-36 rounded-full'
                      } ${
                        isDropTarget
                          ? 'ring-4 ring-emerald-500 bg-emerald-50 shadow-xl scale-105'
                          : isSelected
                          ? 'ring-3 ring-[#4B2A7B] bg-white shadow-lg'
                          : isOverCapacity
                          ? 'border-2 border-rose-500 bg-rose-50/90 shadow-md'
                          : 'border-2 border-[#4B2A7B]/25 bg-white shadow-md hover:border-[#4B2A7B] hover:shadow-lg'
                      }`}
                    >
                      {/* Table Center Info */}
                      <div className="space-y-0.5 pointer-events-none">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF7A6B]">
                          {table.shape === 'head_table' ? 'VIP Head' : table.shape}
                        </span>
                        <h4 className="text-xs font-bold font-serif text-[#1E1B24] leading-tight line-clamp-1 px-1">
                          {table.name}
                        </h4>

                        <div className="flex items-center justify-center gap-1 pt-0.5">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                              isOverCapacity
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-[#4B2A7B]/10 text-[#4B2A7B]'
                            }`}
                          >
                            {summary.totalOccupancy}/{table.capacity}
                          </span>
                        </div>

                        {/* Drop Hover Indicator */}
                        {isDropTarget && (
                          <div className="text-[10px] font-bold text-emerald-700 animate-bounce">
                            + Drop Guest Here
                          </div>
                        )}
                      </div>

                      {/* Real-time Dietary Indicators on Table */}
                      <div className="absolute -top-3 flex items-center justify-center gap-1 pointer-events-none">
                        {summary.hasAllergies && (
                          <span
                            title="Table has guests with severe allergies"
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm flex items-center gap-0.5"
                          >
                            <span>🚨</span>
                            <span>{summary.dietaryCounts['allergies']} Allergy</span>
                          </span>
                        )}

                        {summary.dietaryCounts['jain'] ? (
                          <span
                            title="Table has Jain meals"
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm flex items-center gap-0.5"
                          >
                            <span>🕉️</span>
                            <span>{summary.dietaryCounts['jain']} Jain</span>
                          </span>
                        ) : null}

                        {summary.dietaryCounts['vegan'] ? (
                          <span
                            title="Table has Vegan meals"
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm flex items-center gap-0.5"
                          >
                            <span>🥑</span>
                            <span>{summary.dietaryCounts['vegan']} Vegan</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Visual Circular Seat Nodes Arrayed Around Table */}
                      {table.shape === 'round' && (
                        <div className="absolute inset-0 pointer-events-none">
                          {Array.from({ length: table.capacity }).map((_, idx) => {
                            const angle = (idx / table.capacity) * 2 * Math.PI - Math.PI / 2;
                            const radius = 22; // px offset from center
                            const seatX = 50 + radius * Math.cos(angle);
                            const seatY = 50 + radius * Math.sin(angle);
                            const isFilled = idx < summary.totalOccupancy;

                            return (
                              <div
                                key={idx}
                                style={{
                                  left: `${seatX}%`,
                                  top: `${seatY}%`,
                                }}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border text-[8px] flex items-center justify-center font-mono font-bold ${
                                  isFilled
                                    ? 'bg-[#4B2A7B] text-white border-white shadow-2xs'
                                    : 'bg-zinc-200 border-zinc-300 text-zinc-500'
                                }`}
                              >
                                {idx + 1}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </Card>

          {/* Selected Table Inspector Details Drawer */}
          {selectedTable && selectedTableSummary && (
            <Card variant="default" padding="md" className="space-y-4 border-[#4B2A7B]/20 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#4B2A7B]/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#4B2A7B] text-white flex items-center justify-center font-bold text-xs font-mono">
                    {selectedTable.assignedGuestIds.length}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-serif text-[#1E1B24]">
                      {selectedTable.name} ({selectedTable.locationNote || 'Main Hall'})
                    </h3>
                    <p className="text-xs text-[#5C5765]">
                      {selectedTableSummary.totalOccupancy} of {selectedTable.capacity} Seats Assigned
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteTable(selectedTable.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Table</span>
                  </button>

                  <button
                    onClick={() => setSelectedTableId(null)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dietary Kitchen Alert for this Table */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950">
                <Utensils className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    Kitchen Seating Breakdown for {selectedTable.name}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(selectedTableSummary.dietaryCounts).map(([key, count]) => {
                      const meta = DIETARY_BADGE_CONFIG[key] || DIETARY_BADGE_CONFIG.standard;
                      return (
                        <span
                          key={key}
                          className={`px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${meta.bg} ${meta.text} ${meta.border}`}
                        >
                          <span>{meta.icon}</span>
                          <span>
                            {count} {meta.label}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seated Guests List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#1E1B24] block">
                  Seated Guests ({selectedTableSummary.seatedGuests.length} Leads):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTableSummary.seatedGuests.map((guest) => {
                    const dietary = DIETARY_BADGE_CONFIG[guest.dietaryNeeds] || DIETARY_BADGE_CONFIG.standard;
                    return (
                      <div
                        key={guest.id}
                        className="p-2.5 rounded-xl border border-zinc-200 bg-[#FFFDF9] flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-[#1E1B24] truncate flex items-center gap-1">
                            <span>{guest.name}</span>
                            {guest.plusOnes > 0 && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                (+{guest.plusOnes})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[10px]">
                            <span className={`px-1 rounded ${dietary.bg} ${dietary.text}`}>
                              {dietary.icon} {dietary.label}
                            </span>
                            {guest.dietaryNotes && (
                              <span className="text-rose-700 italic truncate max-w-[120px]">
                                {guest.dietaryNotes}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnseatGuest(guest.id)}
                          className="px-2 py-1 rounded-md text-[11px] text-rose-600 hover:bg-rose-50 border border-rose-200 font-medium shrink-0 ml-2 cursor-pointer"
                        >
                          Unseat
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Add New Table */}
      <Modal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        title="Add Table to Floorplan"
      >
        <form onSubmit={handleAddTable} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
              Table Name / Label *
            </label>
            <input
              type="text"
              required
              value={newTableForm.name}
              onChange={(e) => setNewTableForm({ ...newTableForm, name: e.target.value })}
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              placeholder="e.g. Table 5 — High School Friends"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                Chair Capacity *
              </label>
              <select
                value={newTableForm.capacity}
                onChange={(e) => setNewTableForm({ ...newTableForm, capacity: Number(e.target.value) })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              >
                <option value={6}>6 Seats (Intimate)</option>
                <option value={8}>8 Seats (Standard Round)</option>
                <option value={10}>10 Seats (Banquet Round)</option>
                <option value={12}>12 Seats (Long Banquet)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
                Table Shape *
              </label>
              <select
                value={newTableForm.shape}
                onChange={(e) => setNewTableForm({ ...newTableForm, shape: e.target.value as TableShape })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              >
                <option value="round">Round Table</option>
                <option value="rectangular">Rectangular Table</option>
                <option value="head_table">VIP Head Stage Table</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">
              Zone / Location Note
            </label>
            <input
              type="text"
              value={newTableForm.locationNote}
              onChange={(e) => setNewTableForm({ ...newTableForm, locationNote: e.target.value })}
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              placeholder="e.g. Near Garden Lawn Entrance"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddTableModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Place Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Caterer Kitchen Dietary Manifest Sheet */}
      <Modal
        isOpen={isKitchenManifestOpen}
        onClose={() => setIsKitchenManifestOpen(false)}
        title="Kitchen & Banquet Dietary Seating Manifest"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#4B2A7B]/10">
            <span className="text-xs text-[#5C5765]">
              Accredited table-by-table meal manifest prepared for banquet captains and executive chefs.
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Sheet
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-zinc-200 rounded-xl overflow-hidden">
              <thead className="bg-[#F3EEF8] text-[#5C5765] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Table Name</th>
                  <th className="py-2.5 px-3 text-center">Occupants</th>
                  <th className="py-2.5 px-3">Dietary Breakdown</th>
                  <th className="py-2.5 px-3">Critical Allergy Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {tables.map((table) => {
                  const summary = getTableDietarySummary(table);
                  const allergyNotes = summary.seatedGuests
                    .filter((g) => g.dietaryNeeds === 'allergies' || g.dietaryNotes)
                    .map((g) => `${g.name}: ${g.dietaryNotes || g.dietaryNeeds}`);

                  return (
                    <tr key={table.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-3 font-semibold text-[#1E1B24]">
                        {table.name}
                        <span className="block text-[10px] text-zinc-500 font-normal">
                          {table.locationNote}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {summary.totalOccupancy} / {table.capacity}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(summary.dietaryCounts).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-medium"
                            >
                              {v} {k.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {allergyNotes.length > 0 ? (
                          <ul className="text-[11px] text-rose-700 font-medium space-y-0.5">
                            {allergyNotes.map((note, idx) => (
                              <li key={idx}>🚨 {note}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">None recorded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
