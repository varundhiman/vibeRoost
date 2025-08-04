import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/config';
import { 
  UserProfile, 
  UserBlock,
  UpdateUserProfileRequest,
  ApiResponse, 
  PaginatedResponse 
} from '../types';

export class UserService {
  constructor(private apiClient: ApiClient) {}

  async getProfile(userId?: string): Promise<ApiResponse<UserProfile>> {
    const endpoint = userId 
      ? this.apiClient.buildUrl(API_ENDPOINTS.USER_PROFILE, { id: userId })
      : API_ENDPOINTS.USERS; // Current user profile
    return this.apiClient.get<UserProfile>(endpoint);
  }

  async updateProfile(updates: UpdateUserProfileRequest): Promise<ApiResponse<UserProfile>> {
    return this.apiClient.put<UserProfile>(API_ENDPOINTS.USERS, updates);
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<UserProfile>>> {
    return this.apiClient.get<PaginatedResponse<UserProfile>>(
      `${API_ENDPOINTS.USERS}?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  async blockUser(userId: string): Promise<ApiResponse<UserBlock>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.USER_BLOCK, { id: userId });
    return this.apiClient.post<UserBlock>(url);
  }

  async unblockUser(userId: string): Promise<ApiResponse<void>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.USER_BLOCK, { id: userId });
    return this.apiClient.delete<void>(url);
  }

  async getBlockedUsers(): Promise<ApiResponse<UserBlock[]>> {
    // Get current user's blocked users
    return this.apiClient.get<UserBlock[]>(API_ENDPOINTS.USERS + '/blocked');
  }


}