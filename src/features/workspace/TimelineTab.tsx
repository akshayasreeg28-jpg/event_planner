import React, { useState } from 'react';
import { EventFull, TimelineTask, TimelinePhase } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { upsertEvent } from '../../lib/storage';
import { formatDateDisplay } from '../../lib/formatters';
import { GanttTimelineChart } from './GanttTimelineChart';
import {
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Calendar,
  Lock,
  ArrowRight,
  ListFilter,
  BarChart2,
  Trash2,
  Edit,
} from 'lucide-react';

const PHASES: TimelinePhase[] = [
  'Initial Planning',
  'Booking & Vendors',
  'Purchasing & Decor',
  'Final Confirmations',
  'Event Day',
];

export const TimelineTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Add / Edit Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    deadline: event.details.date,
    phase: 'Initial Planning' as TimelinePhase,
    priority: 'medium' as TimelineTask['priority'],
    assignee: '',
    notes: '',
    dependencies: [] as string[],
  });

  // Dependency blocked override modal
  const [blockedTarget, setBlockedTarget] = useState<{
    task: TimelineTask;
    unmetPrerequisites: TimelineTask[];
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleTaskStatus = (task: TimelineTask) => {
    if (task.status === 'completed') {
      // Re-open
      const updatedTasks = event.tasks.map((t) =>
        t.id === task.id ? { ...t, status: 'in_progress' as const } : t
      );
      upsertEvent({ ...event, tasks: updatedTasks });
      return;
    }

    // Check prerequisites
    if (task.dependencies && task.dependencies.length > 0) {
      const openPrereqs = event.tasks.filter(
        (t) => task.dependencies.includes(t.id) && t.status !== 'completed'
      );
      if (openPrereqs.length > 0) {
        setBlockedTarget({ task, unmetPrerequisites: openPrereqs });
        return;
      }
    }

    // Mark complete
    const updatedTasks = event.tasks.map((t) =>
      t.id === task.id ? { ...t, status: 'completed' as const } : t
    );
    upsertEvent({ ...event, tasks: updatedTasks });
    showToast({ type: 'success', title: 'Task Completed', description: `Finished "${task.title}".` });
  };

  const handleForceComplete = () => {
    if (!blockedTarget) return;
    const updatedTasks = event.tasks.map((t) =>
      t.id === blockedTarget.task.id ? { ...t, status: 'completed' as const } : t
    );
    upsertEvent({ ...event, tasks: updatedTasks });
    setBlockedTarget(null);
    showToast({
      type: 'warning',
      title: 'Prerequisite Overridden',
      description: `Completed "${blockedTarget.task.title}" despite open prerequisites.`,
    });
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      const updated = event.tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: taskForm.title,
              deadline: taskForm.deadline,
              phase: taskForm.phase,
              priority: taskForm.priority,
              assignee: taskForm.assignee,
              notes: taskForm.notes,
              dependencies: taskForm.dependencies,
            }
          : t
      );
      upsertEvent({ ...event, tasks: updated });
    } else {
      const newTask: TimelineTask = {
        id: `tsk_${Date.now()}`,
        title: taskForm.title,
        deadline: taskForm.deadline,
        phase: taskForm.phase,
        priority: taskForm.priority,
        status: 'not_started',
        dependencies: taskForm.dependencies,
        assignee: taskForm.assignee,
        notes: taskForm.notes,
      };
      upsertEvent({ ...event, tasks: [...event.tasks, newTask] });
    }
    setIsTaskModalOpen(false);
  };

  const handleEditTask = (task: TimelineTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      deadline: task.deadline,
      phase: task.phase,
      priority: task.priority,
      assignee: task.assignee || '',
      notes: task.notes || '',
      dependencies: task.dependencies || [],
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = event.tasks.filter((t) => t.id !== taskId);
    upsertEvent({ ...event, tasks: updated });
    showToast({ type: 'info', title: 'Task Removed' });
  };

  const filteredTasks = event.tasks.filter((t) => {
    const matchPhase = filterPhase === 'all' || t.phase === filterPhase;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchPhase && matchPriority && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
            Automated Reverse Timeline
          </h2>
          <p className="text-xs text-[#5C5765]">
            Backward planning schedule from target event date with enforced dependency logic.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[#F3EEF8]/80 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#4B2A7B] shadow-xs' : 'text-[#5C5765]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'gantt' ? 'bg-white text-[#4B2A7B] shadow-xs' : 'text-[#5C5765]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Gantt View
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setTaskForm({
                title: '',
                deadline: event.details.date,
                phase: 'Initial Planning',
                priority: 'medium',
                assignee: '',
                notes: '',
                dependencies: [],
              });
              setIsTaskModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Interactive Phase Filters */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F3EEF8]/80 rounded-xl overflow-x-auto no-scrollbar">
        {['all', ...PHASES].map((phase) => (
          <button
            key={phase}
            onClick={() => setFilterPhase(phase)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterPhase === phase
                ? 'bg-white text-[#4B2A7B] shadow-xs font-semibold'
                : 'text-[#5C5765] hover:text-[#1E1B24]'
            }`}
          >
            {phase === 'all' ? 'All Phases' : phase}
          </button>
        ))}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {PHASES.map((phase) => {
            const phaseTasks = filteredTasks.filter((t) => t.phase === phase);
            if (phaseTasks.length === 0 && filterPhase !== 'all') return null;

            return (
              <div key={phase} className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#4B2A7B]/10 pb-2">
                  <h3 className="text-sm font-bold text-[#4B2A7B] uppercase tracking-wider flex items-center gap-2">
                    <span>{phase}</span>
                    <span className="text-xs text-[#5C5765] font-normal font-mono">
                      ({phaseTasks.filter((t) => t.status === 'completed').length}/{phaseTasks.length} completed)
                    </span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {phaseTasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const isOverdue = !isCompleted && task.deadline < todayStr;
                    const hasDependencies = task.dependencies && task.dependencies.length > 0;

                    return (
                      <Card
                        key={task.id}
                        variant="default"
                        padding="sm"
                        className={`flex items-start sm:items-center justify-between gap-3 transition-colors ${
                          isCompleted ? 'bg-emerald-50/40 opacity-75' : isOverdue ? 'bg-rose-50/40 border-rose-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className="mt-0.5 text-[#4B2A7B] hover:scale-110 transition-transform cursor-pointer"
                          >
                            {isCompleted ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-[#5C5765]" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-semibold block ${
                                isCompleted ? 'line-through text-[#5C5765]' : 'text-[#1E1B24]'
                              }`}
                            >
                              {task.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5C5765] mt-0.5">
                              {task.assignee && <span>Assignee: {task.assignee}</span>}
                              {hasDependencies && (
                                <span className="inline-flex items-center gap-1 text-[#4B2A7B]">
                                  <Lock className="w-3 h-3" /> {task.dependencies.length} prerequisite(s)
                                </span>
                              )}
                              {task.notes && <span>· Note: {task.notes}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
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

                          <span
                            className={`text-xs font-mono tabular-nums ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-[#5C5765]'
                            }`}
                          >
                            {task.deadline}
                          </span>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded text-[#5C5765] hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visual Gantt Chart View */}
      {viewMode === 'gantt' && (
        <GanttTimelineChart
          event={event}
          onToggleTaskStatus={handleToggleTaskStatus}
          onEditTask={handleEditTask}
        />
      )}

      {/* Dependency Enforcement Blocked Modal */}
      <Modal
        isOpen={!!blockedTarget}
        onClose={() => setBlockedTarget(null)}
        title="Prerequisites Not Completed"
        description="This task is dependent on prior milestones that are still marked open."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
            <p className="font-bold">Required Prerequisite Tasks:</p>
            <ul className="list-disc pl-4 space-y-1">
              {blockedTarget?.unmetPrerequisites.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong> (Deadline: {p.deadline})
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-[#5C5765]">
            Best practice is to finish the prerequisite tasks first. You may override this requirement if circumstances permit.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setBlockedTarget(null)}>
              Keep Open
            </Button>
            <Button variant="primary" size="sm" onClick={handleForceComplete}>
              Override & Complete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Timeline Task'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Task Title *</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Confirm generator fuel backup, Pay flower advance"
              className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Phase *</label>
              <select
                value={taskForm.phase}
                onChange={(e) => setTaskForm({ ...taskForm, phase: e.target.value as TimelinePhase })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              >
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Deadline *</label>
              <input
                type="date"
                required
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Assignee</label>
              <input
                type="text"
                value={taskForm.assignee}
                onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                placeholder="e.g. Meera, Suresh"
                className="w-full px-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#4B2A7B]/10">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
