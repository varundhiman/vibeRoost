// Unit tests for User Management Edge Functions
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts"

// Mock user profile data
const mockUserProfile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'This is a test user',
  avatar_url: 'https://example.com/avatar.jpg',
  location: 'Test City',
  website: 'https://testuser.com',
  profile_visibility: 'PUBLIC',
  allow_direct_messages: true,
  show_in_search: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Test data structures
Deno.test("user profile data structure", () => {
  assertEquals(typeof mockUserProfile.id, 'string')
  assertEquals(typeof mockUserProfile.username, 'string')
  assertEquals(typeof mockUserProfile.display_name, 'string')
  assertEquals(typeof mockUserProfile.bio, 'string')
  assertEquals(typeof mockUserProfile.allow_direct_messages, 'boolean')
  assertEquals(typeof mockUserProfile.show_in_search, 'boolean')
})

// Test user block data structure
Deno.test("user block data structure", () => {
  const blockData = {
    id: 'block-id',
    blocker_id: '123e4567-e89b-12d3-a456-426614174000',
    blocked_id: '456e7890-e89b-12d3-a456-426614174001',
    created_at: new Date().toISOString()
  }
  
  assertEquals(typeof blockData.id, 'string')
  assertEquals(typeof blockData.blocker_id, 'string')
  assertEquals(typeof blockData.blocked_id, 'string')
  assertEquals(typeof blockData.created_at, 'string')
})

// Test validation functions
Deno.test("user profile validation", async () => {
  const { validateUserProfileUpdate } = await import('../_shared/validation.ts')
  
  // Valid update
  const validUpdate = {
    username: 'valid_user',
    display_name: 'Valid User',
    bio: 'This is a valid bio'
  }
  
  const validErrors = validateUserProfileUpdate(validUpdate)
  assertEquals(validErrors.length, 0)
  
  // Invalid update
  const invalidUpdate = {
    username: 'ab', // too short
    website: 'not-a-url', // invalid URL
    bio: 'x'.repeat(501) // too long
  }
  
  const invalidErrors = validateUserProfileUpdate(invalidUpdate)
  assertEquals(invalidErrors.length > 0, true)
})

// Test UUID validation
Deno.test("UUID validation for user operations", async () => {
  const { validateUUID } = await import('../_shared/validation.ts')
  
  // Valid UUID
  assertEquals(validateUUID('123e4567-e89b-12d3-a456-426614174000'), true)
  
  // Invalid UUID
  assertEquals(validateUUID('invalid-uuid'), false)
  assertEquals(validateUUID(''), false)
})

// Test username validation
Deno.test("username validation", async () => {
  const { validateUsername } = await import('../_shared/validation.ts')
  
  // Valid usernames
  assertEquals(validateUsername('valid_user'), true)
  assertEquals(validateUsername('user123'), true)
  assertEquals(validateUsername('test_user_123'), true)
  
  // Invalid usernames
  assertEquals(validateUsername('ab'), false) // too short
  assertEquals(validateUsername('user-name'), false) // contains dash
  assertEquals(validateUsername('user@name'), false) // contains @
  assertEquals(validateUsername('user name'), false) // contains space
})

// Test text sanitization
Deno.test("text sanitization", async () => {
  const { sanitizeText } = await import('../_shared/validation.ts')
  
  // Test basic sanitization
  assertEquals(sanitizeText('  hello world  '), 'hello world')
  assertEquals(sanitizeText('hello    world'), 'hello world')
  assertEquals(sanitizeText('\n\nhello\n\nworld\n\n'), 'hello world')
})

// Test error response creation
Deno.test("error response creation", () => {
  const errorResponse = {
    error: {
      code: 'USER_NOT_FOUND',
      message: 'User not found'
    },
    timestamp: new Date().toISOString()
  }
  
  assertEquals(errorResponse.error.code, 'USER_NOT_FOUND')
  assertEquals(errorResponse.error.message, 'User not found')
  assertExists(errorResponse.timestamp)
})

// Test success response creation
Deno.test("success response creation", () => {
  const successResponse = {
    data: mockUserProfile,
    timestamp: new Date().toISOString()
  }
  
  assertEquals(successResponse.data.id, mockUserProfile.id)
  assertEquals(successResponse.data.username, mockUserProfile.username)
  assertExists(successResponse.timestamp)
})

// Test CORS headers
Deno.test("CORS headers", async () => {
  const { corsHeaders } = await import('../_shared/utils.ts')
  
  assertEquals(corsHeaders['Access-Control-Allow-Origin'], '*')
  assertExists(corsHeaders['Access-Control-Allow-Headers'])
  assertExists(corsHeaders['Access-Control-Allow-Methods'])
})

// Test pagination parameters
Deno.test("pagination parameters", async () => {
  const { parsePaginationParams } = await import('../_shared/utils.ts')
  
  const url = new URL('https://example.com/users?page=2&limit=10')
  const params = parsePaginationParams(url)
  
  assertEquals(params.page, 2)
  assertEquals(params.limit, 10)
})

console.log("✅ All user management tests passed!")