import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { getCurrentUser, getStoredEvents, upsertEvent } from '../lib/storage';
import { Collaborator } from '../types';
import {
  Users,
  Shield,
  CreditCard,
  Download,
  Moon,
  Sun,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const user = getCurrentUser();
  const events = getStoredEvents();

  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorName, setCollaboratorName] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState<'editor' | 'viewer'>('editor');
  const [currencyPref, setCurrencyPref] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');
  const [darkMode, setDarkMode] = useState(false);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'collab_1',
      name: 'Meera (Sister / Maid of Honor)',
      email: 'meera.s@gmail.com',
      role: 'editor',
      addedAt: '2026-09-01',
    },
    {
      id: 'collab_2',
      name: 'Uncle Sundaram (Financial Overseer)',
      email: 'sundaram.c@family.com',
      role: 'viewer',
      addedAt: '2026-09-10',
    },
  ]);

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratorEmail || !collaboratorName) return;

    const newCollab: Collaborator = {
      id: `collab_${Date.now()}`,
      name: collaboratorName,
      email: collaboratorEmail,
      role: collaboratorRole,
      addedAt: new Date().toISOString(),
    };

    setCollaborators([...collaborators, newCollab]);
    setCollaboratorEmail('');
    setCollaboratorName('');
    showToast({
      type: 'success',
      title: 'Invitation Dispatched',
      description: `Invited ${collaboratorName} as ${collaboratorRole}.`,
    });
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== id));
    showToast({ type: 'info', title: 'Collaborator Removed' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1E1B24]">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-[#5C5765]">
          Manage collaboration roles, multi-currency preferences, offline PWA access, and workspace settings.
        </p>
      </div>

      {/* 1. Collaboration & Access Control (RBAC) */}
      <Card variant="default" padding="lg" className="space-y-6">
        <div className="flex items-start justify-between border-b border-[#4B2A7B]/10 pb-4">
          <div>
            <h3 className="text-lg font-bold font-serif text-[#1E1B24] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4B2A7B]" />
              Co-Planner Collaboration (RBAC)
            </h3>
            <p className="text-xs text-[#5C5765]">
              Invite family members, co-convenors, or finance leads with granular roles.
            </p>
          </div>
          <Badge variant="purple" size="sm">
            Firestore Rule Enforced
          </Badge>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleAddCollaborator} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1">Name</label>
            <input
              type="text"
              required
              value={collaboratorName}
              onChange={(e) => setCollaboratorName(e.target.value)}
              placeholder="e.g. Suresh Kumar"
              className="w-full px-3 py-2 text-xs bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1">Email</label>
            <input
              type="email"
              required
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
              placeholder="suresh@example.com"
              className="w-full px-3 py-2 text-xs bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1">Role</label>
            <select
              value={collaboratorRole}
              onChange={(e) => setCollaboratorRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <Button type="submit" variant="primary" size="sm" className="w-full">
              Invite
            </Button>
          </div>
        </form>

        {/* Existing Collaborators List */}
        <div className="space-y-2 pt-2">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[#4B2A7B]/10 bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F3EEF8] text-[#4B2A7B] font-bold text-xs flex items-center justify-center">
                  {c.name.slice(0, 1)}
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#1E1B24] block">{c.name}</span>
                  <span className="text-[11px] text-[#5C5765]">{c.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={c.role === 'editor' ? 'purple' : 'neutral'} size="sm">
                  {c.role.toUpperCase()}
                </Badge>
                <button
                  onClick={() => handleRemoveCollaborator(c.id)}
                  className="p-1.5 text-[#5C5765] hover:text-rose-600 rounded-lg cursor-pointer"
                  title="Remove collaborator"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Currency & Formatting Preferences */}
      <Card variant="default" padding="lg" className="space-y-4">
        <div>
          <h3 className="text-lg font-bold font-serif text-[#1E1B24] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#4B2A7B]" />
            Default Currency & Formatting
          </h3>
          <p className="text-xs text-[#5C5765]">
            Set default currency. INR uses standard Indian Lakh/Crore numbering (e.g. ₹5,00,000).
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: 'INR', label: 'INR (₹ - Lakhs/Crores)' },
            { code: 'USD', label: 'USD ($ - US Dollar)' },
            { code: 'EUR', label: 'EUR (€ - Euro)' },
            { code: 'GBP', label: 'GBP (£ - British Pound)' },
          ].map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrencyPref(c.code as any);
                showToast({ type: 'success', title: `Currency Set to ${c.code}` });
              }}
              className={`p-3 rounded-xl border text-xs text-left font-semibold transition-colors cursor-pointer ${
                currencyPref === c.code
                  ? 'bg-[#4B2A7B] text-white border-[#4B2A7B]'
                  : 'bg-[#F3EEF8]/40 border-[#4B2A7B]/15 text-[#1E1B24] hover:bg-[#F3EEF8]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 3. Progressive Web App (PWA) Offline Cache */}
      <Card variant="default" padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-serif text-[#1E1B24] flex items-center gap-2">
              <Download className="w-4 h-4 text-[#4B2A7B]" />
              Offline Capability & PWA Cache
            </h3>
            <p className="text-xs text-[#5C5765]">
              Enables Event Day Mode to run smoothly even inside banquet halls with weak network connectivity.
            </p>
          </div>
          <Badge variant="success" size="sm">
            Active
          </Badge>
        </div>
      </Card>
    </div>
  );
};
