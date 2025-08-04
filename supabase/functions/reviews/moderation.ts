// Review moderation and spam detection
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Review } from '../_shared/types.ts'

export interface ModerationResult {
  is_spam: boolean
  is_inappropriate: boolean
  confidence_score: number
  reasons: string[]
  suggested_action: 'approve' | 'flag' | 'reject'
}

export interface SpamDetectionConfig {
  max_reviews_per_hour: number
  max_reviews_per_day: number
  min_content_length: number
  max_duplicate_percentage: number
  blocked_words: string[]
  suspicious_patterns: RegExp[]
}

// Default spam detection configuration
const DEFAULT_CONFIG: SpamDetectionConfig = {
  max_reviews_per_hour: 10,
  max_reviews_per_day: 50,
  min_content_length: 10,
  max_duplicate_percentage: 80,
  blocked_words: [
    'spam', 'fake', 'bot', 'advertisement', 'promo', 'discount',
    'click here', 'visit now', 'limited time', 'act now'
  ],
  suspicious_patterns: [
    /(.)\1{4,}/g, // Repeated characters (aaaaa)
    /[A-Z]{10,}/g, // Excessive caps
    /\b\d{10,}\b/g, // Long numbers (phone numbers)
    /(https?:\/\/[^\s]+)/g, // URLs
    /[!@#$%^&*]{3,}/g // Excessive special characters
  ]
}

/**
 * Analyze review content for spam and inappropriate content
 */
export async function moderateReview(
  supabase: SupabaseClient,
  review: Partial<Review>,
  userId: string,
  config: SpamDetectionConfig = DEFAULT_CONFIG
): Promise<ModerationResult> {
  const reasons: string[] = []
  let spamScore = 0
  let inappropriateScore = 0

  // Check user's recent review activity
  const activityCheck = await checkUserActivity(supabase, userId, config)
  if (activityCheck.is_suspicious) {
    spamScore += 30
    reasons.push(...activityCheck.reasons)
  }

  // Check content quality
  const contentCheck = analyzeContent(review.content || '', config)
  spamScore += contentCheck.spam_score
  inappropriateScore += contentCheck.inappropriate_score
  reasons.push(...contentCheck.reasons)

  // Check for duplicate content
  if (review.content) {
    const duplicateCheck = await checkDuplicateContent(supabase, review.content, userId)
    if (duplicateCheck.is_duplicate) {
      spamScore += 40
      reasons.push(`Content is ${duplicateCheck.similarity_percentage}% similar to existing review`)
    }
  }

  // Check rating patterns
  const ratingCheck = await checkRatingPatterns(supabase, userId, review.rating || 0)
  if (ratingCheck.is_suspicious) {
    spamScore += 20
    reasons.push(...ratingCheck.reasons)
  }

  // Calculate final scores
  const totalScore = Math.max(spamScore, inappropriateScore)
  const isSpam = spamScore >= 50
  const isInappropriate = inappropriateScore >= 50

  // Determine suggested action
  let suggestedAction: 'approve' | 'flag' | 'reject' = 'approve'
  if (totalScore >= 70) {
    suggestedAction = 'reject'
  } else if (totalScore >= 40) {
    suggestedAction = 'flag'
  }

  return {
    is_spam: isSpam,
    is_inappropriate: isInappropriate,
    confidence_score: Math.min(100, totalScore),
    reasons,
    suggested_action: suggestedAction
  }
}

/**
 * Check user's recent activity for suspicious patterns
 */
async function checkUserActivity(
  supabase: SupabaseClient,
  userId: string,
  config: SpamDetectionConfig
): Promise<{ is_suspicious: boolean; reasons: string[] }> {
  const reasons: string[] = []
  let isSuspicious = false

  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Check reviews in the last hour
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString())

    if (recentReviews && recentReviews.length >= config.max_reviews_per_hour) {
      isSuspicious = true
      reasons.push(`Too many reviews in the last hour (${recentReviews.length}/${config.max_reviews_per_hour})`)
    }

    // Check reviews in the last day
    const { data: dailyReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo.toISOString())

    if (dailyReviews && dailyReviews.length >= config.max_reviews_per_day) {
      isSuspicious = true
      reasons.push(`Too many reviews in the last day (${dailyReviews.length}/${config.max_reviews_per_day})`)
    }

    // Check account age
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('created_at')
      .eq('id', userId)
      .single()

    if (userProfile) {
      const accountAge = now.getTime() - new Date(userProfile.created_at).getTime()
      const accountAgeHours = accountAge / (1000 * 60 * 60)
      
      if (accountAgeHours < 24 && (recentReviews?.length || 0) > 5) {
        isSuspicious = true
        reasons.push('New account with high review activity')
      }
    }

  } catch (error) {
    console.error('Error checking user activity:', error)
  }

  return { is_suspicious: isSuspicious, reasons }
}

/**
 * Analyze content for spam and inappropriate material
 */
function analyzeContent(
  content: string,
  config: SpamDetectionConfig
): { spam_score: number; inappropriate_score: number; reasons: string[] } {
  const reasons: string[] = []
  let spamScore = 0
  let inappropriateScore = 0

  if (!content || content.trim().length === 0) {
    return { spam_score: 0, inappropriate_score: 0, reasons: [] }
  }

  const lowerContent = content.toLowerCase()

  // Check content length
  if (content.length < config.min_content_length) {
    spamScore += 20
    reasons.push('Content too short')
  }

  // Check for blocked words
  const blockedWordsFound = config.blocked_words.filter(word => 
    lowerContent.includes(word.toLowerCase())
  )
  if (blockedWordsFound.length > 0) {
    spamScore += blockedWordsFound.length * 15
    reasons.push(`Contains blocked words: ${blockedWordsFound.join(', ')}`)
  }

  // Check suspicious patterns
  config.suspicious_patterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches && matches.length > 0) {
      spamScore += matches.length * 10
      reasons.push('Contains suspicious patterns')
    }
  })

  // Check for excessive repetition
  const words = content.split(/\s+/)
  const wordCounts: { [key: string]: number } = {}
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
    if (cleanWord.length > 2) {
      wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1
    }
  })

  const totalWords = Object.keys(wordCounts).length
  const repeatedWords = Object.values(wordCounts).filter(count => count > 3).length
  
  if (totalWords > 0 && (repeatedWords / totalWords) > 0.3) {
    spamScore += 25
    reasons.push('Excessive word repetition')
  }

  // Check for promotional content
  const promotionalKeywords = [
    'buy now', 'special offer', 'limited time', 'discount', 'sale',
    'free shipping', 'best price', 'guaranteed', 'money back'
  ]
  
  const promotionalMatches = promotionalKeywords.filter(keyword =>
    lowerContent.includes(keyword)
  )
  
  if (promotionalMatches.length > 0) {
    spamScore += promotionalMatches.length * 20
    reasons.push('Contains promotional language')
  }

  // Check for inappropriate content (basic)
  const inappropriateKeywords = [
    'hate', 'violence', 'discrimination', 'harassment',
    'offensive', 'inappropriate', 'abusive'
  ]
  
  const inappropriateMatches = inappropriateKeywords.filter(keyword =>
    lowerContent.includes(keyword)
  )
  
  if (inappropriateMatches.length > 0) {
    inappropriateScore += inappropriateMatches.length * 25
    reasons.push('May contain inappropriate content')
  }

  return {
    spam_score: Math.min(100, spamScore),
    inappropriate_score: Math.min(100, inappropriateScore),
    reasons
  }
}

/**
 * Check for duplicate or very similar content
 */
async function checkDuplicateContent(
  supabase: SupabaseClient,
  content: string,
  userId: string
): Promise<{ is_duplicate: boolean; similarity_percentage: number }> {
  try {
    // Get user's recent reviews
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('content')
      .eq('user_id', userId)
      .not('content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!recentReviews || recentReviews.length === 0) {
      return { is_duplicate: false, similarity_percentage: 0 }
    }

    let maxSimilarity = 0

    for (const review of recentReviews) {
      if (review.content) {
        const similarity = calculateTextSimilarity(content, review.content)
        maxSimilarity = Math.max(maxSimilarity, similarity)
      }
    }

    return {
      is_duplicate: maxSimilarity >= 80,
      similarity_percentage: Math.round(maxSimilarity)
    }

  } catch (error) {
    console.error('Error checking duplicate content:', error)
    return { is_duplicate: false, similarity_percentage: 0 }
  }
}

/**
 * Calculate text similarity percentage using simple algorithm
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) {
    return 0
  }

  const set1 = new Set(words1)
  const set2 = new Set(words2)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return (intersection.size / union.size) * 100
}

/**
 * Check for suspicious rating patterns
 */
async function checkRatingPatterns(
  supabase: SupabaseClient,
  userId: string,
  rating: number
): Promise<{ is_suspicious: boolean; reasons: string[] }> {
  const reasons: string[] = []
  let isSuspicious = false

  try {
    // Get user's recent ratings
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('rating, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!recentReviews || recentReviews.length < 3) {
      return { is_suspicious: false, reasons: [] }
    }

    // Check for rating monotony (all same rating)
    const uniqueRatings = new Set(recentReviews.map(r => r.rating))
    if (uniqueRatings.size === 1 && recentReviews.length >= 5) {
      isSuspicious = true
      reasons.push('All recent reviews have the same rating')
    }

    // Check for extreme rating bias (only 1s or 5s)
    const extremeRatings = recentReviews.filter(r => r.rating === 1 || r.rating === 5)
    if (extremeRatings.length >= 5 && extremeRatings.length === recentReviews.length) {
      isSuspicious = true
      reasons.push('Only extreme ratings (1 or 5 stars)')
    }

    // Check for rapid rating changes
    if (recentReviews.length >= 3) {
      const ratings = recentReviews.map(r => r.rating)
      let rapidChanges = 0
      
      for (let i = 1; i < ratings.length; i++) {
        if (Math.abs(ratings[i] - ratings[i-1]) >= 3) {
          rapidChanges++
        }
      }
      
      if (rapidChanges >= 2) {
        isSuspicious = true
        reasons.push('Rapid rating changes detected')
      }
    }

  } catch (error) {
    console.error('Error checking rating patterns:', error)
  }

  return { is_suspicious: isSuspicious, reasons }
}

/**
 * Flag review for manual moderation
 */
export async function flagReviewForModeration(
  supabase: SupabaseClient,
  reviewId: string,
  reason: string,
  flaggedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('moderation_flags')
      .insert({
        review_id: reviewId,
        reason,
        flagged_by: flaggedBy,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    return !error

  } catch (error) {
    console.error('Error flagging review:', error)
    return false
  }
}

/**
 * Auto-moderate review based on moderation result
 */
export async function autoModerateReview(
  supabase: SupabaseClient,
  reviewId: string,
  moderationResult: ModerationResult
): Promise<boolean> {
  try {
    if (moderationResult.suggested_action === 'reject') {
      // Mark review as rejected/hidden
      const { error } = await supabase
        .from('reviews')
        .update({
          is_public: false,
          moderation_status: 'rejected',
          moderation_reason: moderationResult.reasons.join('; '),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      return !error

    } else if (moderationResult.suggested_action === 'flag') {
      // Flag for manual review
      const { error } = await supabase
        .from('reviews')
        .update({
          moderation_status: 'flagged',
          moderation_reason: moderationResult.reasons.join('; '),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      return !error
    }

    return true

  } catch (error) {
    console.error('Error auto-moderating review:', error)
    return false
  }
}