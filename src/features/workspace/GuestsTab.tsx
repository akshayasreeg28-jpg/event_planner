import React, { useState } from 'react';
import { EventFull, Guest } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { upsertEvent } from '../../lib/storage';
import { apiGenerateInvitations } from '../../services/api';
import { FloorplanSeatingPlanner } from './FloorplanSeatingPlanner';
import {
  Users,
  Plus,
  Download,
  Upload,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  AlertTriangle,
  Send,
  Trash2,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const DIETARY_COLORS: Record<string, string> = {
  standard: '#4B2A7B',
  vegetarian: '#27AE60',
  vegan: '#2ECC71',
  jain: '#E67E22',
  halal: '#2980B9',
  gluten_free: '#F39C12',
  allergies: '#E74C3C',
};

export const GuestsTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'seating' | 'invitations'>('list');
  const csvInputRef = React.useRef<HTMLInputElement | null>(null);

  // Add Guest Modal
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    groupSide: 'general' as Guest['groupSide'],
    plusOnes: 0,
    dietaryNeeds: 'standard' as Guest['dietaryNeeds'],
    dietaryNotes: '',
    accessibilityNeeds: '',
    tableAssignment: 'Table 1',
  });


  // AI Invitation generator state
  const [invitationTones, setInvitationTones] = useState<any>(null);
  const [isGeneratingWording, setIsGeneratingWording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Guest stats
  const confirmedCount = event.guests.filter((g) => g.rsvpStatus === 'confirmed').length;
  const pendingCount = event.guests.filter((g) => g.rsvpStatus === 'pending').length;
  const declinedCount = event.guests.filter((g) => g.rsvpStatus === 'declined').length;
  const totalAttendeesConfirmed = event.guests
    .filter((g) => g.rsvpStatus === 'confirmed')
    .reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

  // Dietary breakdown data
  const dietaryCounts = event.guests.reduce((acc: Record<string, number>, g) => {
    acc[g.dietaryNeeds] = (acc[g.dietaryNeeds] || 0) + 1 + (g.plusOnes || 0);
    return acc;
  }, {});

  const dietaryChartData = Object.entries(dietaryCounts).map(([k, v]) => ({
    name: k.replace('_', ' ').toUpperCase(),
    value: v,
    color: DIETARY_COLORS[k] || '#4B2A7B',
  }));

  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const token = `rsvp_${Math.random().toString(36).substring(2, 9)}`;
    const newGuest: Guest = {
      id: `gst_${Date.now()}`,
      name: guestForm.name,
      email: guestForm.email,
      phone: guestForm.phone,
      groupSide: guestForm.groupSide,
      plusOnes: guestForm.plusOnes,
      dietaryNeeds: guestForm.dietaryNeeds,
      dietaryNotes: guestForm.dietaryNotes,
      accessibilityNeeds: guestForm.accessibilityNeeds,
      tableAssignment: guestForm.tableAssignment,
      invitationStatus: 'unsent',
      rsvpStatus: 'pending',
      rsvpToken: token,
    };

    upsertEvent({ ...event, guests: [newGuest, ...event.guests] });
    setIsAddGuestModalOpen(false);
    showToast({ type: 'success', title: 'Guest Added', description: `${guestForm.name} invited.` });
  };

  const handleDeleteGuest = (guestId: string) => {
    const updated = event.guests.filter((g) => g.id !== guestId);
    upsertEvent({ ...event, guests: updated });
    showToast({ type: 'info', title: 'Guest Removed' });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Group', 'Plus Ones', 'Dietary', 'Table', 'RSVP Status'];
    const rows = event.guests.map((g) => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.phone || ''}"`,
      `"${g.email || ''}"`,
      g.groupSide,
      g.plusOnes,
      g.dietaryNeeds,
      `"${g.tableAssignment || ''}"`,
      g.rsvpStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${event.details.title}_Guests.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (eventReader) => {
      try {
        const text = (eventReader.target?.result as string) || '';
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 2) {
          showToast({ type: 'warning', title: 'Empty CSV', description: 'No guest records found in file.' });
          return;
        }

        const parseCsvLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headerLine = parseCsvLine(lines[0]);
        const headerLower = headerLine.map((h) => h.toLowerCase());

        const nameIdx = headerLower.findIndex((h) => h.includes('name'));
        const phoneIdx = headerLower.findIndex((h) => h.includes('phone') || h.includes('mobile'));
        const emailIdx = headerLower.findIndex((h) => h.includes('email') || h.includes('mail'));
        const groupIdx = headerLower.findIndex((h) => h.includes('group') || h.includes('side'));
        const plusOnesIdx = headerLower.findIndex((h) => h.includes('plus') || h.includes('count'));
        const dietaryIdx = headerLower.findIndex((h) => h.includes('diet') || h.includes('food'));
        const tableIdx = headerLower.findIndex((h) => h.includes('table') || h.includes('seat'));

        const prevGuests = [...event.guests];
        const newGuests: Guest[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = parseCsvLine(lines[i]);
          const rawName = nameIdx !== -1 ? row[nameIdx] : row[0];
          if (!rawName) continue;

          const rawGroup = (groupIdx !== -1 ? row[groupIdx] : 'general').toLowerCase();
          const validGroup: Guest['groupSide'] = ['bride', 'groom', 'colleagues', 'college', 'general'].includes(rawGroup)
            ? (rawGroup as Guest['groupSide'])
            : 'general';

          const rawDiet = (dietaryIdx !== -1 ? row[dietaryIdx] : 'standard').toLowerCase();
          const validDiet: Guest['dietaryNeeds'] = ['standard', 'vegetarian', 'vegan', 'jain', 'halal', 'gluten_free', 'allergies'].includes(rawDiet)
            ? (rawDiet as Guest['dietaryNeeds'])
            : 'standard';

          const plusOnes = plusOnesIdx !== -1 ? parseInt(row[plusOnesIdx], 10) || 0 : 0;
          const token = `rsvp_${Math.random().toString(36).substring(2, 9)}`;

          newGuests.push({
            id: `gst_imp_${Date.now()}_${i}`,
            name: rawName,
            phone: phoneIdx !== -1 ? row[phoneIdx] : '',
            email: emailIdx !== -1 ? row[emailIdx] : '',
            groupSide: validGroup,
            plusOnes: Math.max(0, plusOnes),
            dietaryNeeds: validDiet,
            dietaryNotes: '',
            tableAssignment: tableIdx !== -1 && row[tableIdx] ? row[tableIdx] : 'Table 1',
            invitationStatus: 'unsent',
            rsvpStatus: 'pending',
            rsvpToken: token,
          });
        }

        if (newGuests.length === 0) {
          showToast({ type: 'warning', title: 'No Valid Guests', description: 'Could not extract valid rows.' });
          return;
        }

        const combined = [...newGuests, ...event.guests];
        upsertEvent({ ...event, guests: combined });
        showToast({
          type: 'success',
          title: 'CSV Import Completed',
          description: `Imported ${newGuests.length} guests successfully.`,
          onUndo: () => {
            upsertEvent({ ...event, guests: prevGuests });
            showToast({ type: 'info', title: 'Import Undone' });
          },
        });
      } catch (err: any) {
        showToast({ type: 'error', title: 'Import Error', description: err.message || 'Failed to parse CSV' });
      } finally {
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateWording = async () => {
    setIsGeneratingWording(true);
    try {
      const data = await apiGenerateInvitations({
        eventTitle: event.details.title,
        eventType: event.details.type,
        date: event.details.date,
        city: event.details.city,
        venueName: event.details.venueName,
        regionalLanguage: selectedLanguage,
      });
      setInvitationTones(data);
      showToast({ type: 'success', title: 'Invitations Generated in 4 Tones' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Generation Failed', description: err.message });
    } finally {
      setIsGeneratingWording(false);
    }
  };

  const copyRSVPLink = (guest: Guest) => {
    const url = `${window.location.origin}/rsvp/${guest.rsvpToken}`;
    navigator.clipboard?.writeText(url);
    showToast({
      type: 'success',
      title: 'Personal RSVP Link Copied',
      description: `Copied dedicated guest link for ${guest.name}.`,
    });
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
            Guest List, RSVP & Seating
          </h2>
          <p className="text-xs text-[#5C5765]">
            Manage attendance, dietary requirements, table arrangements, and AI invitation copy.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={csvInputRef}
            onChange={handleImportCSVFile}
            accept=".csv,text/csv"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => csvInputRef.current?.click()}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddGuestModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Guest
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Total Confirmed Attendees</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {totalAttendeesConfirmed}
          </p>
          <span className="text-[11px] text-[#5C5765]">Including plus-ones</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Confirmed Invites</span>
          <p className="text-2xl font-bold font-mono text-[#1E1B24] tabular-nums">{confirmedCount}</p>
          <span className="text-[11px] text-[#5C5765]">Lead guest confirmations</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Awaiting Response</span>
          <p className="text-2xl font-bold font-mono text-amber-600 tabular-nums">{pendingCount}</p>
          <span className="text-[11px] text-[#5C5765]">Pending RSVP verification</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Declined</span>
          <p className="text-2xl font-bold font-mono text-[#5C5765] tabular-nums">{declinedCount}</p>
          <span className="text-[11px] text-[#5C5765]">Politely unavailable</span>
        </Card>
      </div>

      {/* Sub Tabs: List, Seating Planner, AI Invitations */}
      <div className="flex items-center gap-2 border-b border-[#4B2A7B]/10 pb-2">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === 'list' ? 'bg-[#4B2A7B] text-white' : 'text-[#5C5765] hover:bg-[#F3EEF8]'
          }`}
        >
          Guest Directory ({event.guests.length})
        </button>
        <button
          onClick={() => setActiveSubTab('seating')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === 'seating' ? 'bg-[#4B2A7B] text-white' : 'text-[#5C5765] hover:bg-[#F3EEF8]'
          }`}
        >
          Table Seating Planner
        </button>
        <button
          onClick={() => setActiveSubTab('invitations')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === 'invitations' ? 'bg-[#4B2A7B] text-white' : 'text-[#5C5765] hover:bg-[#F3EEF8]'
          }`}
        >
          AI Invitation Copy & WhatsApp
        </button>
      </div>

      {/* 1. Guest Directory List */}
      {activeSubTab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EEF8] text-[#5C5765] uppercase font-semibold text-[10px] tracking-wider border-b border-[#4B2A7B]/10">
                    <tr>
                      <th className="py-3 px-4">Guest Name</th>
                      <th className="py-3 px-4">Group</th>
                      <th className="py-3 px-4 text-center">+Ones</th>
                      <th className="py-3 px-4">Dietary</th>
                      <th className="py-3 px-4">Table</th>
                      <th className="py-3 px-4 text-center">RSVP</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4B2A7B]/8">
                    {event.guests.map((g) => (
                      <tr key={g.id} className="hover:bg-[#F3EEF8]/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#1E1B24] block">{g.name}</span>
                          <span className="text-[11px] text-[#5C5765]">{g.email || g.phone || 'No direct contact'}</span>
                        </td>
                        <td className="py-3 px-4 text-[#5C5765] capitalize">{g.groupSide}</td>
                        <td className="py-3 px-4 text-center font-mono font-medium">{g.plusOnes}</td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral" size="sm">
                            {g.dietaryNeeds.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-[#5C5765]">{g.tableAssignment || 'Unassigned'}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              g.rsvpStatus === 'confirmed'
                                ? 'success'
                                : g.rsvpStatus === 'pending'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {g.rsvpStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => copyRSVPLink(g)}
                              className="p-1 rounded text-[#4B2A7B] hover:bg-[#F3EEF8] cursor-pointer"
                              title="Copy personal RSVP link"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(g.id)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Remove guest"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Dietary Breakdown Chart Card */}
          <div className="lg:col-span-4 space-y-4">
            <Card variant="default" padding="md" className="space-y-4">
              <h3 className="text-sm font-bold font-serif text-[#1E1B24]">Dietary Breakdown</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dietaryChartData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                      {dietaryChartData.map((entry, index) => (
                        <Cell key={`dietary-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#4B2A7B]/10 text-xs">
                {dietaryChartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#5C5765]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-mono font-semibold tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. Interactive Drag-and-Drop Floorplan Seating Planner & Dietary Tracker */}
      {activeSubTab === 'seating' && (
        <FloorplanSeatingPlanner
          event={event}
          onUpdateEvent={(upd) => upsertEvent(upd)}
        />
      )}

      {/* 3. AI Invitation Copy & WhatsApp Sharing */}
      {activeSubTab === 'invitations' && (
        <Card variant="highlight" padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold font-serif text-[#1E1B24]">
                AI-Generated Invitation Copy
              </h3>
              <p className="text-xs text-[#5C5765]">
                Generate bespoke invitation wording across multiple tones with instant WhatsApp deep links.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl bg-white border border-[#4B2A7B]/20"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
              </select>

              <Button
                variant="accent"
                size="sm"
                onClick={handleGenerateWording}
                isLoading={isGeneratingWording}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate Tones
              </Button>
            </div>
          </div>

          {invitationTones ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Formal & Regal', text: invitationTones.formal },
                { title: 'Warm & Casual', text: invitationTones.casual },
                { title: 'Playful & Joyful', text: invitationTones.playful },
                { title: 'Ceremonial / Traditional', text: invitationTones.traditional },
              ].map((tone) => (
                <div key={tone.title} className="p-4 rounded-xl border border-[#4B2A7B]/15 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4B2A7B] uppercase">{tone.title}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(tone.text);
                        showToast({ type: 'success', title: 'Copied to Clipboard' });
                      }}
                      className="p-1 rounded text-[#5C5765] hover:text-[#4B2A7B] cursor-pointer"
                      title="Copy text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#1E1B24] leading-relaxed italic">"{tone.text}"</p>
                </div>
              ))}

              {/* Regional Translation */}
              {invitationTones.regionalTranslation && (
                <div className="p-4 rounded-xl border border-[#4B2A7B]/15 bg-white space-y-2 md:col-span-2">
                  <span className="text-xs font-bold text-[#FF7A6B] uppercase">
                    {invitationTones.regionalTranslation.language} Translation
                  </span>
                  <p className="text-xs text-[#1E1B24] leading-relaxed font-serif">
                    "{invitationTones.regionalTranslation.text}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#5C5765] border border-dashed rounded-xl">
              Click "Generate Tones" to create customized copy in Formal, Casual, Playful, and Traditional voices.
            </div>
          )}
        </Card>
      )}

      {/* Add Guest Modal */}
      <Modal
        isOpen={isAddGuestModalOpen}
        onClose={() => setIsAddGuestModalOpen(false)}
        title="Add Guest to Directory"
      >
        <form onSubmit={handleSaveGuest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Guest Name *</label>
            <input
              type="text"
              required
              value={guestForm.name}
              onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
              placeholder="e.g. S. Ramachandran"
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Email</label>
              <input
                type="email"
                value={guestForm.email}
                onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                placeholder="guest@example.com"
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Phone (WhatsApp)</label>
              <input
                type="text"
                value={guestForm.phone}
                onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                placeholder="+91 98400 00000"
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Group / Affiliation</label>
              <select
                value={guestForm.groupSide}
                onChange={(e) => setGuestForm({ ...guestForm, groupSide: e.target.value as any })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl capitalize"
              >
                <option value="general">General</option>
                <option value="bride">Bride's Side</option>
                <option value="groom">Groom's Side</option>
                <option value="vip">VIP</option>
                <option value="student">Student / Delegate</option>
                <option value="faculty">Faculty / Corporate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Plus Ones</label>
              <input
                type="number"
                min={0}
                max={10}
                value={guestForm.plusOnes}
                onChange={(e) => setGuestForm({ ...guestForm, plusOnes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Dietary Requirement</label>
            <select
              value={guestForm.dietaryNeeds}
              onChange={(e) => setGuestForm({ ...guestForm, dietaryNeeds: e.target.value as any })}
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl capitalize"
            >
              <option value="standard">Standard / Omnivore</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="jain">Jain (No root veg, garlic, onion)</option>
              <option value="halal">Halal</option>
              <option value="gluten_free">Gluten-Free</option>
              <option value="allergies">Special Allergies</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddGuestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Guest
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
