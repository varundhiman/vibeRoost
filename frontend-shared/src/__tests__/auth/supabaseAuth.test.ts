import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAuthService } from '../../auth/supabaseAuth';

// Mock Supabase client
vi.mock('@supabase/supabase-js');

describe('SupabaseAuthService', () => {
  let mockSupabaseClient: any;
  let authService: SupabaseAuthService;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: '123' }, access_token: 'token' } }
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } }
        }),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        refreshSession: vi.fn(),
      },
    };

    (createClient as any).mockReturnValue(mockSupabaseClient);

    authService = new SupabaseAuthService({
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-key',
    });
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.signUp('test@example.com', 'password');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: { data: undefined },
      });
    });

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already exists' };
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await authService.signUp('test@example.com', 'password');

      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.signIn('test@example.com', 'password');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await authService.signIn('test@example.com', 'password');

      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signInWithProvider', () => {
    it('should sign in with OAuth provider', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        error: null,
      });

      const result = await authService.signInWithProvider('google');

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
      });
    });
  });

  describe('getAccessToken', () => {
    it('should return current access token', async () => {
      // Set up current session
      authService['currentSession'] = {
        access_token: 'current-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      } as any;

      const token = await authService.getAccessToken();

      expect(token).toBe('current-token');
    });

    it('should refresh expired token', async () => {
      // Set up expired session
      authService['currentSession'] = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      } as any;

      const newSession = {
        access_token: 'new-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      const token = await authService.getAccessToken();

      expect(token).toBe('new-token');
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
      expect(authService['currentSession']).toEqual(newSession);
    });

    it('should return null if no session', async () => {
      authService['currentSession'] = null;

      const token = await authService.getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      authService['currentUser'] = { id: '123' } as any;

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      authService['currentUser'] = null;

      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});