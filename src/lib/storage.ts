import { Todo, Priority } from '../types';
import { getSupabaseClient } from './supabase';

const LOCAL_STORAGE_KEY = 'todo_app_items_v1';

// Seed data so the app has working realistic tasks immediately on load
const INITIAL_TODOS: Todo[] = [
  {
    id: '1',
    title: 'Setup Supabase backend database schema',
    description: 'Execute the SQL migration schema in the Supabase SQL editor to enable remote sync and real-time updates.',
    completed: false,
    priority: 'medium',
    category: 'Engineering',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    isStarred: false,
    subtasks: [
      { id: 'st-1', title: 'Open Supabase Project Dashboard', completed: true },
      { id: 'st-2', title: 'Copy provided SQL script', completed: true },
      { id: 'st-3', title: 'Run query in SQL editor', completed: false },
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: '2',
    title: 'Review component architecture & UI polish',
    description: 'Verify keyboard navigation (Cmd+K), responsive sidebar, theme toggle, and task interactions.',
    completed: false,
    priority: 'low',
    category: 'Design',
    dueDate: new Date().toISOString().split('T')[0], // Today
    isStarred: false,
    subtasks: [
      { id: 'st-4', title: 'Check mobile responsive layout', completed: true },
      { id: 'st-5', title: 'Test filter & sort performance', completed: false },
      { id: 'st-6', title: 'Verify task completion states', completed: false },
    ],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: '3',
    title: 'Weekly grocery shopping & meal prep',
    description: 'Fresh organic greens, olive oil, Greek yogurt, sourdough bread, and coffee beans.',
    completed: false,
    priority: 'medium',
    category: 'Personal',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    isStarred: false,
    subtasks: [
      { id: 'st-7', title: 'Write list of ingredients', completed: true },
      { id: 'st-8', title: 'Visit farmers market', completed: false },
    ],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: '4',
    title: 'Prepare quarterly product roadmap presentation',
    description: 'Summarize core performance metrics, customer satisfaction feedback, and Q3 deliverables.',
    completed: true,
    priority: 'medium',
    category: 'Work',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    isStarred: false,
    subtasks: [
      { id: 'st-9', title: 'Draft slide deck outline', completed: true },
      { id: 'st-10', title: 'Review with engineering lead', completed: true },
    ],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '5',
    title: 'Schedule quarterly dental hygiene appointment',
    description: 'Call Dr. Martinez dental clinic for routine checkup.',
    completed: false,
    priority: 'low',
    category: 'Personal',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    isStarred: false,
    subtasks: [],
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
];

export function getLocalTodos(): Todo[] {
  if (typeof window === 'undefined') return INITIAL_TODOS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TODOS));
      return INITIAL_TODOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TODOS;
  } catch (e) {
    console.error('Error reading local todos:', e);
    return INITIAL_TODOS;
  }
}

export function saveLocalTodos(todos: Todo[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
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
    priority: (row.priority as Priority) || 'medium',
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
  if (todo.priority !== undefined) payload.priority = todo.priority;
  if (todo.category !== undefined) payload.category = todo.category;
  if (todo.dueDate !== undefined) payload.due_date = todo.dueDate || null;
  if (todo.subtasks !== undefined) payload.subtasks = todo.subtasks;
  if (todo.isStarred !== undefined) payload.is_starred = todo.isStarred;
  if (todo.userId !== undefined) payload.user_id = todo.userId;
  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function fetchAllTodos(): Promise<{ todos: Todo[]; source: 'supabase' | 'local'; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDbToTodo);
        // Cache in local storage as offline fallback
        saveLocalTodos(mapped);
        return { todos: mapped, source: 'supabase' };
      } else if (error) {
        console.warn('Supabase query error, falling back to local storage:', error.message);
        return {
          todos: getLocalTodos(),
          source: 'local',
          error: error.message,
        };
      }
    } catch (err: any) {
      console.warn('Supabase connection failed, falling back to local storage:', err);
      return {
        todos: getLocalTodos(),
        source: 'local',
        error: err.message,
      };
    }
  }

  return { todos: getLocalTodos(), source: 'local' };
}

export async function createTodoItem(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ todo: Todo; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  if (client) {
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
      };

      if (todoData.userId) {
        dbPayload.user_id = todoData.userId;
      }

      const { data, error } = await client.from('todos').insert([dbPayload]).select().single();

      if (!error && data) {
        const newTodo = mapDbToTodo(data);
        const current = getLocalTodos();
        saveLocalTodos([newTodo, ...current]);
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
    createdAt: now,
    updatedAt: now,
  };

  const current = getLocalTodos();
  saveLocalTodos([newTodo, ...current]);
  return { todo: newTodo, source: 'local' };
}

export async function updateTodoItem(id: string, updates: Partial<Todo>): Promise<{ todo?: Todo; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  if (client) {
    try {
      const dbPayload = mapTodoToDb(updates);
      const { data, error } = await client
        .from('todos')
        .update(dbPayload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated = mapDbToTodo(data);
        const current = getLocalTodos().map((t) => (t.id === id ? updated : t));
        saveLocalTodos(current);
        return { todo: updated, source: 'supabase' };
      }
    } catch (e) {
      console.warn('Failed to update in Supabase, using local fallback:', e);
    }
  }

  // Local fallback
  const current = getLocalTodos();
  let updatedTodo: Todo | undefined;
  const updatedList = current.map((t) => {
    if (t.id === id) {
      updatedTodo = { ...t, ...updates, updatedAt: now };
      return updatedTodo;
    }
    return t;
  });

  saveLocalTodos(updatedList);
  return { todo: updatedTodo, source: 'local' };
}

export async function deleteTodoItem(id: string): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client.from('todos').delete().eq('id', id);
      if (!error) {
        const current = getLocalTodos().filter((t) => t.id !== id);
        saveLocalTodos(current);
        return { success: true, source: 'supabase' };
      }
    } catch (e) {
      console.warn('Failed to delete in Supabase, using local fallback:', e);
    }
  }

  const current = getLocalTodos().filter((t) => t.id !== id);
  saveLocalTodos(current);
  return { success: true, source: 'local' };
}
