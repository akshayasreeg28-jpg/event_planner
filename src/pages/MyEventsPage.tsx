import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventsList, useSeedSampleEvents } from '../features/events/useEventData';
import { deleteEventById, upsertEvent, resetDemoEvents } from '../lib/storage';
import { deleteEventFromFirestore } from '../services/firestoreService';
import { EventFull } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { CardSkeleton } from '../components/ui/Skeleton';
import { formatMinorToCurrency, getDaysRemaining, formatDateDisplay } from '../lib/formatters';
import { Plus, Search, Trash2, ArrowRight, RefreshCw, Calendar, Share2, Sparkles, CloudDownload } from 'lucide-react';
import { SocialShareModal } from '../features/sharing/SocialShareModal';

export const MyEventsPage: React.FC = () => {
  const { data: events = [], isLoading } = useEventsList();
  const seedSampleEventsMutation = useSeedSampleEvents();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EventFull | null>(null);
  const [sharingEvent, setSharingEvent] = useState<EventFull | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const filteredEvents = events.filter((ev) => {
    const matchesType = filterType === 'all' || ev.details.type === filterType;
    const matchesSearch =
      ev.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.details.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    try {
      // 1. Delete from Firestore
      await deleteEventFromFirestore(target.details.id).catch(() => {});
      // 2. Delete from offline storage
      const deleted = deleteEventById(target.details.id);

      showToast({
        type: 'info',
        title: `Deleted "${target.details.title}"`,
        description: 'Event removed from workspace.',
        onUndo: () => {
          if (deleted) upsertEvent(deleted);
          showToast({ type: 'success', title: 'Deletion Undone', description: 'Event restored.' });
        },
      });
    } catch {
      showToast({ type: 'error', title: 'Deletion Failed' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1E1B24]">My Events</h1>
          <p className="text-xs sm:text-sm text-[#5C5765]">
            Manage your complete portfolio of planned celebrations and gatherings.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => seedSampleEventsMutation.mutate()}
            disabled={seedSampleEventsMutation.isPending}
            leftIcon={<CloudDownload className={`w-3.5 h-3.5 text-[#4B2A7B] ${seedSampleEventsMutation.isPending ? 'animate-bounce' : ''}`} />}
            className="border-[#4B2A7B]/20 text-[#4B2A7B] hover:bg-[#4B2A7B]/5"
          >
            {seedSampleEventsMutation.isPending ? 'Loading...' : 'Load Sample Events'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetDemoEvents();
              showToast({ type: 'success', title: 'Demo Data Restored' });
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#FF7A6B]" />}
          >
            Reset Demos
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/wizard')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Event
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Interactive Segmented Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F3EEF8]/80 rounded-xl overflow-x-auto no-scrollbar">
          {['all', 'wedding', 'college_fest', 'birthday', 'corporate', 'festival'].map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                filterType === ft
                  ? 'bg-white text-[#4B2A7B] shadow-xs font-semibold'
                  : 'text-[#5C5765] hover:text-[#1E1B24]'
              }`}
            >
              {ft === 'college_fest' ? 'College Fest' : ft}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#5C5765] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const completed = (ev.tasks || []).filter((t) => t.status === 'completed').length;
            const total = (ev.tasks || []).length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const remaining = getDaysRemaining(ev.details.date);

            return (
              <Card
                key={ev.details.id}
                variant="default"
                padding="none"
                hoverable
                className="overflow-hidden flex flex-col group cursor-pointer"
                onClick={() => navigate(`/events/${ev.details.id}`)}
              >
                <div
                  className="h-32 bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url(${
                      ev.details.coverImage ||
                      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80'
                    })`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs font-semibold text-xs text-[#4B2A7B]">
                      {ev.details.type}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-medium opacity-90">
                      {ev.details.city} • {formatDateDisplay(ev.details.date)}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#1E1B24] group-hover:text-[#4B2A7B] transition-colors line-clamp-1">
                      {ev.details.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#5C5765] mt-2">
                      <span>{ev.details.estimatedGuestCount} Guests</span>
                      <span>•</span>
                      <span>
                        {formatMinorToCurrency(ev.details.totalBudgetMinor, ev.details.currency)}
                      </span>
                      <span>•</span>
                      <span className={remaining.days < 14 ? 'text-amber-600 font-semibold' : ''}>
                        {remaining.days > 0 ? `${remaining.days}d left` : 'Today'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#5C5765]">
                      <span>Checklist Progress</span>
                      <span className="font-medium text-[#1E1B24]">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} color={progress === 100 ? 'green' : 'purple'} size="sm" />
                  </div>

                  <div className="pt-2 border-t border-[#4B2A7B]/10 flex items-center justify-between">
                    <span className="text-xs text-[#5C5765]">
                      {completed}/{total} tasks done
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingEvent(ev);
                        }}
                        className="p-1.5 rounded-lg text-[#5C5765] hover:text-[#4B2A7B] hover:bg-[#4B2A7B]/5 transition-colors cursor-pointer"
                        title="Share event link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(ev);
                        }}
                        className="p-1.5 rounded-lg text-[#5C5765] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${ev.details.id}`);
                        }}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Workspace
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="lg" className="text-center py-12 max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#4B2A7B]/10 text-[#4B2A7B] flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif text-[#1E1B24]">No events found</h3>
            <p className="text-xs text-[#5C5765] mt-1">
              Load our curated sample events into your personal Firestore workspace, or build a new celebration from scratch with the AI wizard.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedSampleEventsMutation.mutate()}
              disabled={seedSampleEventsMutation.isPending}
              leftIcon={<Sparkles className="w-4 h-4 text-[#FF7A6B]" />}
            >
              {seedSampleEventsMutation.isPending ? 'Importing...' : 'Load Sample Events'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/wizard')}>
              Create New Event
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Event?"
        message={`Are you sure you want to delete "${deleteTarget?.details.title}"? You will be able to undo this deletion from the toast notification.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Social Media Sharing Modal */}
      {sharingEvent && (
        <SocialShareModal
          isOpen={!!sharingEvent}
          onClose={() => setSharingEvent(null)}
          event={sharingEvent}
        />
      )}
    </div>
  );
};
