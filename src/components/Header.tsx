import { useState } from 'react';
import {
  Search,
  Database,
  SlidersHorizontal,
  CheckSquare,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import { SortField, UserProfile } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: SortField;
  onSortChange: (sort: SortField) => void;
  onOpenNewTask?: () => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
  totalTasks: number;
  completedTasks: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenChangePassword?: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onOpenNewTask,
  onOpenSupabaseModal,
  isSupabaseConnected,
  theme,
  onToggleTheme,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onOpenChangePassword,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-white/[0.08] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 transition-colors">
            <CheckSquare className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
            Tasks
          </span>
        </div>

        {/* Center: Command-style Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search or jump to task..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8.5 pr-14 py-1.5 text-xs bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:bg-white dark:focus:bg-[#15171c] transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none text-[10px] font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-200/60 dark:bg-white/[0.08] px-1 py-0.5 rounded">
              <span>/</span>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-7 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Switcher */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-md border border-neutral-200 dark:border-white/[0.08] bg-transparent hover:bg-neutral-100 dark:hover:bg-white/[0.05] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Database Connection Status Button */}
          <button
            id="supabase-status-pill-btn"
            type="button"
            onClick={onOpenSupabaseModal}
            className={`h-8 flex items-center gap-1.5 px-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
              isSupabaseConnected
                ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                : 'border-neutral-200 dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.05]'
            }`}
            title="Supabase Database Settings"
          >
            <Database className="w-3.5 h-3.5 opacity-80" />
            <span className="hidden sm:inline text-[11px]">
              {isSupabaseConnected ? 'Connected' : 'Database'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'
              }`}
            />
          </button>

          {/* Sort Dropdown */}
          <div className="hidden lg:flex items-center gap-1 border border-neutral-200 dark:border-white/[0.08] rounded-md h-8 px-2 text-xs text-neutral-600 dark:text-neutral-400">
            <SlidersHorizontal className="w-3 h-3 opacity-70" />
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortField)}
              className="bg-transparent text-[11px] text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer py-1"
            >
              <option value="dueDate" className="bg-white dark:bg-[#15171c] text-neutral-900 dark:text-neutral-100">
                Due date
              </option>
              <option value="priority" className="bg-white dark:bg-[#15171c] text-neutral-900 dark:text-neutral-100">
                Priority
              </option>
              <option value="createdAt" className="bg-white dark:bg-[#15171c] text-neutral-900 dark:text-neutral-100">
                Created date
              </option>
              <option value="title" className="bg-white dark:bg-[#15171c] text-neutral-900 dark:text-neutral-100">
                Alphabetical
              </option>
            </select>
          </div>

          {/* User Auth Section */}
          {currentUser ? (
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-8 flex items-center gap-1.5 px-2 rounded-md border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-white/[0.05] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[10px] font-semibold">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-[11px] max-w-20 truncate">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/[0.1] rounded-lg shadow-xl z-30 py-1.5 text-xs">
                    <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-white/[0.06]">
                      <div className="font-semibold text-neutral-900 dark:text-white truncate">
                        {currentUser.name || 'User'}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1 text-[10px] text-neutral-400 capitalize">
                        {currentUser.provider === 'supabase' ? 'Supabase Account' : 'Local Session'}
                      </div>
                    </div>

                    <button
                      id="user-change-password-btn"
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenChangePassword?.();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 opacity-70" />
                      <span>Change Password</span>
                    </button>

                    <button
                      id="user-signout-btn"
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              id="header-signin-btn"
              type="button"
              onClick={onOpenAuthModal}
              className="h-8 flex items-center gap-1.5 px-2.5 rounded-md border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-white/[0.05] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 opacity-70" />
              <span className="text-[11px]">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="md:hidden px-4 pb-2.5">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3" />
          <input
            id="mobile-search-input"
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>
    </header>
  );
}
