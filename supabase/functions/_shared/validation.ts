// Common validation functions and error handling
import { 
  ProfileVisibility, 
  CommunityType, 
  MemberRole, 
  ItemType,
  CreateCommunityRequest,
  CreateReviewRequest,
  UpdateReviewRequest,
  UpdateUserProfileRequest,
  CreatePostRequest,
  CreateCommentRequest
} from './types.ts'

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export class ValidationException extends Error {
  errors: ValidationError[]
  
  constructor(errors: ValidationError[]) {
    super('Validation failed')
    this.name = 'ValidationException'
    this.errors = errors
  }
}

// Basic validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
  return usernameRegex.test(username)
}

// Field validation functions
export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return { 
      field: fieldName, 
      message: `${fieldName} is required`,
      code: 'REQUIRED'
    }
  }
  return null
}

export function validateLength(
  value: string, 
  min: number, 
  max: number, 
  fieldName: string
): ValidationError | null {
  if (value.length < min) {
    return { 
      field: fieldName, 
      message: `${fieldName} must be at least ${min} characters`,
      code: 'MIN_LENGTH'
    }
  }
  if (value.length > max) {
    return { 
      field: fieldName, 
      message: `${fieldName} must be no more than ${max} characters`,
      code: 'MAX_LENGTH'
    }
  }
  return null
}

export function validateRating(rating: number): ValidationError | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { 
      field: 'rating', 
      message: 'Rating must be an integer between 1 and 5',
      code: 'INVALID_RATING'
    }
  }
  return null
}

export function validateEnum<T>(
  value: T, 
  validValues: T[], 
  fieldName: string
): ValidationError | null {
  if (!validValues.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${validValues.join(', ')}`,
      code: 'INVALID_ENUM'
    }
  }
  return null
}

export function validateArray(
  value: any[], 
  minLength: number, 
  maxLength: number, 
  fieldName: string
): ValidationError | null {
  if (!Array.isArray(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be an array`,
      code: 'INVALID_TYPE'
    }
  }
  
  if (value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must have at least ${minLength} items`,
      code: 'MIN_ARRAY_LENGTH'
    }
  }
  
  if (value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must have no more than ${maxLength} items`,
      code: 'MAX_ARRAY_LENGTH'
    }
  }
  
  return null
}

// Specific validation functions
export function validateUserProfileUpdate(data: UpdateUserProfileRequest): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (data.username !== undefined) {
    const requiredError = validateRequired(data.username, 'username')
    if (requiredError) {
      errors.push(requiredError)
    } else {
      const lengthError = validateLength(data.username, 3, 50, 'username')
      if (lengthError) errors.push(lengthError)
      
      if (!validateUsername(data.username)) {
        errors.push({
          field: 'username',
          message: 'Username can only contain letters, numbers, and underscores',
          code: 'INVALID_USERNAME'
        })
      }
    }
  }
  
  if (data.display_name !== undefined && data.display_name !== '') {
    const lengthError = validateLength(data.display_name, 1, 100, 'display_name')
    if (lengthError) errors.push(lengthError)
  }
  
  if (data.bio !== undefined && data.bio !== '') {
    const lengthError = validateLength(data.bio, 0, 500, 'bio')
    if (lengthError) errors.push(lengthError)
  }
  
  if (data.website !== undefined && data.website !== '') {
    if (!validateURL(data.website)) {
      errors.push({
        field: 'website',
        message: 'Website must be a valid URL',
        code: 'INVALID_URL'
      })
    }
  }
  
  if (data.profile_visibility !== undefined) {
    const enumError = validateEnum(
      data.profile_visibility,
      ['PUBLIC', 'COMMUNITIES_ONLY', 'PRIVATE'] as ProfileVisibility[],
      'profile_visibility'
    )
    if (enumError) errors.push(enumError)
  }
  
  return errors
}

export function validateCommunityCreate(data: CreateCommunityRequest): ValidationError[] {
  const errors: ValidationError[] = []
  
  const nameRequired = validateRequired(data.name, 'name')
  if (nameRequired) {
    errors.push(nameRequired)
  } else {
    const nameLength = validateLength(data.name, 3, 100, 'name')
    if (nameLength) errors.push(nameLength)
  }
  
  if (data.description !== undefined && data.description !== '') {
    const descLength = validateLength(data.description, 0, 1000, 'description')
    if (descLength) errors.push(descLength)
  }
  
  if (data.image_url !== undefined && data.image_url !== '') {
    if (!validateURL(data.image_url)) {
      errors.push({
        field: 'image_url',
        message: 'Image URL must be a valid URL',
        code: 'INVALID_URL'
      })
    }
  }
  
  if (data.type !== undefined) {
    const typeError = validateEnum(
      data.type,
      ['PUBLIC', 'PRIVATE', 'INVITE_ONLY'] as CommunityType[],
      'type'
    )
    if (typeError) errors.push(typeError)
  }
  
  return errors
}

export function validateReviewCreate(data: CreateReviewRequest): ValidationError[] {
  const errors: ValidationError[] = []
  
  const itemIdRequired = validateRequired(data.item_id, 'item_id')
  if (itemIdRequired) {
    errors.push(itemIdRequired)
  } else if (!validateUUID(data.item_id)) {
    errors.push({
      field: 'item_id',
      message: 'Item ID must be a valid UUID',
      code: 'INVALID_UUID'
    })
  }
  
  const communityIdRequired = validateRequired(data.community_id, 'community_id')
  if (communityIdRequired) {
    errors.push(communityIdRequired)
  } else if (!validateUUID(data.community_id)) {
    errors.push({
      field: 'community_id',
      message: 'Community ID must be a valid UUID',
      code: 'INVALID_UUID'
    })
  }
  
  const ratingRequired = validateRequired(data.rating, 'rating')
  if (ratingRequired) {
    errors.push(ratingRequired)
  } else {
    const ratingError = validateRating(data.rating)
    if (ratingError) errors.push(ratingError)
  }
  
  if (data.title !== undefined && data.title !== '') {
    const titleLength = validateLength(data.title, 1, 255, 'title')
    if (titleLength) errors.push(titleLength)
  }
  
  if (data.content !== undefined && data.content !== '') {
    const contentLength = validateLength(data.content, 1, 5000, 'content')
    if (contentLength) errors.push(contentLength)
  }
  
  if (data.images !== undefined) {
    const arrayError = validateArray(data.images, 0, 10, 'images')
    if (arrayError) {
      errors.push(arrayError)
    } else {
      // Validate each image URL
      data.images.forEach((url, index) => {
        if (!validateURL(url)) {
          errors.push({
            field: `images[${index}]`,
            message: 'Image URL must be a valid URL',
            code: 'INVALID_URL'
          })
        }
      })
    }
  }
  
  return errors
}

export function validateUpdateReview(data: UpdateReviewRequest): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (data.rating !== undefined) {
    const ratingError = validateRating(data.rating)
    if (ratingError) errors.push(ratingError)
  }
  
  if (data.title !== undefined && data.title !== '') {
    const titleLength = validateLength(data.title, 1, 255, 'title')
    if (titleLength) errors.push(titleLength)
  }
  
  if (data.content !== undefined && data.content !== '') {
    const contentLength = validateLength(data.content, 1, 5000, 'content')
    if (contentLength) errors.push(contentLength)
  }
  
  if (data.images !== undefined) {
    const arrayError = validateArray(data.images, 0, 10, 'images')
    if (arrayError) {
      errors.push(arrayError)
    } else {
      data.images.forEach((url, index) => {
        if (!validateURL(url)) {
          errors.push({
            field: `images[${index}]`,
            message: 'Image URL must be a valid URL',
            code: 'INVALID_URL'
          })
        }
      })
    }
  }
  
  return errors
}

export function validatePostCreate(data: CreatePostRequest): ValidationError[] {
  const errors: ValidationError[] = []
  
  const contentRequired = validateRequired(data.content, 'content')
  if (contentRequired) {
    errors.push(contentRequired)
  } else {
    const contentLength = validateLength(data.content, 1, 2000, 'content')
    if (contentLength) errors.push(contentLength)
  }
  
  if (data.referenced_item_id !== undefined && data.referenced_item_id !== '') {
    if (!validateUUID(data.referenced_item_id)) {
      errors.push({
        field: 'referenced_item_id',
        message: 'Referenced item ID must be a valid UUID',
        code: 'INVALID_UUID'
      })
    }
  }
  
  if (data.images !== undefined) {
    const arrayError = validateArray(data.images, 0, 10, 'images')
    if (arrayError) {
      errors.push(arrayError)
    } else {
      data.images.forEach((url, index) => {
        if (!validateURL(url)) {
          errors.push({
            field: `images[${index}]`,
            message: 'Image URL must be a valid URL',
            code: 'INVALID_URL'
          })
        }
      })
    }
  }
  
  if (data.community_ids !== undefined) {
    const arrayError = validateArray(data.community_ids, 0, 5, 'community_ids')
    if (arrayError) {
      errors.push(arrayError)
    } else {
      data.community_ids.forEach((id, index) => {
        if (!validateUUID(id)) {
          errors.push({
            field: `community_ids[${index}]`,
            message: 'Community ID must be a valid UUID',
            code: 'INVALID_UUID'
          })
        }
      })
    }
  }
  
  return errors
}

export function validateCommentCreate(data: CreateCommentRequest): ValidationError[] {
  const errors: ValidationError[] = []
  
  const postIdRequired = validateRequired(data.post_id, 'post_id')
  if (postIdRequired) {
    errors.push(postIdRequired)
  } else if (!validateUUID(data.post_id)) {
    errors.push({
      field: 'post_id',
      message: 'Post ID must be a valid UUID',
      code: 'INVALID_UUID'
    })
  }
  
  const contentRequired = validateRequired(data.content, 'content')
  if (contentRequired) {
    errors.push(contentRequired)
  } else {
    const contentLength = validateLength(data.content, 1, 1000, 'content')
    if (contentLength) errors.push(contentLength)
  }
  
  return errors
}

// Utility functions
export function collectValidationErrors(validators: (() => ValidationError | null)[]): ValidationError[] {
  const errors: ValidationError[] = []
  
  for (const validator of validators) {
    const error = validator()
    if (error) {
      errors.push(error)
    }
  }
  
  return errors
}

export function throwIfValidationErrors(errors: ValidationError[]): void {
  if (errors.length > 0) {
    throw new ValidationException(errors)
  }
}

export function validateAndThrow<T>(
  data: T,
  validator: (data: T) => ValidationError[]
): void {
  const errors = validator(data)
  throwIfValidationErrors(errors)
}

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeText(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}