export type Priority = 'low' | 'basic' | 'high' | 'urgent' | 'medium';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate?: string; // YYYY-MM-DD
  subtasks: Subtask[];
  isStarred?: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewFilter = 'all' | 'today' | 'upcoming' | 'completed' | 'starred';

export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title';

export interface FilterOptions {
  view: ViewFilter;
  category: string | 'all';
  priority: Priority | 'all';
  searchQuery: string;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: 'supabase' | 'local';
}
