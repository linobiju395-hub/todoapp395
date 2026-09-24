import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Star,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Todo, Priority, Subtask } from '../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialTask?: Todo | null;
  existingCategories: string[];
}

const DEFAULT_CATEGORIES = ['Work', 'Chores', 'Health'];

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  existingCategories,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('basic');
  const [category, setCategory] = useState('Work');
  const [customCategory, setCustomCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const categories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories])
  );

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority((initialTask.priority as string) === 'medium' ? 'basic' : initialTask.priority);
      setCategory(initialTask.category);
      setDueDate(initialTask.dueDate || '');
      setIsStarred(Boolean(initialTask.isStarred));
      setSubtasks(initialTask.subtasks ? [...initialTask.subtasks] : []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('Work');
      setCustomCategory('');
      setDueDate('');
      setIsStarred(false);
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = customCategory.trim() || category;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      completed: initialTask ? initialTask.completed : false,
      priority,
      category: finalCategory,
      dueDate: dueDate || undefined,
      subtasks,
      isStarred,
    });

    onClose();
  };

  const setQuickDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    setDueDate(d.toISOString().split('T')[0]);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.12 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#14161b] border border-neutral-200 dark:border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-white/[0.06]">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {initialTask ? 'Edit task' : 'New task'}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                id="toggle-starred-form-btn"
                type="button"
                onClick={() => setIsStarred(!isStarred)}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isStarred
                    ? 'text-amber-500 bg-amber-500/10'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
                title="Toggle important"
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500' : ''}`} />
              </button>
              <button
                id="close-task-form-btn"
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  autoFocus
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                />
              </div>

              {/* Description */}
              <div>
                <textarea
                  id="task-desc-input"
                  rows={2}
                  placeholder="Notes or details (optional)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 resize-none"
                />
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Importance
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg">
                    {(['low', 'basic', 'high', 'urgent'] as Priority[]).map((p) => {
                      const active = priority === p || (p === 'basic' && (priority as string) === 'medium');
                      return (
                        <button
                          key={p}
                          type="button"
                          id={`priority-btn-${p}`}
                          onClick={() => setPriority(p)}
                          className={`py-1 text-[11px] capitalize rounded transition-all cursor-pointer ${
                            active
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium'
                              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Category
                  </label>
                  <select
                    id="task-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-[#14161b] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Category...</option>
                  </select>
                  {category === 'Custom' && (
                    <input
                      id="custom-category-input"
                      type="text"
                      placeholder="Category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-1.5 w-full px-2.5 py-1 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded text-neutral-900 dark:text-white focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-neutral-500">
                    Due date
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setQuickDate(0)}
                      className="px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      className="px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      Tomorrow
                    </button>
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="px-1.5 py-0.5 rounded text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <input
                  id="task-due-date-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-[#14161b] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                </label>

                {subtasks.length > 0 && (
                  <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1 rounded bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.05]"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(st.id)}
                          className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          {st.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                          )}
                          <span
                            className={`text-xs truncate ${
                              st.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {st.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-neutral-400 hover:text-rose-500 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5">
                  <input
                    id="new-subtask-title-input"
                    type="text"
                    placeholder="Add subtask step..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none"
                  />
                  <button
                    id="add-subtask-btn"
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="px-2 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] rounded disabled:opacity-30 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-white/[0.02]">
              <button
                id="cancel-task-form-btn"
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-task-form-btn"
                type="submit"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 rounded transition-colors cursor-pointer"
              >
                {initialTask ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
