import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/config';
import { FeedItem, ApiResponse, PaginatedResponse } from '../types';

// Legacy interfaces for Redux compatibility
export interface CreatePostRequest {
  content: string;
  referenced_item_id?: string;
  images?: string[];
  community_ids?: string[];
  is_public?: boolean;
}

export interface UpdatePostRequest {
  content?: string;
  images?: string[];
  is_public?: boolean;
}

export class FeedService {
  constructor(private apiClient: ApiClient) {}

  async getFeed(page: number = 1, limit: number = 20, communityId?: string, userId?: string): Promise<ApiResponse<PaginatedResponse<FeedItem>>> {
    let url = `${API_ENDPOINTS.FEED}?page=${page}&limit=${limit}`;
    if (communityId) {
      url += `&community_id=${communityId}`;
    }
    if (userId) {
      url += `&user_id=${userId}`;
    }
    return this.apiClient.get<PaginatedResponse<FeedItem>>(url);
  }

  async getCommunityFeed(communityId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FeedItem>>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.FEED_COMMUNITY, { id: communityId });
    return this.apiClient.get<PaginatedResponse<FeedItem>>(`${url}?page=${page}&limit=${limit}`);
  }

  async getUserFeed(userId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FeedItem>>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.FEED_USER, { id: userId });
    return this.apiClient.get<PaginatedResponse<FeedItem>>(`${url}?page=${page}&limit=${limit}`);
  }

  async refreshFeed(): Promise<ApiResponse<void>> {
    return this.apiClient.post<void>(API_ENDPOINTS.FEED_REFRESH);
  }


}