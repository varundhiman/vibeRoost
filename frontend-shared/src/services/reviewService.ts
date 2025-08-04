import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/config';
import { 
  Review, 
  ReviewableItem, 
  ItemType, 
  CreateReviewRequest,
  UpdateReviewRequest,
  CreateReviewableItemRequest,
  ApiResponse, 
  PaginatedResponse 
} from '../types';

export class ReviewService {
  constructor(private apiClient: ApiClient) {}

  async getReviews(page: number = 1, limit: number = 20, communityId?: string): Promise<ApiResponse<PaginatedResponse<Review>>> {
    let url = `${API_ENDPOINTS.REVIEWS}?page=${page}&limit=${limit}`;
    if (communityId) {
      url += `&community_id=${communityId}`;
    }
    return this.apiClient.get<PaginatedResponse<Review>>(url);
  }

  async getReview(id: string): Promise<ApiResponse<Review>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.REVIEW_DETAIL, { id });
    return this.apiClient.get<Review>(url);
  }

  async createReview(request: CreateReviewRequest): Promise<ApiResponse<Review>> {
    return this.apiClient.post<Review>(API_ENDPOINTS.REVIEWS, request);
  }

  async updateReview(id: string, updates: UpdateReviewRequest): Promise<ApiResponse<Review>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.REVIEW_DETAIL, { id });
    return this.apiClient.put<Review>(url, updates);
  }

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.REVIEW_DETAIL, { id });
    return this.apiClient.delete<void>(url);
  }

  async likeReview(id: string): Promise<ApiResponse<void>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.REVIEW_LIKE, { id });
    return this.apiClient.post<void>(url);
  }

  async unlikeReview(id: string): Promise<ApiResponse<void>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.REVIEW_LIKE, { id });
    return this.apiClient.delete<void>(url);
  }

  async getUserReviews(userId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Review>>> {
    return this.apiClient.get<PaginatedResponse<Review>>(
      `${API_ENDPOINTS.REVIEWS}?user_id=${userId}&page=${page}&limit=${limit}`
    );
  }

  async getReviewableItems(type?: ItemType, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<ReviewableItem>>> {
    let url = `${API_ENDPOINTS.REVIEWABLE_ITEMS}?page=${page}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    return this.apiClient.get<PaginatedResponse<ReviewableItem>>(url);
  }

  async getReviewableItem(id: string): Promise<ApiResponse<ReviewableItem>> {
    return this.apiClient.get<ReviewableItem>(`${API_ENDPOINTS.REVIEWABLE_ITEMS}/${id}`);
  }

  async createReviewableItem(request: CreateReviewableItemRequest): Promise<ApiResponse<ReviewableItem>> {
    return this.apiClient.post<ReviewableItem>(API_ENDPOINTS.REVIEWABLE_ITEMS, request);
  }

  async searchReviewableItems(query: string, type?: ItemType, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<ReviewableItem>>> {
    let url = `${API_ENDPOINTS.REVIEWABLE_ITEMS}?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    return this.apiClient.get<PaginatedResponse<ReviewableItem>>(url);
  }

  async getItemReviews(itemId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Review>>> {
    return this.apiClient.get<PaginatedResponse<Review>>(
      `${API_ENDPOINTS.REVIEWS}?item_id=${itemId}&page=${page}&limit=${limit}`
    );
  }


}