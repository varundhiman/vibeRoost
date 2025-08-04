// Comprehensive tests for shared utilities
import { assertEquals, assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { 
  validateEmail, 
  validateRequired, 
  validateLength,
  validateRating,
  validateUUID,
  validateUsername,
  ValidationException,
  validateUserProfileUpdate,
  validateCommunityCreate,
  validateReviewCreate
} from "./validation.ts"
import { 
  AppError, 
  NotFoundError, 
  ConflictError,
  ERROR_CODES,
  createErrorResponse,
  createSuccessResponse
} from "./errors.ts"

// Validation tests
Deno.test("email validation", () => {
  assertEquals(validateEmail("test@example.com"), true)
  assertEquals(validateEmail("user.name+tag@domain.co.uk"), true)
  assertEquals(validateEmail("invalid-email"), false)
  assertEquals(validateEmail("@domain.com"), false)
  assertEquals(validateEmail("user@"), false)
})

Deno.test("UUID validation", () => {
  assertEquals(validateUUID("123e4567-e89b-12d3-a456-426614174000"), true)
  assertEquals(validateUUID("invalid-uuid"), false)
  assertEquals(validateUUID("123e4567-e89b-12d3-a456"), false)
})

Deno.test("username validation", () => {
  assertEquals(validateUsername("valid_user123"), true)
  assertEquals(validateUsername("user"), true)
  assertEquals(validateUsername("us"), false) // too short
  assertEquals(validateUsername("user-name"), false) // contains dash
  assertEquals(validateUsername("user@name"), false) // contains @
})

Deno.test("required validation", () => {
  const error = validateRequired("", "username")
  assertEquals(error?.field, "username")
  assertEquals(error?.message, "username is required")
  assertEquals(error?.code, "REQUIRED")
  
  assertEquals(validateRequired("valid", "username"), null)
  assertEquals(validateRequired(null, "field"), { field: "field", message: "field is required", code: "REQUIRED" })
})

Deno.test("length validation", () => {
  const shortError = validateLength("ab", 3, 10, "field")
  assertEquals(shortError?.code, "MIN_LENGTH")
  
  const longError = validateLength("this is too long", 3, 10, "field")
  assertEquals(longError?.code, "MAX_LENGTH")
  
  assertEquals(validateLength("valid", 3, 10, "field"), null)
})

Deno.test("rating validation", () => {
  assertEquals(validateRating(3), null)
  assertEquals(validateRating(1), null)
  assertEquals(validateRating(5), null)
  
  const invalidError = validateRating(0)
  assertEquals(invalidError?.code, "INVALID_RATING")
  
  const invalidError2 = validateRating(6)
  assertEquals(invalidError2?.code, "INVALID_RATING")
})

Deno.test("user profile validation", () => {
  // Valid profile
  const validProfile = {
    username: "valid_user",
    display_name: "Valid User",
    bio: "This is a valid bio",
    website: "https://example.com"
  }
  assertEquals(validateUserProfileUpdate(validProfile).length, 0)
  
  // Invalid profile
  const invalidProfile = {
    username: "ab", // too short AND invalid format
    website: "not-a-url",
    bio: "x".repeat(501) // too long
  }
  const errors = validateUserProfileUpdate(invalidProfile)
  assertEquals(errors.length, 4) // username triggers 2 errors, website 1, bio 1
})

Deno.test("community validation", () => {
  // Valid community
  const validCommunity = {
    name: "Valid Community",
    description: "A valid community description",
    type: "PUBLIC" as const
  }
  assertEquals(validateCommunityCreate(validCommunity).length, 0)
  
  // Invalid community
  const invalidCommunity = {
    name: "", // required
    type: "INVALID" as any
  }
  const errors = validateCommunityCreate(invalidCommunity)
  assertEquals(errors.length, 2)
})

Deno.test("review validation", () => {
  // Valid review
  const validReview = {
    item_id: "123e4567-e89b-12d3-a456-426614174000",
    community_id: "123e4567-e89b-12d3-a456-426614174001",
    rating: 4,
    title: "Great item",
    content: "This is a great review"
  }
  assertEquals(validateReviewCreate(validReview).length, 0)
  
  // Invalid review
  const invalidReview = {
    item_id: "invalid-uuid",
    community_id: "",
    rating: 6 // invalid rating
  }
  const errors = validateReviewCreate(invalidReview)
  assertEquals(errors.length, 3)
})

// Error handling tests
Deno.test("ValidationException", () => {
  const errors = [
    { field: "username", message: "Username is required", code: "REQUIRED" }
  ]
  
  assertThrows(
    () => { throw new ValidationException(errors) },
    ValidationException,
    "Validation failed"
  )
})

Deno.test("AppError", () => {
  const error = new AppError("Test error", ERROR_CODES.NOT_FOUND, 404)
  assertEquals(error.code, ERROR_CODES.NOT_FOUND)
  assertEquals(error.statusCode, 404)
  assertEquals(error.message, "Test error")
})

Deno.test("NotFoundError", () => {
  const error = new NotFoundError("User", "123")
  assertEquals(error.code, ERROR_CODES.NOT_FOUND)
  assertEquals(error.statusCode, 404)
  assertEquals(error.message, "User with ID 123 not found")
})

Deno.test("ConflictError", () => {
  const error = new ConflictError("Resource already exists")
  assertEquals(error.code, ERROR_CODES.CONFLICT)
  assertEquals(error.statusCode, 409)
})

Deno.test("error response creation", () => {
  const error = new NotFoundError("User", "123")
  const response = createErrorResponse(error, "/api/users/123")
  
  assertEquals(response.status, 404)
  assertEquals(response.headers.get("Content-Type"), "application/json")
})

Deno.test("success response creation", () => {
  const data = { id: "123", name: "Test" }
  const response = createSuccessResponse(data, 201)
  
  assertEquals(response.status, 201)
  assertEquals(response.headers.get("Content-Type"), "application/json")
})

console.log("✅ All shared utility tests passed!")