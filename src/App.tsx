import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Plus,
  Star,
  ChevronDown,
} from 'lucide-react';

import { Todo, Priority, ViewFilter, SortField, UserProfile } from './types';
import {
  fetchAllTodos,
  createTodoItem,
  updateTodoItem,
  deleteTodoItem,
} from './lib/storage';
import { checkSupabaseConnection } from './lib/supabase';
import { getCurrentUser, signOut as authSignOut, onAuthStateChange } from './lib/auth';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskCard } from './components/TaskCard';
import { TaskFormModal } from './components/TaskFormModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AuthModal } from './components/AuthModal';
import { EmptyState } from './components/EmptyState';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('todo_app_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('todo_app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Filter & Navigation states
  const [currentView, setCurrentView] = useState<ViewFilter>('all');
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [currentPriority, setCurrentPriority] = useState<Priority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('dueDate');

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickStarred, setQuickStarred] = useState(false);

  // Modals & UI States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check auth user on mount and subscribe to changes
  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user);
    });

    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        addToast(`Signed in as ${user.name || user.email}`, 'success');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addToast]);

  const handleSignOut = async () => {
    await authSignOut();
    setCurrentUser(null);
    addToast('Signed out of session', 'info');
  };

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const conn = await checkSupabaseConnection();
    setIsSupabaseConnected(conn.success && conn.tableExists !== false);

    const { todos: loaded, source } = await fetchAllTodos();
    setTodos(loaded);
    setIsLoading(false);

    if (source === 'supabase') {
      addToast('Synced with Supabase database', 'success');
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setEditingTask(null);
        setIsTaskModalOpen(true);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setIsTaskModalOpen(false);
        setIsSupabaseModalOpen(false);
        setIsAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute categories
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    todos.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [todos]);

  // Filtering & Sorting
  const filteredTodos = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return todos
      .filter((t) => {
        switch (currentView) {
          case 'today':
            if (t.dueDate !== todayStr) return false;
            break;
          case 'upcoming':
            if (!t.dueDate || t.dueDate <= todayStr || t.completed) return false;
            break;
          case 'starred':
            if (!t.isStarred) return false;
            break;
          case 'completed':
            if (!t.completed) return false;
            break;
          case 'all':
          default:
            break;
        }

        if (currentCategory !== 'all' && t.category !== currentCategory) {
          return false;
        }

        if (currentPriority !== 'all' && t.priority !== currentPriority) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q) || false;
          const matchCat = t.category.toLowerCase().includes(q);
          const matchSub = t.subtasks?.some((st) => st.title.toLowerCase().includes(q)) || false;
          if (!matchTitle && !matchDesc && !matchCat && !matchSub) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (currentView !== 'completed') {
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
        }

        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;

        switch (sortBy) {
          case 'dueDate': {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
          }
          case 'priority': {
            const weight: Record<Priority, number> = {
              urgent: 4,
              high: 3,
              medium: 2,
              low: 1,
            };
            return weight[b.priority] - weight[a.priority];
          }
          case 'title':
            return a.title.localeCompare(b.title);
          case 'createdAt':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [todos, currentView, currentCategory, currentPriority, searchQuery, sortBy]);

  // Handlers
  const handleSaveTask = async (
    taskData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingTask) {
      const { todo: updated } = await updateTodoItem(editingTask.id, {
        ...taskData,
        userId: currentUser?.id || editingTask.userId,
      });
      if (updated) {
        setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        addToast('Task updated', 'success');
      }
    } else {
      const { todo: created } = await createTodoItem({
        ...taskData,
        userId: currentUser?.id,
      });
      setTodos((prev) => [created, ...prev]);
      addToast('Task created', 'success');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const { todo: created } = await createTodoItem({
      title: quickTitle.trim(),
      completed: false,
      priority: quickPriority,
      category: currentCategory !== 'all' ? currentCategory : 'Work',
      subtasks: [],
      isStarred: quickStarred,
      userId: currentUser?.id,
    });

    setTodos((prev) => [created, ...prev]);
    setQuickTitle('');
    setQuickStarred(false);
  };

  const handleUpdatePriority = async (id: string, newPriority: Priority) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: newPriority } : t))
    );
    await updateTodoItem(id, { priority: newPriority });
  };

  const handleToggleComplete = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const newCompleted = !target.completed;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    );

    await updateTodoItem(id, { completed: newCompleted });
  };

  const handleToggleStar = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const newStarred = !target.isStarred;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isStarred: newStarred } : t))
    );

    await updateTodoItem(id, { isStarred: newStarred });
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const target = todos.find((t) => t.id === taskId);
    if (!target) return;

    const updatedSubtasks = target.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    setTodos((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t))
    );

    await updateTodoItem(taskId, { subtasks: updatedSubtasks });
  };

  const handleDeleteTask = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await deleteTodoItem(id);
    addToast('Task deleted', 'info');
  };

  const handleDuplicateTask = async (task: Todo) => {
    const { todo: created } = await createTodoItem({
      title: `${task.title} (Copy)`,
      description: task.description,
      completed: false,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      subtasks: task.subtasks.map((s) => ({ ...s, id: `copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      isStarred: task.isStarred,
      userId: currentUser?.id,
    });

    setTodos((prev) => [created, ...prev]);
    addToast('Task duplicated', 'success');
  };

  const handleClearFilters = () => {
    setCurrentView('all');
    setCurrentCategory('all');
    setCurrentPriority('all');
    setSearchQuery('');
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'today':
        return 'Today';
      case 'upcoming':
        return 'Upcoming';
      case 'starred':
        return 'Important';
      case 'completed':
        return 'Completed';
      default:
        return currentCategory !== 'all' ? currentCategory : 'All Tasks';
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c0d0e] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header with Auth integration */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onOpenNewTask={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        totalTasks={todos.length}
        completedTasks={completedCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          currentCategory={currentCategory}
          onCategoryChange={setCurrentCategory}
          currentPriority={currentPriority}
          onPriorityChange={setCurrentPriority}
          categories={existingCategories}
          todos={todos}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          isSupabaseConnected={isSupabaseConnected}
        />

        {/* Tasks View Feed */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header Row: Title & Task Count */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                {getViewTitle()}
              </h2>
              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                {filteredTodos.length}
              </span>
            </div>

            {/* Subtle filter reset if active */}
            {(currentCategory !== 'all' || currentPriority !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Inline Quick Add Input */}
          <form
            onSubmit={handleQuickAdd}
            className="mb-4 bg-white dark:bg-[#13151a] border border-neutral-200/80 dark:border-white/[0.06] focus-within:border-neutral-400 dark:focus-within:border-neutral-600 rounded-lg p-2 shadow-2xs transition-all"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0" />
              <input
                id="quick-add-task-input"
                type="text"
                placeholder="Add task to list..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full py-1 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
              />
            </div>

            {/* Quick selectors row */}
            <div className="mt-1.5 pt-1.5 border-t border-neutral-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 px-1">Priority:</span>
                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => {
                  const active = quickPriority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      id={`quick-priority-${p}`}
                      onClick={() => setQuickPriority(p)}
                      className={`px-1.5 py-0.5 rounded text-[11px] capitalize transition-colors cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="quick-star-btn"
                  onClick={() => setQuickStarred(!quickStarred)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    quickStarred
                      ? 'text-amber-500'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                  }`}
                  title="Mark important"
                >
                  <Star className={`w-3 h-3 ${quickStarred ? 'fill-amber-500' : ''}`} />
                  <span>Important</span>
                </button>

                <button
                  id="quick-add-submit-btn"
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="px-2.5 py-1 text-[11px] font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 disabled:opacity-30 rounded transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </form>

          {/* Task Feed */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-neutral-400 dark:border-neutral-600 border-t-transparent animate-spin" />
              <p className="text-xs text-neutral-400">Loading tasks...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <EmptyState
              hasFilters={currentCategory !== 'all' || currentPriority !== 'all' || Boolean(searchQuery)}
              onClearFilters={handleClearFilters}
              onAddTask={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {filteredTodos.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onToggleStar={handleToggleStar}
                    onUpdatePriority={handleUpdatePriority}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                    onDuplicate={handleDuplicateTask}
                    onToggleSubtask={handleToggleSubtask}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Task Create / Edit Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
        existingCategories={existingCategories}
      />

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={() => {
          loadData();
          getCurrentUser().then((u) => setCurrentUser(u));
        }}
      />

      {/* Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
