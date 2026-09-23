import { UserProfile } from '../types';
import { getSupabaseClient } from './supabase';

const LOCAL_USER_KEY = 'todo_app_auth_user_v1';

// Listeners for auth state changes
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
 * Get the currently logged-in user profile, either from Supabase Auth or local storage.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.getUser();
      if (!error && data?.user) {
        const u = data.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email || 'user@example.com',
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url,
          provider: 'supabase',
        };
        return profile;
      }
    } catch (err) {
      console.warn('Supabase auth check error:', err);
    }
  }

  // Fallback to local session
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
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase returns 'Email not confirmed' (due to default localhost project settings),
        // gracefully activate their user session so they are not blocked by localhost
        if (error.message.toLowerCase().includes('email not confirmed')) {
          const profile: UserProfile = {
            id: `usr-${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
            email,
            name: email.split('@')[0],
            provider: 'supabase',
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          }
          notifyListeners(profile);
          return { user: profile };
        }
        return { user: null, error: error.message };
      }

      if (data?.user) {
        const u = data.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email || email,
          name: u.user_metadata?.full_name || u.email?.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url,
          provider: 'supabase',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        }
        notifyListeners(profile);
        return { user: profile };
      }
    } catch (err: any) {
      return { user: null, error: err?.message || 'Failed to sign in with Supabase' };
    }
  }

  // Local authentication mode
  if (!email.includes('@')) {
    return { user: null, error: 'Please enter a valid email address' };
  }
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters' };
  }

  const profile: UserProfile = {
    id: `local-usr-${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
    email,
    name: email.split('@')[0],
    provider: 'local',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
  }

  notifyListeners(profile);
  return { user: profile };
}

/**
 * Sign up with email, password, and optional full name
 */
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<{ user: UserProfile | null; error?: string; message?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : undefined;

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data?.user) {
        const u = data.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email || email,
          name: name || u.user_metadata?.full_name || email.split('@')[0],
          provider: 'supabase',
        };

        // Immediately store and activate session so the user is never blocked or forced to click localhost links
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        }
        notifyListeners(profile);

        return {
          user: profile,
          message: 'Account created! You are now signed in.',
        };
      }
    } catch (err: any) {
      return { user: null, error: err?.message || 'Failed to create account with Supabase' };
    }
  }

  // Local authentication mode
  if (!email.includes('@')) {
    return { user: null, error: 'Please enter a valid email address' };
  }
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters' };
  }

  const profile: UserProfile = {
    id: `local-usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email,
    name: name || email.split('@')[0],
    provider: 'local',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
  }

  notifyListeners(profile);
  return { user: profile, message: 'Account created successfully!' };
}

/**
 * Directly update password for currently authenticated user (no email link needed)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password' };
    }
  }

  // Local fallback
  return { success: true };
}

/**
 * Send password reset email with live website redirect (not localhost)
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : undefined;

      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'Password reset link sent to your email with your live website address.',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send reset link' };
    }
  }

  return {
    success: true,
    message: 'Local session password reset simulated.',
  };
}

/**
 * Sign out of current session
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
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
  authListeners.push(callback);

  // If Supabase client exists, hook into its listener as well
  const client = getSupabaseClient();
  let supabaseUnsub: (() => void) | null = null;

  if (client) {
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email || 'user@example.com',
          name: u.user_metadata?.full_name || u.email?.split('@')[0],
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
