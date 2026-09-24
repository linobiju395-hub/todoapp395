import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Star,
  Check,
  Circle,
  Copy,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Todo, Priority } from '../types';

interface TaskCardProps {
  task: Todo;
  onToggleComplete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onUpdatePriority: (id: string, newPriority: Priority) => void;
  onEdit: (task: Todo) => void;
  onDelete: (id: string) => void;
  onDuplicate: (task: Todo) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export function TaskCard({
  task,
  onToggleComplete,
  onToggleStar,
  onUpdatePriority,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleSubtask,
}: TaskCardProps) {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const completedSubtasksCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const getDueDateStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDateStr < today && !task.completed;
    const isToday = dueDateStr === today;

    const dateObj = new Date(dueDateStr + 'T00:00:00');
    const formatted = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return {
      text: isToday ? 'Today' : formatted,
      isOverdue,
      isToday,
    };
  };

  const dueDateInfo = getDueDateStatus(task.dueDate);

  const priorityMeta: Record<Priority, { label: string; dot: string; text: string }> = {
    urgent: { label: 'Urgent', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
    high: { label: 'High', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    basic: { label: 'Basic', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    medium: { label: 'Basic', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    low: { label: 'Low', dot: 'bg-neutral-400 dark:bg-neutral-600', text: 'text-neutral-500 dark:text-neutral-400' },
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.16 }}
      className={`group relative rounded-lg border transition-all ${
        task.completed
          ? 'bg-neutral-50/50 dark:bg-white/[0.02] border-neutral-200/60 dark:border-white/[0.04] opacity-60'
          : 'bg-white dark:bg-[#13151a] hover:bg-neutral-50/70 dark:hover:bg-[#16181f] border-neutral-200/80 dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.12] shadow-2xs'
      }`}
    >
      <div className="px-3.5 py-3 flex items-start gap-3">
        {/* Checkbox */}
        <button
          id={`toggle-task-${task.id}`}
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
            task.completed
              ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 bg-transparent'
          }`}
          title={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        {/* Center Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              onClick={() => onEdit(task)}
              className={`text-[13px] font-medium leading-normal cursor-pointer transition-colors ${
                task.completed
                  ? 'line-through text-neutral-400 dark:text-neutral-500'
                  : 'text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {task.title}
            </span>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                id={`edit-task-btn-${task.id}`}
                type="button"
                onClick={() => onEdit(task)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title="Edit task"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                id={`duplicate-task-btn-${task.id}`}
                type="button"
                onClick={() => onDuplicate(task)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title="Duplicate task"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                id={`delete-task-btn-${task.id}`}
                type="button"
                onClick={() => onDelete(task.id)}
                className="p-1 rounded text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              onClick={() => onEdit(task)}
              className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 cursor-pointer"
            >
              {task.description}
            </p>
          )}

          {/* Minimal Meta Tags Row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {/* Importance / Priority Selector */}
            <div className="relative">
              <button
                id={`task-priority-badge-${task.id}`}
                type="button"
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-200 dark:border-white/[0.08] text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Change importance"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[task.priority]?.dot || 'bg-blue-500'}`} />
                <span className="capitalize">{priorityMeta[task.priority]?.label || 'Basic'}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {showPriorityMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowPriorityMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-28 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/[0.1] rounded-lg shadow-lg z-30 py-1">
                    {(['urgent', 'high', 'basic', 'low'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          onUpdatePriority(task.id, p);
                          setShowPriorityMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1 text-xs text-left capitalize transition-colors cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/[0.06] ${
                          (task.priority === p || (p === 'basic' && task.priority === 'medium')) ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[p].dot}`} />
                        {priorityMeta[p]?.label || p}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Star toggle */}
            <button
              id={`star-task-${task.id}`}
              type="button"
              onClick={() => onToggleStar(task.id)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] transition-colors cursor-pointer ${
                task.isStarred
                  ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
              title={task.isStarred ? 'Important' : 'Mark as important'}
            >
              <Star className={`w-3 h-3 ${task.isStarred ? 'fill-amber-500' : ''}`} />
              {task.isStarred && <span>Important</span>}
            </button>

            {/* Category tag (omit redundant 'work' or 'general' tag right next to star icon) */}
            {task.category && !['work', 'general'].includes(task.category.toLowerCase()) && (
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                #{task.category}
              </span>
            )}

            {/* Due Date */}
            {dueDateInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] ${
                  dueDateInfo.isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-medium'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {dueDateInfo.isOverdue ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3 opacity-70" />
                )}
                {dueDateInfo.text}
              </span>
            )}

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <button
                id={`toggle-subtasks-${task.id}`}
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer ml-auto"
              >
                <span>
                  {completedSubtasksCount}/{totalSubtasks} steps
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 opacity-60" />
                ) : (
                  <ChevronRight className="w-3 h-3 opacity-60" />
                )}
              </button>
            )}
          </div>

          {/* Subtask checklist drawer */}
          <AnimatePresence>
            {isExpanded && totalSubtasks > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.12 }}
                className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06] space-y-1"
              >
                {task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 py-0.5 text-xs text-neutral-700 dark:text-neutral-300"
                  >
                    <button
                      id={`subtask-${task.id}-${st.id}`}
                      type="button"
                      onClick={() => onToggleSubtask(task.id, st.id)}
                      className="cursor-pointer"
                    >
                      {st.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 hover:text-neutral-600" />
                      )}
                    </button>
                    <span className={st.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
