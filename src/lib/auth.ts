import { UserProfile } from '../types';
import { getSupabaseClient } from './supabase';

const LOCAL_USER_KEY = 'todo_app_auth_user_v1';

const authListeners: Array<(user: UserProfile | null) => void> = [];

function notifyListeners(user: UserProfile | null) {
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.error('Error in auth listener:', err);
    }
  });
}

/**
 * Get the currently logged-in user.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.getUser();

      if (!error && data?.user) {
        const u = data.user;

        return {
          id: u.id,
          email: u.email || 'user@example.com',
          name:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url,
          provider: 'supabase',
        };
      }
    } catch (err) {
      console.warn('Supabase auth check error:', err);
    }
  }

  // Local fallback
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_USER_KEY);

    if (raw) {
      try {
        return JSON.parse(raw) as UserProfile;
      } catch {
        localStorage.removeItem(LOCAL_USER_KEY);
      }
    }
  }

  return null;
}

/**
 * Send a 6-digit OTP code to the user's email.
 */
export async function sendOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: 'Please enter a valid email address',
    };
  }

  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      error: 'Supabase is not configured',
    };
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to send verification code',
    };
  }
}

/**
 * Verify the 6-digit OTP code.
 */
export async function verifyOtp(
  email: string,
  code: string
): Promise<{ user: UserProfile | null; error?: string }> {
  if (!email || !email.includes('@')) {
    return {
      user: null,
      error: 'Please enter a valid email address',
    };
  }

  if (!/^\d{6}$/.test(code)) {
    return {
      user: null,
      error: 'Please enter the 6-digit verification code',
    };
  }

  const client = getSupabaseClient();

  if (!client) {
    return {
      user: null,
      error: 'Supabase is not configured',
    };
  }

  try {
    const { data, error } = await client.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'email',
    });

    if (error) {
      return {
        user: null,
        error: error.message,
      };
    }

    if (data?.user) {
      const u = data.user;

      const profile: UserProfile = {
        id: u.id,
        email: u.email || email,
        name:
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split('@')[0],
        avatarUrl: u.user_metadata?.avatar_url,
        provider: 'supabase',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      }

      notifyListeners(profile);

      return {
        user: profile,
      };
    }

    return {
      user: null,
      error: 'Verification failed. Please try again.',
    };
  } catch (err: any) {
    return {
      user: null,
      error: err?.message || 'Failed to verify code',
    };
  }
}

/**
 * Sign out of current session.
 */
export async function signOut(): Promise<void> {
  const client = getSupabaseClient();

  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_USER_KEY);
  }

  notifyListeners(null);
}

/**
 * Subscribe to authentication state changes.
 */
export function onAuthStateChange(
  callback: (user: UserProfile | null) => void
): () => void {
  authListeners.push(callback);

  const client = getSupabaseClient();

  let supabaseUnsub: (() => void) | null = null;

  if (client) {
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;

        const profile: UserProfile = {
          id: u.id,
          email: u.email || 'user@example.com',
          name:
            u.user_metadata?.full_name ||
            u.email?.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url,
          provider: 'supabase',
        };

        callback(profile);
      } else {
        callback(null);
      }
    });

    supabaseUnsub = () => {
      data.subscription.unsubscribe();
    };
  }

  return () => {
    const index = authListeners.indexOf(callback);

    if (index > -1) {
      authListeners.splice(index, 1);
    }

    if (supabaseUnsub) {
      supabaseUnsub();
    }
  };
}
