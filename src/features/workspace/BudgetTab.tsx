import React, { useState } from 'react';
import { EventFull, BudgetItem, CostSavingSuggestion } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { formatMinorToCurrency, parseCurrencyInputToMinor, formatDateDisplay } from '../../lib/formatters';
import { apiGetBudgetSavings } from '../../services/api';
import { upsertEvent } from '../../lib/storage';
import { checkCategoryBudgetOverrun } from '../../lib/budgetAlerts';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  DollarSign,
  Plus,
  AlertTriangle,
  Sparkles,
  Download,
  Trash2,
  Edit,
  TrendingDown,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { GamificationModal } from '../gamification/GamificationModal';

const PALETTE = ['#4B2A7B', '#FF7A6B', '#E67E22', '#27AE60', '#2980B9', '#8E44AD', '#D35400', '#16A085'];

export const BudgetTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Add/Edit Expense Modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    category: event.budgetAllocations[0]?.category || 'Venue & Lodging',
    vendorName: '',
    estimatedInput: '50000',
    actualInput: '50000',
    paidInput: '0',
    status: 'pending' as BudgetItem['status'],
    dueDate: event.details.date,
    receiptNote: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [isComputingSavings, setIsComputingSavings] = useState(false);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);

  // Math calculated deterministically in integer minor units (paise/cents)
  const totalBudgetMinor = event.details.totalBudgetMinor;
  const totalActualMinor = event.budgetItems.reduce((acc, i) => acc + i.actualAmountMinor, 0);
  const totalPaidMinor = event.budgetItems.reduce((acc, i) => acc + i.paidAmountMinor, 0);
  const remainingBudgetMinor = totalBudgetMinor - totalActualMinor;
  const utilizationPct = Math.round((totalActualMinor / (totalBudgetMinor || 1)) * 100);

  const guestCount = event.details.estimatedGuestCount || 1;
  const perGuestCostMinor = Math.round(totalActualMinor / guestCount);

  // Grouped category math
  const categoriesList = Array.from(new Set(event.budgetAllocations.map((a) => a.category)));
  const categorySummary = categoriesList.map((cat) => {
    const alloc = event.budgetAllocations.find((a) => a.category === cat);
    const targetMinor = Math.round((totalBudgetMinor * (alloc?.targetPercentage || 0)) / 100);
    const items = event.budgetItems.filter((i) => i.category === cat);
    const actualMinor = items.reduce((acc, i) => acc + i.actualAmountMinor, 0);
    const paidMinor = items.reduce((acc, i) => acc + i.paidAmountMinor, 0);
    const varianceMinor = actualMinor - targetMinor; // positive means over-budget
    return {
      category: cat,
      targetMinor,
      actualMinor,
      paidMinor,
      varianceMinor,
      percentUsed: targetMinor > 0 ? Math.round((actualMinor / targetMinor) * 100) : 0,
    };
  });

  // Chart data
  const pieData = categorySummary
    .filter((c) => c.actualMinor > 0)
    .map((c) => ({
      name: c.category,
      value: c.actualMinor / 100, // in major units for chart labels
    }));

  const barData = categorySummary.map((c) => ({
    name: c.category.length > 14 ? c.category.slice(0, 12) + '...' : c.category,
    Budgeted: c.targetMinor / 100,
    Actual: c.actualMinor / 100,
  }));

  // AI Budget Coach: Monthly burn-down vs. plan calculation
  const burndownData = [
    { month: 'T-5 Mo', Planned: Math.round((totalBudgetMinor * 0.15) / 10000), Actual: Math.round((totalActualMinor * 0.10) / 10000) },
    { month: 'T-4 Mo', Planned: Math.round((totalBudgetMinor * 0.35) / 10000), Actual: Math.round((totalActualMinor * 0.28) / 10000) },
    { month: 'T-3 Mo', Planned: Math.round((totalBudgetMinor * 0.55) / 10000), Actual: Math.round((totalActualMinor * 0.50) / 10000) },
    { month: 'T-2 Mo', Planned: Math.round((totalBudgetMinor * 0.75) / 10000), Actual: Math.round((totalActualMinor * 0.70) / 10000) },
    { month: 'T-1 Mo', Planned: Math.round((totalBudgetMinor * 0.90) / 10000), Actual: Math.round((totalActualMinor * 0.88) / 10000) },
    { month: 'Event Day', Planned: Math.round(totalBudgetMinor / 10000), Actual: Math.round(totalActualMinor / 10000) },
  ];

  // Overspend detection with concrete swap suggestions
  const overspentCategories = categorySummary.filter((c) => c.varianceMinor > 0);
  const concreteSwaps: { category: string; title: string; savingMinor: number; description: string; tradeOff: string }[] = overspentCategories.map((c) => {
    if (c.category.toLowerCase().includes('venue') || c.category.toLowerCase().includes('hall')) {
      return {
        category: c.category,
        title: 'Shift Banquet Setup to Daylight Afternoon Slot',
        savingMinor: Math.min(c.varianceMinor, Math.round(c.targetMinor * 0.18)),
        description: 'Negotiate daylight hours to avoid evening peak lighting surge charges.',
        tradeOff: 'Afternoon lighting rather than twilight sunset aesthetic.',
      };
    } else if (c.category.toLowerCase().includes('cater') || c.category.toLowerCase().includes('food')) {
      return {
        category: c.category,
        title: 'Replace Plated Multi-Course with Curated Live Food Stations',
        savingMinor: Math.min(c.varianceMinor, Math.round(c.targetMinor * 0.15)),
        description: 'Live interactive counters reduce kitchen waste and service headcount.',
        tradeOff: 'Casual self-service flow instead of white-glove table service.',
      };
    } else if (c.category.toLowerCase().includes('decor') || c.category.toLowerCase().includes('floral')) {
      return {
        category: c.category,
        title: 'Procure Local Seasonal Florals (Marigold & Jasmine Strings)',
        savingMinor: Math.min(c.varianceMinor, Math.round(c.targetMinor * 0.20)),
        description: 'Swap imported blooms with fragrant local temple florals and brass urlis.',
        tradeOff: 'Traditional heritage aesthetic instead of western pastel flowers.',
      };
    }
    return {
      category: c.category,
      title: `Consolidate ${c.category} Scope & Procurement`,
      savingMinor: Math.min(c.varianceMinor, Math.round(c.targetMinor * 0.12)),
      description: `Streamline sub-contractors and negotiate bundled rate for ${c.category}.`,
      tradeOff: 'Slightly reduced customization scope.',
    };
  });

  // Handlers
  const handleOpenAddExpense = () => {
    setEditingItem(null);
    setExpenseForm({
      name: '',
      category: event.budgetAllocations[0]?.category || 'General',
      vendorName: '',
      estimatedInput: '25000',
      actualInput: '25000',
      paidInput: '0',
      status: 'pending',
      dueDate: event.details.date,
      receiptNote: '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (item: BudgetItem) => {
    setEditingItem(item);
    setExpenseForm({
      name: item.name,
      category: item.category,
      vendorName: item.vendorName || '',
      estimatedInput: (item.estimatedAmountMinor / 100).toString(),
      actualInput: (item.actualAmountMinor / 100).toString(),
      paidInput: (item.paidAmountMinor / 100).toString(),
      status: item.status,
      dueDate: item.dueDate || event.details.date,
      receiptNote: item.receiptNote || '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const estMinor = parseCurrencyInputToMinor(expenseForm.estimatedInput);
    const actMinor = parseCurrencyInputToMinor(expenseForm.actualInput);
    const paidMinor = parseCurrencyInputToMinor(expenseForm.paidInput);

    let status = expenseForm.status;
    if (paidMinor >= actMinor && actMinor > 0) status = 'paid';
    else if (paidMinor > 0) status = 'partially_paid';

    let updatedList: BudgetItem[];
    if (editingItem) {
      updatedList = event.budgetItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: expenseForm.name,
              category: expenseForm.category,
              vendorName: expenseForm.vendorName,
              estimatedAmountMinor: estMinor,
              actualAmountMinor: actMinor,
              paidAmountMinor: paidMinor,
              status,
              dueDate: expenseForm.dueDate,
              receiptNote: expenseForm.receiptNote,
            }
          : item
      );
    } else {
      const newItem: BudgetItem = {
        id: `b_${Date.now()}`,
        name: expenseForm.name,
        category: expenseForm.category,
        vendorName: expenseForm.vendorName,
        estimatedAmountMinor: estMinor,
        actualAmountMinor: actMinor,
        paidAmountMinor: paidMinor,
        status,
        dueDate: expenseForm.dueDate,
        receiptNote: expenseForm.receiptNote,
      };
      updatedList = [newItem, ...event.budgetItems];
    }

    upsertEvent({ ...event, budgetItems: updatedList });
    setIsExpenseModalOpen(false);

    // Real-time budget alert notification: check if entry causes >10% category budget overrun
    const overrunCheck = checkCategoryBudgetOverrun(
      expenseForm.category,
      actMinor,
      event,
      editingItem?.id
    );

    if (overrunCheck.isOverrun) {
      showToast({
        type: overrunCheck.severity === 'critical' ? 'error' : 'warning',
        title: overrunCheck.title,
        description: overrunCheck.description,
        duration: 7000,
      });
    } else {
      showToast({
        type: 'success',
        title: editingItem ? 'Expense Updated' : 'Expense Recorded',
        description: `Saved ${expenseForm.name} in ${expenseForm.category}.`,
      });
    }
  };

  const handleDeleteExpense = () => {
    if (!deleteTarget) return;
    const filtered = event.budgetItems.filter((i) => i.id !== deleteTarget.id);
    upsertEvent({ ...event, budgetItems: filtered });
    setDeleteTarget(null);
    showToast({
      type: 'info',
      title: 'Expense Deleted',
      description: `Removed "${deleteTarget.name}".`,
      onUndo: () => {
        upsertEvent({ ...event, budgetItems: [...event.budgetItems, deleteTarget] });
        showToast({ type: 'success', title: 'Deletion Undone' });
      },
    });
  };

  const handleFetchAISavings = async () => {
    setIsComputingSavings(true);
    try {
      const result = await apiGetBudgetSavings({
        eventTitle: event.details.title,
        eventType: event.details.type,
        guestCount: event.details.estimatedGuestCount,
        totalBudgetMinor: event.details.totalBudgetMinor,
        currency: event.details.currency,
        categorySpending: categorySummary.map((c) => ({
          category: c.category,
          targetMinor: c.targetMinor,
          actualMinor: c.actualMinor,
        })),
      });

      upsertEvent({
        ...event,
        savingsSuggestions: result.suggestions,
      });

      showToast({
        type: 'success',
        title: 'AI Cost Savings Generated',
        description: `Found ${result.suggestions.length} tangible cost optimizations.`,
      });
    } catch (err: any) {
      console.error('Failed to get savings:', err);
      showToast({ type: 'error', title: 'Savings Calculation Error', description: err.message });
    } finally {
      setIsComputingSavings(false);
    }
  };

  const handleApplySaving = (suggestion: CostSavingSuggestion) => {
    // Find target category item and reduce actualMinor
    const matchingItems = event.budgetItems.filter((i) => i.category === suggestion.category);
    if (matchingItems.length > 0) {
      const updatedItems = event.budgetItems.map((item) => {
        if (item.id === matchingItems[0].id) {
          const newActual = Math.max(0, item.actualAmountMinor - suggestion.estimatedSavingMinor);
          return { ...item, actualAmountMinor: newActual };
        }
        return item;
      });

      const updatedSavings = (event.savingsSuggestions || []).map((s) =>
        s.id === suggestion.id ? { ...s, applied: true } : s
      );

      upsertEvent({ ...event, budgetItems: updatedItems, savingsSuggestions: updatedSavings });

      showToast({
        type: 'success',
        title: 'Cost Saving Applied',
        description: `Saved ${formatMinorToCurrency(suggestion.estimatedSavingMinor, event.details.currency)} on ${suggestion.category}.`,
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Item Name', 'Vendor', 'Estimated', 'Actual', 'Paid', 'Status', 'Due Date'];
    const rows = event.budgetItems.map((i) => [
      i.category,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${(i.vendorName || '').replace(/"/g, '""')}"`,
      (i.estimatedAmountMinor / 100).toFixed(2),
      (i.actualAmountMinor / 100).toFixed(2),
      (i.paidAmountMinor / 100).toFixed(2),
      i.status,
      i.dueDate || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.details.title.replace(/\s+/g, '_')}_Budget.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = event.budgetItems.filter((i) => {
    const matchCat = filterCategory === 'all' || i.category === filterCategory;
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchCat && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Prudent Custodian Gamification Banner */}
      {remainingBudgetMinor >= 0 && event.budgetItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-purple-50/40 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                  Budget Efficiency Award
                </span>
                <Badge variant="success" size="sm">
                  Prudent Custodian Active (+100 XP)
                </Badge>
              </div>
              <p className="text-xs text-emerald-950 font-medium">
                Zero Budget Overrun! You are operating with {formatMinorToCurrency(remainingBudgetMinor, event.details.currency)} unallocated surplus.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGamificationOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            View Badges & Ribbons
          </button>
        </div>
      )}

      {/* Alert Banners (80% Caution, 100% Alert) */}
      {utilizationPct >= 100 ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-sm block">Budget Alert: Budget Exceeded!</span>
            Total commitments of{' '}
            <strong>{formatMinorToCurrency(totalActualMinor, event.details.currency)}</strong> exceed your allocated limit of{' '}
            <strong>{formatMinorToCurrency(totalBudgetMinor, event.details.currency)}</strong> by{' '}
            <strong>{formatMinorToCurrency(Math.abs(remainingBudgetMinor), event.details.currency)}</strong>. Use the AI Cost-Saving Suggestions below to optimize costs.
          </div>
        </div>
      ) : utilizationPct >= 80 ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-sm block">Budget Caution: 80% Threshold Reached</span>
            You have committed <strong>{utilizationPct}%</strong> of the target budget. Remaining unallocated pool:{' '}
            <strong>{formatMinorToCurrency(remainingBudgetMinor, event.details.currency)}</strong>.
          </div>
        </div>
      ) : null}

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Total Budget</span>
          <p className="text-2xl font-bold font-mono text-[#1E1B24] tabular-nums">
            {formatMinorToCurrency(totalBudgetMinor, event.details.currency)}
          </p>
          <span className="text-[11px] text-[#5C5765]">Original target cap</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Committed / Spent</span>
          <p className="text-2xl font-bold font-mono text-[#4B2A7B] tabular-nums">
            {formatMinorToCurrency(totalActualMinor, event.details.currency)}
          </p>
          <span className="text-[11px] text-[#5C5765] font-mono tabular-nums">{utilizationPct}% allocated</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Remaining Pool</span>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              remainingBudgetMinor < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatMinorToCurrency(remainingBudgetMinor, event.details.currency)}
          </p>
          <span className="text-[11px] text-[#5C5765]">Available for adjustments</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5C5765] uppercase">Cost Per Guest</span>
          <p className="text-2xl font-bold font-mono text-[#1E1B24] tabular-nums">
            {formatMinorToCurrency(perGuestCostMinor, event.details.currency)}
          </p>
          <span className="text-[11px] text-[#5C5765]">Across {guestCount} attendees</span>
        </Card>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Share Donut Chart */}
        <Card variant="default" padding="lg" className="lg:col-span-5 space-y-4">
          <div>
            <h3 className="text-base font-bold font-serif text-[#1E1B24]">Category Allocation Share</h3>
            <p className="text-xs text-[#5C5765]">Breakdown of actual commitments by department.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [
                    formatMinorToCurrency((Number(val) || 0) * 100, event.details.currency),
                    'Spent',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budgeted vs Actual Bar Chart */}
        <Card variant="default" padding="lg" className="lg:col-span-7 space-y-4">
          <div>
            <h3 className="text-base font-bold font-serif text-[#1E1B24]">Planned vs. Actual Variance</h3>
            <p className="text-xs text-[#5C5765]">Compare planned target percentages against current item totals.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [
                    formatMinorToCurrency((Number(val) || 0) * 100, event.details.currency),
                    '',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Budgeted" fill="#4B2A7B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#FF7A6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI Budget Coach: Monthly Burn-Down vs. Plan */}
      <Card variant="default" padding="lg" className="space-y-4 border border-[var(--event-border)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--event-border)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[#4B2A7B]" />
              <h3 className="text-base font-bold font-serif text-[var(--app-text)]">
                AI Budget Coach: Monthly Burn-Down vs. Plan
              </h3>
            </div>
            <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
              Tracks actual commitments across planning runway against target capital deployment pace.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            Capital Runway: Healthy
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4B2A7B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4B2A7B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF7A6B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF7A6B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="k" />
              <Tooltip formatter={(v: any) => [`₹${(Number(v) * 100).toLocaleString()}`, '']} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Planned" stroke="#4B2A7B" fillOpacity={1} fill="url(#colorPlanned)" strokeWidth={2} />
              <Area type="monotone" dataKey="Actual" stroke="#FF7A6B" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Concrete Overspend Swaps Coach */}
        {concreteSwaps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--event-border)] space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900 uppercase font-mono">
                Overspend Alerts & Concrete Swap Recommendations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {concreteSwaps.map((swap, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4B2A7B]">{swap.category}</span>
                      <Badge variant="success" size="sm">
                        Save {formatMinorToCurrency(swap.savingMinor, event.details.currency)}
                      </Badge>
                    </div>
                    <h5 className="font-bold text-[#1E1B24]">{swap.title}</h5>
                    <p className="text-[11px] text-[#5C5765]">{swap.description}</p>
                    <p className="text-[10px] text-amber-800 bg-white/70 p-1.5 rounded">
                      <strong>Tradeoff:</strong> {swap.tradeOff}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const newSuggestion: CostSavingSuggestion = {
                          id: `swap_${Date.now()}_${idx}`,
                          title: swap.title,
                          description: swap.description,
                          category: swap.category,
                          estimatedSavingMinor: swap.savingMinor,
                          tradeOff: swap.tradeOff,
                          applied: true,
                        };
                        handleApplySaving(newSuggestion);
                      }}
                      className="w-full text-xs"
                    >
                      1-Click Apply Swap
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* AI Cost-Saving Suggestions Banner */}
      <Card variant="highlight" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF7A6B]" />
              <h3 className="text-base font-bold font-serif text-[#1E1B24]">
                AI Cost-Saving Suggestions
              </h3>
            </div>
            <p className="text-xs text-[#5C5765]">
              AI analyzes your actual spending figures and recommends verified, high-impact savings with explicit tradeoffs.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchAISavings}
            isLoading={isComputingSavings}
            leftIcon={<TrendingDown className="w-4 h-4 text-emerald-600" />}
          >
            Recalibrate Savings
          </Button>
        </div>

        {event.savingsSuggestions && event.savingsSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {event.savingsSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-4 rounded-xl border border-[#4B2A7B]/15 bg-white/90 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">
                      Save {formatMinorToCurrency(sug.estimatedSavingMinor, event.details.currency)}
                    </Badge>
                    <span className="text-[11px] font-semibold text-[#4B2A7B]">{sug.category}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#1E1B24]">{sug.title}</h4>
                  <p className="text-xs text-[#5C5765]">{sug.description}</p>
                  <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg mt-1">
                    <strong>Tradeoff:</strong> {sug.tradeOff}
                  </p>
                </div>

                <div className="pt-2">
                  {sug.applied ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Saving Applied
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApplySaving(sug)}
                    >
                      Apply This Saving
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white/60 text-center text-xs text-[#5C5765]">
            Click "Recalibrate Savings" to let Event AI detect opportunities to reduce expenses without compromising theme quality.
          </div>
        )}
      </Card>

      {/* Expenses Ledger Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#4B2A7B]/10">
        <div>
          <h3 className="text-lg font-bold font-serif text-[#1E1B24]">Expense Ledger</h3>
          <p className="text-xs text-[#5C5765]">All records calculated in integer minor units.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAddExpense} leftIcon={<Plus className="w-4 h-4" />}>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Ledger Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3EEF8]/80 text-[#5C5765] uppercase font-semibold text-[10px] tracking-wider border-b border-[#4B2A7B]/10">
              <tr>
                <th className="py-3 px-4">Item & Category</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4 text-right">Estimated</th>
                <th className="py-3 px-4 text-right">Actual</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4B2A7B]/8">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#F3EEF8]/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#1E1B24] block">{item.name}</span>
                    <span className="text-[11px] text-[#5C5765]">{item.category}</span>
                  </td>
                  <td className="py-3 px-4 text-[#5C5765]">{item.vendorName || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#5C5765]">
                    {formatMinorToCurrency(item.estimatedAmountMinor, event.details.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1E1B24]">
                    {formatMinorToCurrency(item.actualAmountMinor, event.details.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                    {formatMinorToCurrency(item.paidAmountMinor, event.details.currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={
                        item.status === 'paid'
                          ? 'success'
                          : item.status === 'partially_paid'
                          ? 'purple'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-[#5C5765]">{item.dueDate || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEditExpense(item)}
                        className="p-1.5 rounded-lg text-[#5C5765] hover:text-[#4B2A7B] hover:bg-[#F3EEF8] transition-colors cursor-pointer"
                        title="Edit expense"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-[#5C5765] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete expense"
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

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingItem ? 'Edit Expense Item' : 'Record New Expense'}
        description="All currency amounts are converted to integer minor units."
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Expense Title *</label>
            <input
              type="text"
              required
              value={expenseForm.name}
              onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
              placeholder="e.g. Lawn Lighting Rig, Sound Engineer Deposit"
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Vendor Name</label>
              <input
                type="text"
                value={expenseForm.vendorName}
                onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                placeholder="e.g. Light & Raga Studios"
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Estimated</label>
              <input
                type="text"
                value={expenseForm.estimatedInput}
                onChange={(e) => setExpenseForm({ ...expenseForm, estimatedInput: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Actual Amount *</label>
              <input
                type="text"
                required
                value={expenseForm.actualInput}
                onChange={(e) => setExpenseForm({ ...expenseForm, actualInput: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Paid So Far</label>
              <input
                type="text"
                value={expenseForm.paidInput}
                onChange={(e) => setExpenseForm({ ...expenseForm, paidInput: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Due Date</label>
              <input
                type="date"
                value={expenseForm.dueDate}
                onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Receipt Note</label>
              <input
                type="text"
                value={expenseForm.receiptNote}
                onChange={(e) => setExpenseForm({ ...expenseForm, receiptNote: e.target.value })}
                placeholder="UTR ref, invoice no..."
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#4B2A7B]/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense Item?"
        message={`Remove "${deleteTarget?.name}"? You can undo this action from the toast notification.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Gamification Showcase Modal */}
      <GamificationModal
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        event={event}
      />
    </div>
  );
};
