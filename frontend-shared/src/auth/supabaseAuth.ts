import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '../types';

export interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export class SupabaseAuthService {
  private supabase: SupabaseClient;
  private currentUser: SupabaseUser | null = null;
  private currentSession: Session | null = null;

  constructor(config: AuthConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    this.initializeAuth();
  }

  private convertToAppUser(supabaseUser: SupabaseUser | null): User | null {
    if (!supabaseUser) return null;
    
    // Convert Supabase user to our app user format
    // For now, we'll use mock data since we don't have the full user profile yet
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
      displayName: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name || 'User',
      profilePicture: supabaseUser.user_metadata?.avatar_url,
      createdAt: supabaseUser.created_at,
      privacySettings: {
        profileVisibility: 'PUBLIC' as any,
        allowDirectMessages: true,
        showInSearch: true,
      },
    };
  }

  private async initializeAuth(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentSession = session;
    this.currentUser = session?.user || null;

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession = session;
      this.currentUser = session?.user || null;
    });
  }

  async signUp(email: string, password: string, metadata?: any): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });
    return { user: this.convertToAppUser(data.user), error };
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: this.convertToAppUser(data.user), error };
  }

  async signInWithProvider(provider: 'google' | 'facebook' | 'apple'): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider,
    });
    return { error };
  }

  async signOut(): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async refreshSession(): Promise<{ session: Session | null; error: any }> {
    const { data, error } = await this.supabase.auth.refreshSession();
    return { session: data.session, error };
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.currentSession) {
      return null;
    }

    // Check if token is expired and refresh if needed
    const now = Math.floor(Date.now() / 1000);
    if (this.currentSession.expires_at && this.currentSession.expires_at < now) {
      const { session, error } = await this.refreshSession();
      if (error || !session) {
        return null;
      }
      this.currentSession = session;
      this.currentUser = session.user;
    }

    return this.currentSession.access_token;
  }

  getCurrentUser(): User | null {
    return this.convertToAppUser(this.currentUser);
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
      callback(this.convertToAppUser(session?.user || null));
    });

    return () => subscription.unsubscribe();
  }
}