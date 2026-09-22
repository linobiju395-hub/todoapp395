import { useState } from 'react';
import {
  Inbox,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { ViewFilter, Priority, Todo } from '../types';

interface SidebarProps {
  currentView: ViewFilter;
  onViewChange: (v: ViewFilter) => void;
  currentCategory: string;
  onCategoryChange: (cat: string) => void;
  currentPriority: Priority | 'all';
  onPriorityChange: (p: Priority | 'all') => void;
  categories: string[];
  todos: Todo[];
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
}

export function Sidebar({
  currentView,
  onViewChange,
  currentCategory,
  onCategoryChange,
  currentPriority,
  onPriorityChange,
  categories,
  todos,
}: SidebarProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const allCount = todos.length;
  const todayCount = todos.filter((t) => t.dueDate === todayStr && !t.completed).length;
  const upcomingCount = todos.filter((t) => t.dueDate && t.dueDate > todayStr && !t.completed).length;
  const starredCount = todos.filter((t) => t.isStarred && !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  const viewItems = [
    { id: 'all' as ViewFilter, label: 'All Tasks', icon: Inbox, count: allCount },
    { id: 'today' as ViewFilter, label: 'Today', icon: Calendar, count: todayCount },
    { id: 'upcoming' as ViewFilter, label: 'Upcoming', icon: Clock, count: upcomingCount },
    { id: 'starred' as ViewFilter, label: 'Important', icon: Star, count: starredCount },
    { id: 'completed' as ViewFilter, label: 'Completed', icon: CheckCircle2, count: completedCount },
  ];

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onCategoryChange(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCat(false);
    }
  };

  return (
    <aside className="w-full md:w-56 shrink-0 flex flex-col gap-6 py-1 select-none">
      {/* Primary Views */}
      <div className="space-y-0.5">
        <div className="px-2 mb-1.5 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Views
        </div>
        {viewItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-view-${item.id}`}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                active
                  ? 'bg-neutral-200/70 dark:bg-white/[0.08] text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    active
                      ? 'text-neutral-900 dark:text-white font-medium'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Categories */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Categories
          </span>
          <button
            id="toggle-add-category-btn"
            onClick={() => setShowAddCat(!showAddCat)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded transition-colors cursor-pointer"
            title="New category"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <button
          id="cat-all-btn"
          onClick={() => onCategoryChange('all')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
            currentCategory === 'all'
              ? 'bg-neutral-200/70 dark:bg-white/[0.08] text-neutral-900 dark:text-white font-medium'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <span>All categories</span>
          <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{todos.length}</span>
        </button>

        {categories.map((cat) => {
          const active = currentCategory === cat;
          const count = todos.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              id={`cat-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onCategoryChange(cat)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                active
                  ? 'bg-neutral-200/70 dark:bg-white/[0.08] text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="truncate">{cat}</span>
              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{count}</span>
            </button>
          );
        })}

        {showAddCat && (
          <form onSubmit={handleAddCategorySubmit} className="pt-1 px-1">
            <div className="flex items-center gap-1.5">
              <input
                id="inline-new-category-input"
                type="text"
                autoFocus
                placeholder="Category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white dark:bg-[#15171c] border border-neutral-200 dark:border-white/[0.12] rounded text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 rounded cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Priority Filters */}
      <div className="space-y-1">
        <div className="px-2 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
          Priority
        </div>
        <div className="flex flex-wrap gap-1 px-2">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => {
            const active = currentPriority === p;
            return (
              <button
                key={p}
                id={`filter-priority-${p}`}
                onClick={() => onPriorityChange(p)}
                className={`px-2 py-0.5 text-[11px] rounded capitalize transition-colors cursor-pointer ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtle Progress Metric */}
      {allCount > 0 && (
        <div className="mt-auto px-2 pt-4 border-t border-neutral-200/80 dark:border-white/[0.06] text-xs text-neutral-500">
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span>Completed</span>
            <span className="font-mono">{completedCount}/{allCount}</span>
          </div>
          <div className="w-full h-1 bg-neutral-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 dark:bg-white transition-all duration-300"
              style={{ width: `${Math.round((completedCount / allCount) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
