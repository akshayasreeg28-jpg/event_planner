import React, { useState, useEffect } from 'react';
import { EventFull, RunOfShowItem, IssueLogItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { upsertEvent } from '../../lib/storage';
import { formatTimeDisplay } from '../../lib/formatters';
import {
  Clock,
  Phone,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Plus,
  Shield,
  Radio,
  Sparkles,
  LifeBuoy,
  Wifi,
  WifiOff,
  PhoneCall,
} from 'lucide-react';

export const EventDayTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSpeedDialModalOpen, setIsSpeedDialModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [runOfShow, setRunOfShow] = useState<RunOfShowItem[]>(
    event.runOfShow.length > 0
      ? event.runOfShow
      : [
          {
            id: 'ros_1',
            time: '08:00',
            durationMinutes: 90,
            title: 'Morning Setup & Stage Sound Check',
            owner: 'Technical Director',
            vendorContact: { vendorName: 'Stage AV Pros', phone: '+91 98401 11222' },
            notes: 'Verify microphone frequencies and line array equalizer.',
            completed: false,
          },
          {
            id: 'ros_2',
            time: '10:00',
            durationMinutes: 60,
            title: 'Guest Welcome Refreshments in Foyer',
            owner: 'Hospitality Lead',
            vendorContact: { vendorName: 'Catering Team', phone: '+91 94440 33444' },
            notes: 'Cold towels and welcome kokum drinks ready.',
            completed: false,
          },
          {
            id: 'ros_3',
            time: '11:00',
            durationMinutes: 120,
            title: 'Main Ceremony / Keynote Session',
            owner: 'Master of Ceremonies',
            notes: 'Lighting cue at start. Live video streaming active.',
            completed: false,
          },
        ]
  );

  const [issues, setIssues] = useState<IssueLogItem[]>(event.issues || []);
  const [isLogIssueModalOpen, setIsLogIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    description: '',
    severity: 'medium' as IssueLogItem['severity'],
    reportedBy: 'Coordinator',
  });

  // Identify "What's Next" live highlight
  const nextItem = runOfShow.find((i) => !i.completed) || runOfShow[0];

  const handleToggleComplete = (itemId: string) => {
    const updated = runOfShow.map((i) =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    );
    setRunOfShow(updated);
    upsertEvent({ ...event, runOfShow: updated });
    showToast({ type: 'success', title: 'Schedule Updated' });
  };

  const handleLogIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const newIssue: IssueLogItem = {
      id: `iss_${Date.now()}`,
      timestamp: new Date().toISOString(),
      reportedBy: issueForm.reportedBy,
      description: issueForm.description,
      severity: issueForm.severity,
      status: 'open',
    };
    const updated = [newIssue, ...issues];
    setIssues(updated);
    upsertEvent({ ...event, issues: updated });
    setIsLogIssueModalOpen(false);
    showToast({
      type: 'warning',
      title: 'Incident Logged',
      description: `Recorded issue with ${issueForm.severity} severity.`,
    });
  };

  const handleResolveIssue = (issueId: string) => {
    const updated = issues.map((i) =>
      i.id === issueId ? { ...i, status: 'resolved' as const } : i
    );
    setIssues(updated);
    upsertEvent({ ...event, issues: updated });
    showToast({ type: 'success', title: 'Issue Resolved' });
  };

  return (
    <div className="space-y-6">
      {/* Top Event Day Live Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#4B2A7B]/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4B2A7B] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
            <Clock className="w-5 h-5 text-[#FF7A6B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E1B24] uppercase tracking-wider">
                Event Day Command Center
              </span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-[#F3EEF8] text-[#4B2A7B]">
                {currentTime}
              </span>
            </div>
            <p className="text-[11px] text-[#5C5765]">
              Real-time schedule progression, vendor check-ins, and emergency actions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant={isOnline ? 'success' : 'warning'} size="sm">
            {isOnline ? (
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Live Sync
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline PWA Mode
              </span>
            )}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSpeedDialModalOpen(true)}
            leftIcon={<PhoneCall className="w-4 h-4 text-rose-600" />}
          >
            Emergency Speed-Dial
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsLogIssueModalOpen(true)}
            leftIcon={<AlertTriangle className="w-4 h-4" />}
          >
            Log Incident
          </Button>
        </div>
      </div>

      {/* Live "What's Next" Banner */}
      {nextItem && (
        <Card variant="highlight" padding="lg" className="border-[#4B2A7B]/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A6B] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF7A6B]"></span>
                </span>
                <span className="text-xs font-bold text-[#FF7A6B] uppercase tracking-wider">
                  Live Event Milestone: What's Next
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
                {nextItem.title}
              </h2>

              <p className="text-xs text-[#5C5765]">
                Target Time: <strong className="text-[#4B2A7B] font-mono">{nextItem.time}</strong> ({nextItem.durationMinutes} mins) · Lead: <strong>{nextItem.owner}</strong>
              </p>
              {nextItem.notes && <p className="text-xs italic text-[#5C5765]">"{nextItem.notes}"</p>}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {nextItem.vendorContact?.phone && (
                <a
                  href={`tel:${nextItem.vendorContact.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" /> Call {nextItem.vendorContact.vendorName}
                </a>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleToggleComplete(nextItem.id)}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Mark Complete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Run-of-Show Schedule & Incident Response Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Run-of-Show Mobile-First List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-serif text-[#1E1B24]">Run-of-Show Schedule</h3>
            <span className="text-xs text-[#5C5765]">
              {runOfShow.filter((i) => i.completed).length} of {runOfShow.length} milestones complete
            </span>
          </div>

          <div className="space-y-3">
            {runOfShow.map((item) => (
              <Card
                key={item.id}
                variant="default"
                padding="md"
                className={`transition-colors ${
                  item.completed ? 'bg-emerald-50/40 opacity-70' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(item.id)}
                      className="mt-1 text-[#4B2A7B] hover:scale-110 transition-transform cursor-pointer shrink-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#5C5765]" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#4B2A7B] bg-[#F3EEF8] px-2 py-0.5 rounded">
                          {item.time}
                        </span>
                        <span className="text-xs text-[#5C5765]">{item.durationMinutes} min</span>
                      </div>
                      <h4 className={`text-sm font-bold ${item.completed ? 'line-through text-[#5C5765]' : 'text-[#1E1B24]'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#5C5765]">Owner: {item.owner}</p>
                      {item.notes && <p className="text-[11px] text-[#5C5765] italic">Note: {item.notes}</p>}
                    </div>
                  </div>

                  {item.vendorContact?.phone && (
                    <a
                      href={`tel:${item.vendorContact.phone}`}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
                      title={`Call ${item.vendorContact.vendorName}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Issue Log & Emergency Contacts */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#4B2A7B]/10 pb-2">
              <h3 className="text-sm font-bold font-serif text-[#1E1B24] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Live Incident Log
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLogIssueModalOpen(true)}
                leftIcon={<Plus className="w-3 h-3" />}
              >
                Log Issue
              </Button>
            </div>

            {issues.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {issues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-3 rounded-xl border border-[#4B2A7B]/10 bg-white space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={iss.severity === 'critical' || iss.severity === 'high' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {iss.severity}
                      </Badge>
                      <span className="text-[10px] text-[#5C5765]">
                        {new Date(iss.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#1E1B24]">{iss.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#5C5765]">By {iss.reportedBy}</span>
                      {iss.status === 'open' ? (
                        <button
                          onClick={() => handleResolveIssue(iss.id)}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#5C5765] text-center py-4">
                No active incidents recorded. Systems nominal.
              </p>
            )}
          </Card>

          {/* Emergency Protocols Card */}
          <Card variant="default" padding="md" className="space-y-2 bg-[#FFFDF9]">
            <h4 className="text-xs font-bold text-[#4B2A7B] uppercase flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#FF7A6B]" />
              Emergency Standby Protocols
            </h4>
            <ul className="text-xs text-[#5C5765] space-y-1 list-disc pl-4 leading-relaxed">
              <li>Secondary DG Generator (125 kVA) key holder: Chief Venue Engineer.</li>
              <li>Medical First-Aid Kit positioned at Foyer Hospitality Desk.</li>
              <li>Rain contingency: Lawn electricals covered with waterproof rubber tarp.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Log Issue Modal */}
      <Modal isOpen={isLogIssueModalOpen} onClose={() => setIsLogIssueModalOpen(false)} title="Log Event Day Incident">
        <form onSubmit={handleLogIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Incident Description *</label>
            <textarea
              rows={3}
              required
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              placeholder="e.g. Lawn microphone feedback, ice shortage at beverage counter..."
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Severity</label>
              <select
                value={issueForm.severity}
                onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value as any })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              >
                <option value="low">Low (Cosmetic)</option>
                <option value="medium">Medium (Requires Attention)</option>
                <option value="high">High (Urgent)</option>
                <option value="critical">Critical (Event Blocked)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Reported By</label>
              <input
                type="text"
                value={issueForm.reportedBy}
                onChange={(e) => setIssueForm({ ...issueForm, reportedBy: e.target.value })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsLogIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit">
              Log Incident
            </Button>
          </div>
        </form>
      </Modal>

      {/* Emergency Speed-Dial Modal */}
      <Modal
        isOpen={isSpeedDialModalOpen}
        onClose={() => setIsSpeedDialModalOpen(false)}
        title="Event Day Emergency & Key Logistics Contacts"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#5C5765]">
            One-touch telephone dialing for immediate emergency response or critical vendor escalation.
          </p>

          <div className="space-y-2">
            {[
              { role: 'Emergency Services (Police / Medical)', name: 'National Emergency Line', phone: '112', type: 'critical' },
              { role: 'Ambulance & Paramedic On-Call', name: 'Emergency Medical Service', phone: '108', type: 'critical' },
              { role: 'Fire & Rescue Services', name: 'Fire Station Command', phone: '101', type: 'critical' },
              { role: 'Chief Venue Safety & DG Engineer', name: 'Venue Duty Manager', phone: '+91 98400 11999', type: 'logistics' },
              { role: 'Lead Audio/Visual & Stage Rig Lead', name: 'AV Technical Director', phone: '+91 94440 22333', type: 'logistics' },
              { role: 'Head Catering & Hospitality Director', name: 'Banquet Food Lead', phone: '+91 97910 88777', type: 'logistics' },
            ].map((contact, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-[#4B2A7B]/10 bg-[#FFFDF9] hover:bg-[#F3EEF8]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E1B24]">{contact.name}</span>
                    <Badge variant={contact.type === 'critical' ? 'error' : 'purple'} size="sm">
                      {contact.role}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-[#5C5765] block mt-0.5">
                    {contact.phone}
                  </span>
                </div>

                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsSpeedDialModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
