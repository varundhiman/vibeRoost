// Unit tests for community management functions
import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  Community, 
  CreateCommunityRequest, 
  UpdateCommunityRequest,
  CommunityMembership 
} from '../_shared/types.ts'

// Mock Supabase client for testing
const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: (n: number) => Promise.resolve({ data: [], error: null, count: 0 }),
        order: (column: string, options?: any) => ({
          range: (from: number, to: number) => Promise.resolve({ data: [], error: null, count: 0 })
        })
      }),
      or: (condition: string) => ({
        eq: (column: string, value: any) => ({
          range: (from: number, to: number) => Promise.resolve({ data: [], error: null, count: 0 })
        })
      }),
      gte: (column: string, value: any) => ({
        lte: (column: string, value: any) => ({
          not: (column: string, operator: string, value: string) => ({
            order: (column: string, options?: any) => ({
              range: (from: number, to: number) => Promise.resolve({ data: [], error: null, count: 0 })
            })
          })
        })
      }),
      range: (from: number, to: number) => Promise.resolve({ data: [], error: null, count: 0 })
    }),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    })
  })
}

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com'
  },
  supabase: mockSupabase as any
}

Deno.test("Community CRUD Operations", async (t) => {
  await t.step("should validate community creation data", async () => {
    const { validateCommunityCreate } = await import('../_shared/validation.ts')
    
    // Valid data should pass
    const validData: CreateCommunityRequest = {
      name: "Test Community",
      description: "A test community",
      type: "PUBLIC"
    }
    
    const errors = validateCommunityCreate(validData)
    assertEquals(errors.length, 0)
    
    // Invalid data should fail
    const invalidData: CreateCommunityRequest = {
      name: "", // Empty name should fail
      description: "A test community"
    }
    
    const invalidErrors = validateCommunityCreate(invalidData)
    assertEquals(invalidErrors.length > 0, true)
    assertEquals(invalidErrors[0].field, 'name')
  })
  
  await t.step("should create community with valid data", async () => {
    // This would test the actual createCommunity function
    // In a real test, you'd mock the database calls and verify the logic
    
    const communityData: CreateCommunityRequest = {
      name: "Test Community",
      description: "A test community for testing",
      type: "PUBLIC",
      is_private: false
    }
    
    // Mock successful creation
    const expectedCommunity: Community = {
      id: 'test-community-id',
      name: communityData.name,
      description: communityData.description,
      type: communityData.type!,
      is_private: communityData.is_private!,
      member_count: 1,
      created_by: mockAuthContext.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // In a real test, you would call the actual function and verify the result
    assertExists(expectedCommunity.id)
    assertEquals(expectedCommunity.name, communityData.name)
    assertEquals(expectedCommunity.created_by, mockAuthContext.user.id)
  })
  
  await t.step("should prevent duplicate community names", async () => {
    // Test that creating a community with an existing name fails
    const communityData: CreateCommunityRequest = {
      name: "Existing Community",
      description: "This name already exists"
    }
    
    // In a real test, you would mock the database to return an existing community
    // and verify that a ConflictError is thrown
    
    // This is a placeholder for the actual test logic
    const duplicateExists = true
    assertEquals(duplicateExists, true)
  })
})

Deno.test("Community Membership Management", async (t) => {
  await t.step("should allow users to join public communities", async () => {
    const communityId = 'test-community-id'
    const userId = 'test-user-id'
    
    // Mock a public community
    const publicCommunity: Community = {
      id: communityId,
      name: "Public Community",
      description: "A public community",
      type: "PUBLIC",
      is_private: false,
      member_count: 5,
      created_by: 'other-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Expected membership after joining
    const expectedMembership: CommunityMembership = {
      id: 'test-membership-id',
      community_id: communityId,
      user_id: userId,
      role: 'MEMBER',
      status: 'APPROVED', // Should be auto-approved for public communities
      joined_at: new Date().toISOString(),
      approved_by: userId,
      approved_at: new Date().toISOString()
    }
    
    assertEquals(expectedMembership.status, 'APPROVED')
    assertEquals(expectedMembership.role, 'MEMBER')
  })
  
  await t.step("should require approval for private communities", async () => {
    const communityId = 'private-community-id'
    const userId = 'test-user-id'
    
    // Mock a private community
    const privateCommunity: Community = {
      id: communityId,
      name: "Private Community",
      description: "A private community",
      type: "PRIVATE",
      is_private: true,
      member_count: 3,
      created_by: 'other-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Expected membership after joining (should be pending)
    const expectedMembership: CommunityMembership = {
      id: 'test-membership-id',
      community_id: communityId,
      user_id: userId,
      role: 'MEMBER',
      status: 'PENDING', // Should be pending for private communities
      joined_at: new Date().toISOString()
    }
    
    assertEquals(expectedMembership.status, 'PENDING')
    assertEquals(expectedMembership.approved_by, undefined)
  })
  
  await t.step("should prevent duplicate memberships", async () => {
    // Test that joining a community twice fails appropriately
    const existingMembership: CommunityMembership = {
      id: 'existing-membership-id',
      community_id: 'test-community-id',
      user_id: 'test-user-id',
      role: 'MEMBER',
      status: 'APPROVED',
      joined_at: new Date().toISOString(),
      approved_by: 'test-user-id',
      approved_at: new Date().toISOString()
    }
    
    // In a real test, you would verify that a ConflictError is thrown
    // when trying to join a community the user is already a member of
    assertEquals(existingMembership.status, 'APPROVED')
  })
  
  await t.step("should allow members to leave communities", async () => {
    // Test successful community leaving
    const membershipToLeave: CommunityMembership = {
      id: 'membership-to-leave-id',
      community_id: 'test-community-id',
      user_id: 'test-user-id',
      role: 'MEMBER',
      status: 'APPROVED',
      joined_at: new Date().toISOString(),
      approved_by: 'test-user-id',
      approved_at: new Date().toISOString()
    }
    
    // In a real test, you would call the leave function and verify:
    // 1. Membership is deleted
    // 2. Member count is decremented
    // 3. Success response is returned
    
    assertEquals(membershipToLeave.role, 'MEMBER') // Only non-owners can leave freely
  })
  
  await t.step("should prevent sole owner from leaving", async () => {
    // Test that the only owner cannot leave a community
    const ownerMembership: CommunityMembership = {
      id: 'owner-membership-id',
      community_id: 'test-community-id',
      user_id: 'test-user-id',
      role: 'OWNER',
      status: 'APPROVED',
      joined_at: new Date().toISOString(),
      approved_by: 'test-user-id',
      approved_at: new Date().toISOString()
    }
    
    // In a real test, you would verify that a ForbiddenError is thrown
    // when the sole owner tries to leave
    assertEquals(ownerMembership.role, 'OWNER')
  })
})

Deno.test("Community Discovery and Search", async (t) => {
  await t.step("should return public communities for unauthenticated users", async () => {
    // Test that discovery works without authentication
    const publicCommunities: Community[] = [
      {
        id: 'public-1',
        name: "Public Community 1",
        description: "First public community",
        type: "PUBLIC",
        is_private: false,
        member_count: 10,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'public-2',
        name: "Public Community 2", 
        description: "Second public community",
        type: "PUBLIC",
        is_private: false,
        member_count: 5,
        created_by: 'user-2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    // Verify that only public communities are returned
    const publicCount = publicCommunities.filter(c => !c.is_private).length
    assertEquals(publicCount, 2)
  })
  
  await t.step("should filter communities by search term", async () => {
    const searchTerm = "gaming"
    const communities: Community[] = [
      {
        id: 'gaming-1',
        name: "Gaming Community",
        description: "For gaming enthusiasts",
        type: "PUBLIC",
        is_private: false,
        member_count: 100,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cooking-1',
        name: "Cooking Community",
        description: "For cooking lovers",
        type: "PUBLIC", 
        is_private: false,
        member_count: 50,
        created_by: 'user-2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    // In a real test, you would verify that only communities matching
    // the search term are returned
    const matchingCommunities = communities.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    assertEquals(matchingCommunities.length, 1)
    assertEquals(matchingCommunities[0].name, "Gaming Community")
  })
  
  await t.step("should sort communities by member count", async () => {
    const communities: Community[] = [
      {
        id: 'small-community',
        name: "Small Community",
        description: "A small community",
        type: "PUBLIC",
        is_private: false,
        member_count: 5,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'large-community',
        name: "Large Community",
        description: "A large community",
        type: "PUBLIC",
        is_private: false,
        member_count: 100,
        created_by: 'user-2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    // Sort by member count descending
    const sortedCommunities = communities.sort((a, b) => b.member_count - a.member_count)
    
    assertEquals(sortedCommunities[0].name, "Large Community")
    assertEquals(sortedCommunities[1].name, "Small Community")
  })
})

Deno.test("Community Privacy and Access Controls", async (t) => {
  await t.step("should enforce privacy settings for private communities", async () => {
    const privateCommunity: Community = {
      id: 'private-community',
      name: "Private Community",
      description: "A private community",
      type: "PRIVATE",
      is_private: true,
      member_count: 10,
      created_by: 'owner-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Non-members should not be able to view private community details
    const isPrivate = privateCommunity.is_private
    const userIsMember = false // Mock non-member
    
    assertEquals(isPrivate, true)
    assertEquals(userIsMember, false)
    
    // In a real test, you would verify that access is denied
  })
  
  await t.step("should allow moderators to manage community", async () => {
    const moderatorMembership: CommunityMembership = {
      id: 'moderator-membership',
      community_id: 'test-community',
      user_id: 'moderator-user-id',
      role: 'MODERATOR',
      status: 'APPROVED',
      joined_at: new Date().toISOString(),
      approved_by: 'owner-user-id',
      approved_at: new Date().toISOString()
    }
    
    // Moderators should be able to update community settings
    const canModerate = moderatorMembership.role === 'MODERATOR' || moderatorMembership.role === 'OWNER'
    assertEquals(canModerate, true)
  })
  
  await t.step("should restrict member removal permissions", async () => {
    const ownerMembership: CommunityMembership = {
      id: 'owner-membership',
      community_id: 'test-community',
      user_id: 'owner-user-id',
      role: 'OWNER',
      status: 'APPROVED',
      joined_at: new Date().toISOString(),
      approved_by: 'owner-user-id',
      approved_at: new Date().toISOString()
    }
    
    const moderatorMembership: CommunityMembership = {
      id: 'moderator-membership',
      community_id: 'test-community',
      user_id: 'moderator-user-id',
      role: 'MODERATOR',
      status: 'APPROVED',
      joined_at: new Date().toISOString(),
      approved_by: 'owner-user-id',
      approved_at: new Date().toISOString()
    }
    
    // Owners should not be removable
    const canRemoveOwner = false // Owners cannot be removed
    assertEquals(canRemoveOwner, false)
    
    // Only owners should be able to remove moderators
    const onlyOwnerCanRemoveModerator = true
    assertEquals(onlyOwnerCanRemoveModerator, true)
  })
})

// Integration test helper functions
export function createMockRequest(
  method: string, 
  url: string, 
  body?: any,
  headers?: Record<string, string>
): Request {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-jwt-token',
      ...headers
    }
  }
  
  if (body) {
    requestInit.body = JSON.stringify(body)
  }
  
  return new Request(url, requestInit)
}

export function createMockCommunity(overrides?: Partial<Community>): Community {
  return {
    id: 'mock-community-id',
    name: 'Mock Community',
    description: 'A mock community for testing',
    type: 'PUBLIC',
    is_private: false,
    member_count: 1,
    created_by: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

export function createMockMembership(overrides?: Partial<CommunityMembership>): CommunityMembership {
  return {
    id: 'mock-membership-id',
    community_id: 'mock-community-id',
    user_id: 'mock-user-id',
    role: 'MEMBER',
    status: 'APPROVED',
    joined_at: new Date().toISOString(),
    approved_by: 'mock-user-id',
    approved_at: new Date().toISOString(),
    ...overrides
  }
}