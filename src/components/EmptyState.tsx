import { CheckSquare, Plus, Search, FilterX } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onAddTask: () => void;
}

export function EmptyState({ hasFilters, onClearFilters, onAddTask }: EmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center rounded-lg border border-dashed border-neutral-200 dark:border-white/[0.08] flex flex-col items-center justify-center transition-colors">
      <div className="w-9 h-9 rounded-md bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] flex items-center justify-center mb-3 text-neutral-400 dark:text-neutral-500">
        {hasFilters ? (
          <Search className="w-4 h-4" />
        ) : (
          <CheckSquare className="w-4 h-4 stroke-[1.8]" />
        )}
      </div>

      <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
        {hasFilters ? 'No tasks match current filter' : 'No tasks'}
      </p>

      <p className="mt-1 text-[11px] text-neutral-500 max-w-xs">
        {hasFilters
          ? 'Reset filters or search query to see other tasks.'
          : 'Add a new task to get started.'}
      </p>

      <div className="mt-4 flex items-center gap-2">
        {hasFilters && (
          <button
            id="empty-state-clear-filters-btn"
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-200 dark:border-white/[0.1] text-neutral-600 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <FilterX className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
        <button
          id="empty-state-add-task-btn"
          type="button"
          onClick={onAddTask}
          className="flex items-center gap-1 px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          <span>New task</span>
        </button>
      </div>
    </div>
  );
}
