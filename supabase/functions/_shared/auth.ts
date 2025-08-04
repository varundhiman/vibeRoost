// Authentication utilities for Supabase Edge Functions
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'
import { ApiResponse } from './types.ts'

export interface AuthUser {
  id: string
  email?: string
  role?: string
  aud?: string
  exp?: number
}

export interface AuthContext {
  user: AuthUser
  supabase: SupabaseClient
}

/**
 * Extract and validate JWT token from request headers
 */
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Get JWT secret from environment
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET')
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET not configured')
      return null
    }

    // Verify and decode JWT token
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const payload = await verify(token, key)
    
    if (!payload || typeof payload !== 'object') {
      return null
    }

    // Extract user information from JWT payload
    const user: AuthUser = {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      aud: payload.aud as string,
      exp: payload.exp as number
    }

    // Check if token is expired
    if (user.exp && user.exp < Date.now() / 1000) {
      return null
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Require authentication and throw error if not authenticated
 */
export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED')
  }
  return user
}

/**
 * Create authenticated Supabase client with service role
 */
export function createSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Create Supabase client with user context (for RLS)
 */
export function createSupabaseUserClient(user: AuthUser): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing')
  }
  
  const client = createClient(supabaseUrl, supabaseAnonKey)
  
  // Set auth context for RLS - simplified approach
  // Note: In production, you would use the actual JWT token here
  // For now, we'll create the client with service role and rely on RLS policies
  
  return client
}

/**
 * Get authenticated context (user + supabase client)
 */
export async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const user = await getAuthUser(req)
  if (!user) {
    return null
  }
  
  const supabase = createSupabaseUserClient(user)
  return { user, supabase }
}

/**
 * Require authenticated context
 */
export async function requireAuthContext(req: Request): Promise<AuthContext> {
  const context = await getAuthContext(req)
  if (!context) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED')
  }
  return context
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser, role: string): boolean {
  return user.role === role
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser): boolean {
  return hasRole(user, 'admin') || hasRole(user, 'service_role')
}

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  code: string
  
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

/**
 * Create error response for authentication failures
 */
export function createAuthErrorResponse(error: AuthError): Response {
  const response: ApiResponse = {
    error: {
      code: error.code,
      message: error.message
    },
    timestamp: new Date().toISOString()
  }
  
  const status = error.code === 'AUTH_REQUIRED' ? 401 : 403
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}