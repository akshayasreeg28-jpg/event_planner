import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { EventFull, Vendor, VendorQuote } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { upsertEvent } from '../../lib/storage';
import { formatMinorToCurrency, parseCurrencyInputToMinor } from '../../lib/formatters';
import { calculateGamification, SUSTAINABLE_PRACTICE_OPTIONS } from '../../lib/gamification';
import { checkCategoryBudgetOverrun } from '../../lib/budgetAlerts';
import { GamificationModal } from '../gamification/GamificationModal';
import { EcoRibbonRosette } from '../gamification/EcoRibbonRosette';
import {
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Clock,
  Plus,
  HelpCircle,
  Award,
  Trash2,
  Edit,
  ExternalLink,
  Leaf,
  Sparkles,
  Check,
} from 'lucide-react';

export const VendorsTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');

  // Add/Edit Vendor modal
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'Catering',
    contactPerson: '',
    phone: '',
    email: '',
    estimatedCostInput: '150000',
    bookingStatus: 'contacted' as Vendor['bookingStatus'],
    requirements: '',
    questionsToAsk: '',
    isSustainable: false,
    sustainabilityPractices: [] as string[],
  });

  // Add Quote modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    vendorName: '',
    contactPerson: '',
    phone: '',
    email: '',
    quotedAmountInput: '120000',
    packageDetails: '',
    rating: 4.8,
  });

  const gamification = calculateGamification(event);

  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: '',
      category: event.budgetAllocations[0]?.category || 'General',
      contactPerson: '',
      phone: '',
      email: '',
      estimatedCostInput: '100000',
      bookingStatus: 'not_contacted',
      requirements: 'Power backup, on-time setup 2 hours prior',
      questionsToAsk: 'What is your cancellation policy? Do you bring staff uniforms?',
      isSustainable: false,
      sustainabilityPractices: [],
    });
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      category: vendor.category,
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      estimatedCostInput: (vendor.estimatedCostMinor / 100).toString(),
      bookingStatus: vendor.bookingStatus,
      requirements: (vendor.requirements || []).join('\n'),
      questionsToAsk: (vendor.questionsToAsk || []).join('\n'),
      isSustainable: Boolean(vendor.isSustainable),
      sustainabilityPractices: vendor.sustainabilityPractices || [],
    });
    setIsVendorModalOpen(true);
  };

  const handleToggleSustainable = (vendor: Vendor) => {
    const nextVal = !vendor.isSustainable;
    const defaultPractices = [
      'Biodegradable materials / zero single-use plastics',
      '100% locally sourced materials (<30km)',
    ];

    const updated = event.vendors.map((v) =>
      v.id === vendor.id
        ? {
            ...v,
            isSustainable: nextVal,
            sustainabilityPractices:
              nextVal && (!v.sustainabilityPractices || v.sustainabilityPractices.length === 0)
                ? defaultPractices
                : v.sustainabilityPractices,
          }
        : v
    );
    upsertEvent({ ...event, vendors: updated });

    if (nextVal) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#059669', '#34D399', '#F59E0B'],
      });
      showToast({
        type: 'success',
        title: '🌱 Eco-Friendly Vendor Tagged!',
        description: `${vendor.name} marked as sustainable (+40 XP towards Eco Ribbon).`,
      });
    } else {
      showToast({
        type: 'info',
        title: 'Sustainability Tag Cleared',
        description: `${vendor.name} untagged.`,
      });
    }
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const estMinor = parseCurrencyInputToMinor(vendorForm.estimatedCostInput);

    if (editingVendor) {
      const updated = event.vendors.map((v) =>
        v.id === editingVendor.id
          ? {
              ...v,
              name: vendorForm.name,
              category: vendorForm.category,
              contactPerson: vendorForm.contactPerson,
              phone: vendorForm.phone,
              email: vendorForm.email,
              estimatedCostMinor: estMinor,
              bookingStatus: vendorForm.bookingStatus,
              requirements: vendorForm.requirements.split('\n').filter((x) => x.trim()),
              questionsToAsk: vendorForm.questionsToAsk.split('\n').filter((x) => x.trim()),
              isSustainable: vendorForm.isSustainable,
              sustainabilityPractices: vendorForm.isSustainable
                ? vendorForm.sustainabilityPractices
                : [],
            }
          : v
      );
      upsertEvent({ ...event, vendors: updated });
    } else {
      const newV: Vendor = {
        id: `vnd_${Date.now()}`,
        name: vendorForm.name,
        category: vendorForm.category,
        contactPerson: vendorForm.contactPerson,
        phone: vendorForm.phone,
        email: vendorForm.email,
        estimatedCostMinor: estMinor,
        bookingStatus: vendorForm.bookingStatus,
        requirements: vendorForm.requirements.split('\n').filter((x) => x.trim()),
        questionsToAsk: vendorForm.questionsToAsk.split('\n').filter((x) => x.trim()),
        quotes: [],
        linkedTasks: [],
        isSustainable: vendorForm.isSustainable,
        sustainabilityPractices: vendorForm.isSustainable
          ? vendorForm.sustainabilityPractices
          : [],
      };
      upsertEvent({ ...event, vendors: [...event.vendors, newV] });
    }
    setIsVendorModalOpen(false);

    // Real-time category budget overrun notification for vendor cost
    const overrunCheck = checkCategoryBudgetOverrun(vendorForm.category, estMinor, event);
    if (overrunCheck.isOverrun) {
      showToast({
        type: overrunCheck.severity === 'critical' ? 'error' : 'warning',
        title: overrunCheck.title,
        description: overrunCheck.description,
        duration: 7000,
      });
    } else {
      showToast({ type: 'success', title: 'Vendor Saved' });
    }
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    const quoteMinor = parseCurrencyInputToMinor(quoteForm.quotedAmountInput);

    const newQuote: VendorQuote = {
      id: `q_${Date.now()}`,
      vendorName: quoteForm.vendorName || selectedVendor.name,
      contactPerson: quoteForm.contactPerson,
      phone: quoteForm.phone,
      email: quoteForm.email,
      quotedAmountMinor: quoteMinor,
      packageDetails: quoteForm.packageDetails,
      rating: quoteForm.rating,
    };

    const updatedVendors = event.vendors.map((v) =>
      v.id === selectedVendor.id ? { ...v, quotes: [...(v.quotes || []), newQuote] } : v
    );
    upsertEvent({ ...event, vendors: updatedVendors });
    setSelectedVendor({ ...selectedVendor, quotes: [...(selectedVendor.quotes || []), newQuote] });
    setIsQuoteModalOpen(false);

    // Real-time budget overrun notification for quote
    const overrunCheck = checkCategoryBudgetOverrun(selectedVendor.category, quoteMinor, event);
    if (overrunCheck.isOverrun) {
      showToast({
        type: overrunCheck.severity === 'critical' ? 'error' : 'warning',
        title: overrunCheck.title,
        description: overrunCheck.description,
        duration: 7000,
      });
    } else {
      showToast({ type: 'success', title: 'Quote Added to Comparison' });
    }
  };

  const handleUpdateStatus = (vendor: Vendor, status: Vendor['bookingStatus']) => {
    const updated = event.vendors.map((v) => (v.id === vendor.id ? { ...v, bookingStatus: status } : v));
    upsertEvent({ ...event, vendors: updated });

    if (status === 'booked') {
      const overrunCheck = checkCategoryBudgetOverrun(vendor.category, vendor.estimatedCostMinor, event);
      if (overrunCheck.isOverrun) {
        showToast({
          type: overrunCheck.severity === 'critical' ? 'error' : 'warning',
          title: overrunCheck.title,
          description: overrunCheck.description,
          duration: 7000,
        });
        return;
      }
    }
    showToast({ type: 'info', title: `Status set to ${status.replace('_', ' ')}` });
  };

  const handlePracticeToggle = (practice: string) => {
    setVendorForm((prev) => {
      const exists = prev.sustainabilityPractices.includes(practice);
      return {
        ...prev,
        sustainabilityPractices: exists
          ? prev.sustainabilityPractices.filter((p) => p !== practice)
          : [...prev.sustainabilityPractices, practice],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
            Vendor Management & Quote Comparison
          </h2>
          <p className="text-xs text-[#5C5765]">
            Structured requirements, questions to ask, side-by-side quote evaluation, and linked task lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F3EEF8] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'grid' ? 'bg-white text-[#4B2A7B] shadow-xs' : 'text-[#5C5765] hover:text-[#1E1B24]'
              }`}
            >
              All Vendors
            </button>
            <button
              type="button"
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'comparison' ? 'bg-white text-[#4B2A7B] shadow-xs' : 'text-[#5C5765] hover:text-[#1E1B24]'
              }`}
            >
              Side-by-Side Quotes
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={handleOpenAddVendor} leftIcon={<Plus className="w-4 h-4" />}>
            Add Vendor Profile
          </Button>
        </div>
      </div>

      {/* Gamification Spotlight Banner: Eco-Champion Ribbon & Sourcing Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-[#2D184C] p-4 sm:p-5 text-white shadow-sm border border-emerald-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <EcoRibbonRosette tier={gamification.ecoRibbon.tier} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                  Eco-Champion Gamification
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  {gamification.ecoRibbon.title}
                </span>
              </div>
              <h3 className="text-base font-bold font-serif text-white">
                {gamification.stats.sustainableVendors} of {gamification.stats.totalVendors} Vendors Tagged Sustainable ({Math.round(gamification.stats.sustainabilityRatio * 100)}%)
              </h3>
              <p className="text-xs text-emerald-100/80">
                {gamification.stats.sustainableVendors === 0
                  ? 'Tag eco-friendly vendors below to unlock the Green Sourcing Pioneer badge (+80 XP)!'
                  : gamification.stats.sustainabilityRatio >= 0.5
                  ? '🎉 Green Sourcing Majority reached! Emerald Ribbon eligibility active.'
                  : 'Add more sustainable vendors to ascend to higher ribbon tiers and boost your eco score.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGamificationOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Inspect Badges & Ribbons
          </button>
        </div>
      </div>

      {/* Notice Banner: Anti-Hallucination Policy */}
      <div className="p-3.5 rounded-xl bg-[#F3EEF8]/80 border border-[#4B2A7B]/15 text-xs text-[#5C5765] flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-[#4B2A7B] shrink-0" />
        <span>
          <strong>Anti-Hallucination Policy:</strong> Event AI estimates are guidance benchmarks labeled "AI estimate". Contact details, actual quotations, and agreements are entered directly by you.
        </span>
      </div>

      {/* Side-by-Side Shortlist Quote Comparison View */}
      {viewMode === 'comparison' ? (
        <Card variant="default" padding="lg" className="space-y-4 border border-[var(--event-border)] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--event-border)] pb-3">
            <div>
              <h3 className="text-base font-bold font-serif text-[var(--app-text)]">
                Side-by-Side Vendor Quote Shortlist
              </h3>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Compare bids, packages, eco-practices, and ratings side-by-side to make confident hiring decisions.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#4B2A7B] bg-[#F3EEF8] px-3 py-1 rounded-lg">
              {event.vendors.reduce((sum, v) => sum + (v.quotes?.length || 0), 0)} Total Quotes Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Vendor / Bidder</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3 text-right">Quoted Price</th>
                  <th className="py-3 px-3">Package Scope & Inclusions</th>
                  <th className="py-3 px-3 text-center">Rating</th>
                  <th className="py-3 px-3 text-center">Eco-Friendly</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--event-border)]">
                {event.vendors.flatMap((vendor) => {
                  const quotes = vendor.quotes && vendor.quotes.length > 0
                    ? vendor.quotes
                    : [{
                        id: `v_est_${vendor.id}`,
                        vendorName: vendor.name,
                        contactPerson: vendor.contactPerson,
                        phone: vendor.phone,
                        email: vendor.email,
                        quotedAmountMinor: vendor.estimatedCostMinor,
                        packageDetails: 'AI Initial Guidance Estimate',
                        rating: 4.8,
                      }];

                  const lowestBid = Math.min(...quotes.map((q) => q.quotedAmountMinor));

                  return quotes.map((q) => {
                    const isLowest = q.quotedAmountMinor === lowestBid && quotes.length > 1;
                    return (
                      <tr key={q.id} className="hover:bg-[var(--app-surface-subtle)]/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A6B]">
                            {vendor.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[var(--app-text)]">
                          <div className="flex items-center gap-1.5">
                            <span>{q.vendorName}</span>
                            {isLowest && (
                              <Badge variant="success" size="sm" icon={<Award className="w-3 h-3" />}>
                                Best Value
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[var(--app-text-muted)]">
                          <div>{q.contactPerson || '—'}</div>
                          <div className="text-[10px] font-mono">{q.phone}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#4B2A7B]">
                          {formatMinorToCurrency(q.quotedAmountMinor, event.details.currency)}
                        </td>
                        <td className="py-3 px-3 text-[var(--app-text-muted)] max-w-xs truncate">
                          {q.packageDetails}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[var(--app-text)]">
                          ★ {q.rating || 4.8}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {vendor.isSustainable ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold inline-flex items-center gap-1">
                              <Leaf className="w-2.5 h-2.5" /> Eco
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--app-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant={vendor.bookingStatus === 'booked' ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => {
                              handleUpdateStatus(vendor, 'booked');
                              showToast({
                                type: 'success',
                                title: 'Vendor Booked!',
                                description: `Selected ${q.vendorName} for ${vendor.category}.`,
                              });
                            }}
                            className="text-xs"
                          >
                            {vendor.bookingStatus === 'booked' ? '✓ Booked' : 'Book Vendor'}
                          </Button>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Vendors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {event.vendors.map((vendor) => {
          return (
            <Card key={vendor.id} variant="default" padding="lg" className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#4B2A7B]/10 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF7A6B]">
                        {vendor.category}
                      </span>
                      {vendor.isSustainable && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Leaf className="w-2.5 h-2.5" /> Eco
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold font-serif text-[#1E1B24]">{vendor.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditVendor(vendor)}
                      title="Edit vendor"
                      className="p-1 rounded-lg text-[#5C5765] hover:text-[#4B2A7B] hover:bg-[#F3EEF8] transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <select
                      value={vendor.bookingStatus}
                      onChange={(e) => handleUpdateStatus(vendor, e.target.value as any)}
                      className="text-[11px] font-medium py-1 px-2 rounded-lg bg-[#F3EEF8] border border-[#4B2A7B]/15 text-[#4B2A7B] focus:outline-none cursor-pointer"
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="contacted">Contacted</option>
                      <option value="quote_received">Quote Received</option>
                      <option value="booked">Booked</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Benchmark Cost Badge */}
                <div className="p-2.5 rounded-xl bg-[#F3EEF8]/40 border border-[#4B2A7B]/10 flex items-center justify-between text-xs">
                  <span className="text-[#5C5765]">AI Estimate Benchmark:</span>
                  <span className="font-mono font-semibold text-[#4B2A7B]">
                    {formatMinorToCurrency(vendor.estimatedCostMinor, event.details.currency)}
                  </span>
                </div>

                {/* Interactive Sustainability Chip / Toggle */}
                <div className="p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1.5 bg-[#FFFDF9] border-emerald-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      Sustainability Status
                    </span>
                    <button
                      onClick={() => handleToggleSustainable(vendor)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        vendor.isSustainable
                          ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {vendor.isSustainable ? '✓ Eco-Certified (+40 XP)' : '+ Tag as Eco-Friendly'}
                    </button>
                  </div>

                  {vendor.isSustainable && vendor.sustainabilityPractices && vendor.sustainabilityPractices.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {vendor.sustainabilityPractices.map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 leading-tight"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact info entered by user */}
                <div className="space-y-1.5 text-xs text-[#5C5765]">
                  {vendor.contactPerson && (
                    <p className="font-medium text-[#1E1B24]">Contact: {vendor.contactPerson}</p>
                  )}
                  {vendor.phone ? (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="flex items-center gap-2 hover:text-[#4B2A7B] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{vendor.phone}</span>
                    </a>
                  ) : (
                    <p className="text-[11px] italic">No phone entered yet</p>
                  )}
                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-2 hover:text-[#4B2A7B] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#4B2A7B]" />
                      <span className="truncate">{vendor.email}</span>
                    </a>
                  )}
                </div>

                {/* Questions to Ask */}
                {vendor.questionsToAsk && vendor.questionsToAsk.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-[#1E1B24] block">Key Questions:</span>
                    <ul className="text-[11px] text-[#5C5765] space-y-1 list-disc pl-4">
                      {vendor.questionsToAsk.slice(0, 2).map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer Actions & Quotes count */}
              <div className="pt-3 border-t border-[#4B2A7B]/10 flex items-center justify-between">
                <span className="text-xs text-[#5C5765]">
                  {vendor.quotes?.length || 0} quotes compared
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedVendor(vendor)}
                >
                  View Quotes & Notes
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Quote Comparison Modal for Selected Vendor */}
      <Modal
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        title={`${selectedVendor?.category} — Quotes & Comparison`}
        maxWidth="xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5C5765]">
              Compare bids side-by-side to highlight best value for your criteria.
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsQuoteModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Quote
            </Button>
          </div>

          {selectedVendor?.quotes && selectedVendor.quotes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3EEF8] text-[#5C5765] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">Quoted Price</th>
                    <th className="py-2.5 px-3">Package Scope</th>
                    <th className="py-2.5 px-3 text-center">Value Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4B2A7B]/10">
                  {selectedVendor.quotes.map((q) => {
                    const isLowest =
                      q.quotedAmountMinor ===
                      Math.min(...selectedVendor.quotes.map((x) => x.quotedAmountMinor));

                    return (
                      <tr key={q.id} className="hover:bg-[#F3EEF8]/40">
                        <td className="py-3 px-3 font-semibold text-[#1E1B24]">
                          <div className="flex items-center gap-1.5">
                            <span>{q.vendorName}</span>
                            {isLowest && (
                              <Badge variant="success" size="sm" icon={<Award className="w-3 h-3" />}>
                                Best Value
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#5C5765]">
                          <div>{q.contactPerson || '—'}</div>
                          <div className="text-[10px]">{q.phone}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#4B2A7B]">
                          {formatMinorToCurrency(q.quotedAmountMinor, event.details.currency)}
                        </td>
                        <td className="py-3 px-3 text-[#5C5765] max-w-xs">{q.packageDetails}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#1E1B24]">
                          ★ {q.rating || 4.5}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#5C5765] border border-dashed rounded-xl">
              No quotes added yet. Click "Add Quote" to record bids from prospective vendors.
            </div>
          )}
        </div>
      </Modal>

      {/* Add Quote Sub-Modal */}
      <Modal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        title="Add Vendor Quote"
        description={`Record formal quote for ${selectedVendor?.category}.`}
      >
        <form onSubmit={handleSaveQuote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Vendor Name *</label>
            <input
              type="text"
              required
              value={quoteForm.vendorName}
              onChange={(e) => setQuoteForm({ ...quoteForm, vendorName: e.target.value })}
              placeholder="e.g. Royal Beats Orchestra"
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Quoted Amount *</label>
              <input
                type="text"
                required
                value={quoteForm.quotedAmountInput}
                onChange={(e) => setQuoteForm({ ...quoteForm, quotedAmountInput: e.target.value })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Phone</label>
              <input
                type="text"
                value={quoteForm.phone}
                onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                placeholder="+91 98400 12345"
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Package Scope / Terms</label>
            <textarea
              rows={2}
              value={quoteForm.packageDetails}
              onChange={(e) => setQuoteForm({ ...quoteForm, packageDetails: e.target.value })}
              placeholder="e.g. 5 hours performance, sound equipment included, 25% deposit..."
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsQuoteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Quote
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Vendor Modal */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title={editingVendor ? 'Edit Vendor Profile' : 'Add New Vendor Profile'}
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Vendor Name / Business *</label>
            <input
              type="text"
              required
              value={vendorForm.name}
              onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
              placeholder="e.g. Chennai Flower Hub"
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Category</label>
              <input
                type="text"
                value={vendorForm.category}
                onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Booking Status</label>
              <select
                value={vendorForm.bookingStatus}
                onChange={(e) => setVendorForm({ ...vendorForm, bookingStatus: e.target.value as any })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              >
                <option value="not_contacted">Not Contacted</option>
                <option value="contacted">Contacted</option>
                <option value="quote_received">Quote Received</option>
                <option value="booked">Booked</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Phone</label>
              <input
                type="text"
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                placeholder="+91 ..."
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Contact Person</label>
              <input
                type="text"
                value={vendorForm.contactPerson}
                onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                placeholder="Manager name"
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
          </div>

          {/* Eco-Friendly / Sustainability Settings */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={vendorForm.isSustainable}
                onChange={(e) => setVendorForm({ ...vendorForm, isSustainable: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
              />
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                Mark as Certified Sustainable / Eco-Friendly Vendor (+40 XP)
              </span>
            </label>

            {vendorForm.isSustainable && (
              <div className="space-y-2 pt-1 border-t border-emerald-200/60">
                <span className="text-[11px] font-semibold text-emerald-900 block">
                  Select Sustainable Practices Applied:
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {SUSTAINABLE_PRACTICE_OPTIONS.map((opt) => {
                    const selected = vendorForm.sustainabilityPractices.includes(opt);
                    return (
                      <label
                        key={opt}
                        className="flex items-start gap-2 text-xs text-emerald-950 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handlePracticeToggle(opt)}
                          className="w-3.5 h-3.5 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsVendorModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Vendor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Gamification Showcase Modal */}
      <GamificationModal
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        event={event}
      />
    </div>
  );
};
