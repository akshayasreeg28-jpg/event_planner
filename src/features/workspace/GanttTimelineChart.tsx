import React, { useState, useMemo } from 'react';
import { EventFull, TimelineTask, TimelinePhase } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDateDisplay, getDaysRemaining } from '../../lib/formatters';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Flag,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  Award,
} from 'lucide-react';

interface GanttTimelineChartProps {
  event: EventFull;
  onToggleTaskStatus: (task: TimelineTask) => void;
  onEditTask?: (task: TimelineTask) => void;
}

export type GanttZoomLevel = 'weeks' | 'months' | 'days';

const PHASE_COLORS: Record<
  TimelinePhase,
  { bg: string; text: string; bar: string; border: string; accent: string }
> = {
  'Initial Planning': {
    bg: 'bg-purple-50',
    text: 'text-[#4B2A7B]',
    bar: 'bg-[#4B2A7B]',
    border: 'border-[#4B2A7B]/20',
    accent: '#4B2A7B',
  },
  'Booking & Vendors': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    bar: 'bg-indigo-600',
    border: 'border-indigo-200',
    accent: '#4F46E5',
  },
  'Purchasing & Decor': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    bar: 'bg-amber-500',
    border: 'border-amber-200',
    accent: '#F59E0B',
  },
  'Final Confirmations': {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    bar: 'bg-[#FF7A6B]',
    border: 'border-rose-200',
    accent: '#FF7A6B',
  },
  'Event Day': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    bar: 'bg-emerald-600',
    border: 'border-emerald-200',
    accent: '#10B981',
  },
};

export const GanttTimelineChart: React.FC<GanttTimelineChartProps> = ({
  event,
  onToggleTaskStatus,
  onEditTask,
}) => {
  const [zoomLevel, setZoomLevel] = useState<GanttZoomLevel>('weeks');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [onlyMilestones, setOnlyMilestones] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const today = useMemo(() => new Date(todayStr), [todayStr]);

  // Identify milestone tasks
  const isMilestone = (task: TimelineTask) => {
    const titleLower = task.title.toLowerCase();
    return (
      task.priority === 'critical' ||
      task.deadline === event.details.date ||
      titleLower.includes('contract') ||
      titleLower.includes('deposit') ||
      titleLower.includes('lock') ||
      titleLower.includes('rsvp') ||
      titleLower.includes('rehearsal') ||
      titleLower.includes('ceremony') ||
      titleLower.includes('final')
    );
  };

  // Determine chronological boundary range
  const { startDate, endDate, totalDays, timeColumns } = useMemo(() => {
    const allDeadlines = event.tasks
      .map((t) => t.deadline)
      .filter(Boolean)
      .concat([event.details.date, todayStr]);

    const timestamps = allDeadlines.map((d) => new Date(d).getTime());
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);

    // Add 7 days padding on each side for aesthetic breathing room
    const start = new Date(minTimestamp - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(maxTimestamp + 10 * 24 * 60 * 60 * 1000);

    const diffMs = end.getTime() - start.getTime();
    const days = Math.max(14, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // Generate time column headers based on zoom level
    const cols: { label: string; subLabel: string; leftPct: number; widthPct: number }[] = [];

    if (zoomLevel === 'months') {
      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      while (current < end) {
        const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        const colStart = Math.max(start.getTime(), current.getTime());
        const colEnd = Math.min(end.getTime(), nextMonth.getTime());
        const colDays = (colEnd - colStart) / (1000 * 60 * 60 * 24);

        if (colDays > 0) {
          const leftPct = ((colStart - start.getTime()) / (end.getTime() - start.getTime())) * 100;
          const widthPct = (colDays / days) * 100;
          cols.push({
            label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            subLabel: `${Math.round(colDays)}d`,
            leftPct,
            widthPct,
          });
        }
        current.setMonth(current.getMonth() + 1);
      }
    } else if (zoomLevel === 'weeks') {
      // 7-day intervals
      const stepDays = 7;
      const numSteps = Math.ceil(days / stepDays);
      for (let i = 0; i < numSteps; i++) {
        const curDate = new Date(start.getTime() + i * stepDays * 24 * 60 * 60 * 1000);
        const nextDate = new Date(start.getTime() + (i + 1) * stepDays * 24 * 60 * 60 * 1000);
        const leftPct = (i / numSteps) * 100;
        const widthPct = (1 / numSteps) * 100;

        cols.push({
          label: curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          subLabel: `W${i + 1}`,
          leftPct,
          widthPct,
        });
      }
    } else {
      // Days (sampled every 3 days if > 30 days)
      const stepDays = days > 45 ? 3 : days > 25 ? 2 : 1;
      const numSteps = Math.ceil(days / stepDays);
      for (let i = 0; i < numSteps; i++) {
        const curDate = new Date(start.getTime() + i * stepDays * 24 * 60 * 60 * 1000);
        const leftPct = (i / numSteps) * 100;
        const widthPct = (1 / numSteps) * 100;

        cols.push({
          label: curDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          subLabel: curDate.toLocaleDateString('en-US', { weekday: 'narrow' }),
          leftPct,
          widthPct,
        });
      }
    }

    return {
      startDate: start,
      endDate: end,
      totalDays: days,
      timeColumns: cols,
    };
  }, [event.tasks, event.details.date, todayStr, zoomLevel]);

  // Position calculation helpers
  const getPercentageForDate = (dateStr: string): number => {
    const d = new Date(dateStr).getTime();
    const s = startDate.getTime();
    const e = endDate.getTime();
    const pct = ((d - s) / (e - s)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const todayPositionPct = getPercentageForDate(todayStr);
  const eventPositionPct = getPercentageForDate(event.details.date);

  // Group tasks by Phase
  const phases: TimelinePhase[] = [
    'Initial Planning',
    'Booking & Vendors',
    'Purchasing & Decor',
    'Final Confirmations',
    'Event Day',
  ];

  const tasksByPhase = useMemo(() => {
    const map = new Map<TimelinePhase, TimelineTask[]>();
    phases.forEach((p) => map.set(p, []));

    event.tasks.forEach((task) => {
      if (onlyMilestones && !isMilestone(task)) return;
      const list = map.get(task.phase) || [];
      list.push(task);
      map.set(task.phase, list);
    });

    // Sort tasks in each phase by deadline ascending
    phases.forEach((p) => {
      const list = map.get(p) || [];
      list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      map.set(p, list);
    });

    return map;
  }, [event.tasks, onlyMilestones]);

  const togglePhaseCollapse = (phase: string) => {
    setCollapsedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  // Milestone list for top banner summary
  const keyMilestones = useMemo(() => {
    return event.tasks
      .filter((t) => isMilestone(t))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [event.tasks]);

  const completedCount = event.tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = event.tasks.filter(
    (t) => t.status !== 'completed' && t.deadline < todayStr
  ).length;

  return (
    <div className="space-y-5">
      {/* Top Milestone Highlights Banner */}
      <Card variant="highlight" padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4B2A7B] to-[#FF7A6B] text-white flex items-center justify-center shadow-xs">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-[#1E1B24]">
                Planning Milestones & Execution Horizon
              </h3>
              <p className="text-[11px] text-[#5C5765]">
                {event.tasks.length} Total tasks scheduled · {completedCount} Done ({Math.round((completedCount / (event.tasks.length || 1)) * 100)}%)
                {overdueCount > 0 && (
                  <span className="text-rose-600 font-semibold ml-1.5">
                    · {overdueCount} Overdue Action(s)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            {/* Milestone Filter Toggle */}
            <button
              onClick={() => setOnlyMilestones(!onlyMilestones)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                onlyMilestones
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-[#5C5765] border-[#4B2A7B]/15 hover:bg-[#F3EEF8]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{onlyMilestones ? 'Showing Milestones Only' : 'Filter Milestones'}</span>
            </button>

            {/* Zoom Granularity Selector */}
            <div className="flex items-center bg-[#F3EEF8] p-0.5 rounded-xl border border-[#4B2A7B]/15 text-xs">
              {(['weeks', 'months', 'days'] as GanttZoomLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  className={`px-2 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                    zoomLevel === level
                      ? 'bg-white text-[#4B2A7B] shadow-2xs'
                      : 'text-[#5C5765] hover:text-[#1E1B24]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Milestone Diamond Chips Strip */}
        {keyMilestones.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-[#4B2A7B]/10">
            {keyMilestones.map((m) => {
              const remaining = getDaysRemaining(m.deadline);
              const isDone = m.status === 'completed';
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedTaskId(m.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer text-left ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : remaining.isPast
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-white/90 border-[#4B2A7B]/15 hover:border-[#4B2A7B]/40 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[#5C5765]">
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      ◆ Milestone
                    </span>
                    <span className="font-mono">{m.deadline}</span>
                  </div>
                  <h5 className={`text-xs font-bold truncate mt-0.5 ${isDone ? 'line-through text-[#5C5765]' : 'text-[#1E1B24]'}`}>
                    {m.title}
                  </h5>
                  <div className="flex items-center justify-between text-[10px] mt-1 text-[#5C5765]">
                    <span className="capitalize">{m.phase.replace(' & ', '/')}</span>
                    <span className={isDone ? 'text-emerald-700 font-semibold' : remaining.isPast ? 'text-rose-600 font-semibold' : 'text-[#4B2A7B]'}>
                      {isDone ? 'Done' : remaining.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Main Gantt Canvas Container */}
      <Card variant="default" padding="none" className="overflow-hidden border-[#4B2A7B]/15 shadow-sm">
        {/* Gantt Top Legend & Guide */}
        <div className="p-3 bg-[#FBF7F0] border-b border-[#4B2A7B]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#1E1B24] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#4B2A7B]" />
              Gantt Planning Track
            </span>
            <div className="flex items-center gap-3 text-[11px] text-[#5C5765]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Done
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4B2A7B]" /> In Progress
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overdue
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <span>◆</span> Critical Milestone
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#5C5765]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-coral-500" /> Red Line = Today
            </span>
            <span className="flex items-center gap-1 font-semibold text-[#4B2A7B]">
              <Flag className="w-3 h-3 text-[#4B2A7B]" /> Event: {formatDateDisplay(event.details.date)}
            </span>
          </div>
        </div>

        {/* Scrollable Gantt Chart Viewport */}
        <div className="overflow-x-auto min-w-[760px] pb-4 select-none">
          {/* Timeline Header (Time Columns Axis) */}
          <div className="grid grid-cols-12 bg-[#F3EEF8]/70 border-b border-[#4B2A7B]/15 sticky top-0 z-10">
            {/* Left Column Label */}
            <div className="col-span-4 p-2.5 border-r border-[#4B2A7B]/15 text-xs font-bold text-[#1E1B24]">
              Phase & Milestone Tasks
            </div>

            {/* Right Column: Dynamic Time Axis */}
            <div className="col-span-8 relative h-10 flex items-center overflow-hidden">
              {timeColumns.map((col, idx) => (
                <div
                  key={idx}
                  style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                  className="absolute top-0 bottom-0 border-r border-[#4B2A7B]/10 px-1.5 py-1 text-center truncate flex flex-col justify-center"
                >
                  <span className="text-[10px] font-bold text-[#1E1B24] leading-tight truncate">
                    {col.label}
                  </span>
                  <span className="text-[9px] text-[#5C5765] leading-tight font-mono">
                    {col.subLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Groups & Task Rows */}
          <div className="relative">
            {/* Vertical Marker: TODAY Line */}
            {todayPositionPct >= 0 && todayPositionPct <= 100 && (
              <div
                style={{ left: `calc(33.333% + (66.666% * ${todayPositionPct / 100}))` }}
                className="absolute top-0 bottom-0 w-0.5 bg-[#FF7A6B] z-20 pointer-events-none"
              >
                <div className="sticky top-1 -translate-x-1/2 bg-[#FF7A6B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                  Today
                </div>
              </div>
            )}

            {/* Vertical Marker: EVENT DAY Line */}
            {eventPositionPct >= 0 && eventPositionPct <= 100 && (
              <div
                style={{ left: `calc(33.333% + (66.666% * ${eventPositionPct / 100}))` }}
                className="absolute top-0 bottom-0 w-0.5 bg-[#4B2A7B] border-r border-dashed border-[#4B2A7B] z-20 pointer-events-none"
              >
                <div className="sticky top-1 -translate-x-1/2 bg-[#4B2A7B] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider flex items-center gap-1">
                  <Flag className="w-2.5 h-2.5" /> Event Day
                </div>
              </div>
            )}

            {phases.map((phase) => {
              const phaseTasks = tasksByPhase.get(phase) || [];
              if (phaseTasks.length === 0 && onlyMilestones) return null;

              const isCollapsed = collapsedPhases[phase];
              const phaseStyle = PHASE_COLORS[phase] || PHASE_COLORS['Initial Planning'];
              const phaseDoneCount = phaseTasks.filter((t) => t.status === 'completed').length;
              const phasePct = Math.round((phaseDoneCount / (phaseTasks.length || 1)) * 100);

              return (
                <div key={phase} className="border-b border-[#4B2A7B]/10">
                  {/* Phase Summary Row */}
                  <div
                    onClick={() => togglePhaseCollapse(phase)}
                    className="grid grid-cols-12 bg-[#FAF8F5] hover:bg-[#F3EEF8]/60 transition-colors cursor-pointer border-l-4"
                    style={{ borderLeftColor: phaseStyle.accent }}
                  >
                    <div className="col-span-4 p-2 flex items-center justify-between border-r border-[#4B2A7B]/10">
                      <div className="flex items-center gap-2 min-w-0">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-[#5C5765] shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#5C5765] shrink-0" />
                        )}
                        <span className="text-xs font-bold text-[#1E1B24] truncate">
                          {phase}
                        </span>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {phaseDoneCount}/{phaseTasks.length} ({phasePct}%)
                      </Badge>
                    </div>

                    {/* Phase Aggregate Horizon Bar on the Right */}
                    <div className="col-span-8 relative h-9 px-2 flex items-center">
                      {phaseTasks.length > 0 && (
                        (() => {
                          const phaseDeadlines = phaseTasks.map((t) => new Date(t.deadline).getTime());
                          const minP = Math.min(...phaseDeadlines);
                          const maxP = Math.max(...phaseDeadlines);
                          // approximate lead time of 7 days before earliest deadline
                          const pStartStr = new Date(minP - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                          const pEndStr = new Date(maxP).toISOString().split('T')[0];
                          const left = getPercentageForDate(pStartStr);
                          const right = getPercentageForDate(pEndStr);
                          const width = Math.max(3, right - left);

                          return (
                            <div
                              style={{ left: `${left}%`, width: `${width}%` }}
                              className="absolute h-2.5 rounded-full bg-[#4B2A7B]/20 overflow-hidden"
                            >
                              <div
                                style={{ width: `${phasePct}%` }}
                                className={`h-full rounded-full ${phaseStyle.bar}`}
                              />
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>

                  {/* Expanded Task Rows */}
                  {!isCollapsed && (
                    <div className="divide-y divide-[#4B2A7B]/5">
                      {phaseTasks.map((task) => {
                        const isCompleted = task.status === 'completed';
                        const isOverdue = !isCompleted && task.deadline < todayStr;
                        const isSelected = selectedTaskId === task.id;
                        const milestone = isMilestone(task);

                        // Calculate task horizontal span
                        // Default estimated duration is 7 days leading up to deadline
                        const durationDays = task.priority === 'critical' ? 12 : 7;
                        const taskEndDate = new Date(task.deadline);
                        const taskStartDate = new Date(taskEndDate.getTime() - durationDays * 24 * 60 * 60 * 1000);
                        const leftPct = getPercentageForDate(taskStartDate.toISOString().split('T')[0]);
                        const rightPct = getPercentageForDate(task.deadline);
                        const widthPct = Math.max(2.5, rightPct - leftPct);

                        return (
                          <div
                            key={task.id}
                            className={`grid grid-cols-12 items-center hover:bg-[#FDFBF7] transition-colors ${
                              isSelected ? 'bg-purple-50/50 ring-1 ring-inset ring-[#4B2A7B]/30' : ''
                            }`}
                          >
                            {/* Task Info Cell */}
                            <div className="col-span-4 p-2 pl-6 flex items-center justify-between border-r border-[#4B2A7B]/10 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTaskStatus(task);
                                  }}
                                  className="text-[#5C5765] hover:text-[#4B2A7B] transition-colors cursor-pointer shrink-0"
                                >
                                  {isCompleted ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>

                                <div className="min-w-0">
                                  <span
                                    onClick={() => setSelectedTaskId(task.id)}
                                    className={`text-xs font-semibold truncate block cursor-pointer hover:underline ${
                                      isCompleted
                                        ? 'line-through text-[#5C5765]'
                                        : isOverdue
                                        ? 'text-rose-700 font-bold'
                                        : 'text-[#1E1B24]'
                                    }`}
                                  >
                                    {milestone && <span className="text-amber-500 mr-1">◆</span>}
                                    {task.title}
                                  </span>

                                  <div className="flex items-center gap-1.5 text-[10px] text-[#5C5765]">
                                    {task.assignee && (
                                      <span className="truncate">{task.assignee}</span>
                                    )}
                                    {task.dependencies && task.dependencies.length > 0 && (
                                      <span className="flex items-center gap-0.5 text-[#4B2A7B] shrink-0">
                                        <Lock className="w-2.5 h-2.5" />
                                        {task.dependencies.length} prereq
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <Badge
                                variant={
                                  task.priority === 'critical'
                                    ? 'error'
                                    : task.priority === 'high'
                                    ? 'coral'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {task.priority}
                              </Badge>
                            </div>

                            {/* Gantt Bar Lane */}
                            <div
                              onClick={() => setSelectedTaskId(task.id)}
                              className="col-span-8 relative h-10 flex items-center px-2 cursor-pointer group"
                            >
                              {/* Background grid vertical lines */}
                              {timeColumns.map((col, idx) => (
                                <div
                                  key={idx}
                                  style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                                  className="absolute top-0 bottom-0 border-r border-[#4B2A7B]/5 pointer-events-none"
                                />
                              ))}

                              {/* The Gantt Bar */}
                              <div
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                                className={`absolute h-6 rounded-lg shadow-2xs transition-all flex items-center justify-between px-2 text-[10px] font-semibold text-white select-none ${
                                  isCompleted
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : isOverdue
                                    ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                                    : milestone
                                    ? 'bg-gradient-to-r from-amber-500 to-[#FF7A6B] hover:brightness-110 ring-1 ring-amber-300'
                                    : 'bg-[#4B2A7B] hover:bg-[#361E59]'
                                }`}
                              >
                                <span className="truncate font-sans drop-shadow-xs">
                                  {milestone ? '◆ ' : ''}
                                  {task.title}
                                </span>

                                {/* Deadline tag inside or right beside */}
                                <span className="font-mono text-[9px] opacity-90 shrink-0 ml-1">
                                  {task.deadline.slice(5)}
                                </span>
                              </div>

                              {/* Milestone Diamond Marker if critical milestone */}
                              {milestone && (
                                <div
                                  style={{ left: `calc(${rightPct}% - 6px)` }}
                                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-amber-400 border border-white shadow-xs z-10"
                                  title={`Milestone Deadline: ${task.deadline}`}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Task Inspection Drawer / Footer */}
        {selectedTaskId && (
          (() => {
            const task = event.tasks.find((t) => t.id === selectedTaskId);
            if (!task) return null;
            const remaining = getDaysRemaining(task.deadline);
            const isCompleted = task.status === 'completed';

            return (
              <div className="p-3.5 bg-[#FAF8F5] border-t border-[#4B2A7B]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#4B2A7B] text-white flex items-center justify-center shrink-0">
                    {isMilestone(task) ? '◆' : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1E1B24]">{task.title}</span>
                      <Badge variant={isCompleted ? 'success' : task.deadline < todayStr ? 'error' : 'neutral'} size="sm">
                        {isCompleted ? 'Completed' : task.deadline < todayStr ? 'Overdue' : 'Scheduled'}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        {task.phase}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#5C5765] mt-0.5">
                      Target Deadline: <strong className="font-mono">{formatDateDisplay(task.deadline)}</strong> ({remaining.label}) · Assignee: {task.assignee || 'Unassigned'}
                      {task.notes && <span> · Note: {task.notes}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={isCompleted ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => onToggleTaskStatus(task)}
                    leftIcon={isCompleted ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  >
                    {isCompleted ? 'Mark Re-open' : 'Mark Complete'}
                  </Button>

                  {onEditTask && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTask(task)}
                    >
                      Edit Task
                    </Button>
                  )}

                  <button
                    onClick={() => setSelectedTaskId(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </Card>
    </div>
  );
};
