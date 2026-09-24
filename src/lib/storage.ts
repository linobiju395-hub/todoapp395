import { Todo, Priority } from '../types';
import { getSupabaseClient } from './supabase';

// Deprecated legacy global key - clean it up to prevent demo task contamination
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('todo_app_items_v1');
  } catch {
    // Ignore cleanup error
  }
}

// Start with an empty list so only user-created tasks exist
export const INITIAL_TODOS: Todo[] = [];

const DUMMY_TITLES = new Set([
  'Setup Supabase backend database schema',
  'Review component architecture & UI polish',
  'Weekly grocery shopping & meal prep',
  'Prepare quarterly product roadmap presentation',
  'Schedule quarterly dental hygiene appointment',
]);
const DUMMY_IDS = new Set(['1', '2', '3', '4', '5']);

export function getUserStorageKey(userId?: string): string {
  if (userId) {
    return `todo_app_items_usr_${userId}`;
  }
  return 'todo_app_items_unauthed';
}

export function getLocalTodos(userId?: string): Todo[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any lingering mock/demo tasks
    const cleaned = parsed.filter(
      (t) => !(DUMMY_IDS.has(String(t.id)) || DUMMY_TITLES.has(t.title))
    );

    if (cleaned.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading local todos:', e);
    return [];
  }
}

export function saveLocalTodos(todos: Todo[], userId?: string) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(todos));
  } catch (e) {
    console.error('Error saving local todos:', e);
  }
}

// Map Supabase DB row to frontend Todo interface
function mapDbToTodo(row: any): Todo {
  return {
    id: String(row.id),
    title: row.title || '',
    description: row.description || '',
    completed: Boolean(row.completed),
    priority: (row.priority === 'medium' ? 'basic' : (row.priority as Priority)) || 'basic',
    category: row.category || 'General',
    dueDate: row.due_date || undefined,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    isStarred: Boolean(row.is_starred),
    userId: row.user_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Map frontend Todo to Supabase DB payload
function mapTodoToDb(todo: Partial<Todo>): any {
  const payload: any = {};
  if (todo.title !== undefined) payload.title = todo.title;
  if (todo.description !== undefined) payload.description = todo.description;
  if (todo.completed !== undefined) payload.completed = todo.completed;
  if (todo.priority !== undefined) payload.priority = todo.priority === 'medium' ? 'basic' : todo.priority;
  if (todo.category !== undefined) payload.category = todo.category;
  if (todo.dueDate !== undefined) payload.due_date = todo.dueDate || null;
  if (todo.subtasks !== undefined) payload.subtasks = todo.subtasks;
  if (todo.isStarred !== undefined) payload.is_starred = todo.isStarred;
  if (todo.userId !== undefined) payload.user_id = todo.userId;
  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function fetchAllTodos(userId?: string): Promise<{ todos: Todo[]; source: 'supabase' | 'local'; error?: string }> {
  // If not logged in, return blank list immediately
  if (!userId) {
    return { todos: [], source: 'local' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      // Query ONLY tasks that belong to this specific user ID
      const { data, error } = await client
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Strip out any dummy seed items
        const mapped = data
          .map(mapDbToTodo)
          .filter((t) => !(DUMMY_IDS.has(String(t.id)) || DUMMY_TITLES.has(t.title)));
        saveLocalTodos(mapped, userId);
        return { todos: mapped, source: 'supabase' };
      } else if (error) {
        console.warn('Supabase query error, falling back to user local storage:', error.message);
        return {
          todos: getLocalTodos(userId),
          source: 'local',
          error: error.message,
        };
      }
    } catch (err: any) {
      console.warn('Supabase connection failed, falling back to user local storage:', err);
      return {
        todos: getLocalTodos(userId),
        source: 'local',
        error: err.message,
      };
    }
  }

  return { todos: getLocalTodos(userId), source: 'local' };
}

export async function clearAllTodos(userId?: string): Promise<void> {
  const client = getSupabaseClient();
  if (client && userId) {
    try {
      await client.from('todos').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Error clearing remote todos:', e);
    }
  }
  if (typeof window !== 'undefined' && userId) {
    localStorage.removeItem(getUserStorageKey(userId));
  }
}

export async function createTodoItem(
  todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
  userId?: string
): Promise<{ todo: Todo; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const effectiveUserId = userId || todoData.userId;

  if (client && effectiveUserId) {
    try {
      const dbPayload: any = {
        title: todoData.title,
        description: todoData.description || '',
        completed: todoData.completed || false,
        priority: todoData.priority,
        category: todoData.category || 'General',
        due_date: todoData.dueDate || null,
        subtasks: todoData.subtasks || [],
        is_starred: todoData.isStarred || false,
        user_id: effectiveUserId,
      };

      const { data, error } = await client.from('todos').insert([dbPayload]).select().single();

      if (!error && data) {
        const newTodo = mapDbToTodo(data);
        const current = getLocalTodos(effectiveUserId);
        saveLocalTodos([newTodo, ...current], effectiveUserId);
        return { todo: newTodo, source: 'supabase' };
      }
    } catch (e) {
      console.warn('Failed to insert in Supabase, using local fallback:', e);
    }
  }

  // Fallback to local
  const newTodo: Todo = {
    ...todoData,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: effectiveUserId,
    createdAt: now,
    updatedAt: now,
  };

  const current = getLocalTodos(effectiveUserId);
  saveLocalTodos([newTodo, ...current], effectiveUserId);
  return { todo: newTodo, source: 'local' };
}

export async function updateTodoItem(
  id: string,
  updates: Partial<Todo>,
  userId?: string
): Promise<{ todo?: Todo; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  if (client) {
    try {
      const dbPayload = mapTodoToDb(updates);
      let query = client.from('todos').update(dbPayload).eq('id', id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.select().single();

      if (!error && data) {
        const updated = mapDbToTodo(data);
        const current = getLocalTodos(userId).map((t) => (t.id === id ? updated : t));
        saveLocalTodos(current, userId);
        return { todo: updated, source: 'supabase' };
      }
    } catch (e) {
      console.warn('Failed to update in Supabase, using local fallback:', e);
    }
  }

  // Local fallback
  const current = getLocalTodos(userId);
  let updatedTodo: Todo | undefined;
  const updatedList = current.map((t) => {
    if (t.id === id) {
      updatedTodo = { ...t, ...updates, updatedAt: now };
      return updatedTodo;
    }
    return t;
  });

  saveLocalTodos(updatedList, userId);
  return { todo: updatedTodo, source: 'local' };
}

export async function deleteTodoItem(
  id: string,
  userId?: string
): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      let query = client.from('todos').delete().eq('id', id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { error } = await query;
      if (!error) {
        const current = getLocalTodos(userId).filter((t) => t.id !== id);
        saveLocalTodos(current, userId);
        return { success: true, source: 'supabase' };
      }
    } catch (e) {
      console.warn('Failed to delete in Supabase, using local fallback:', e);
    }
  }

  const current = getLocalTodos(userId).filter((t) => t.id !== id);
  saveLocalTodos(current, userId);
  return { success: true, source: 'local' };
}
