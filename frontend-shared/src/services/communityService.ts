import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/config';
import { 
  Community, 
  CommunityMembership, 
  CreateCommunityRequest,
  UpdateCommunityRequest,
  ApiResponse, 
  PaginatedResponse 
} from '../types';

export interface MembershipActionRequest {
  action: 'JOIN' | 'LEAVE' | 'INVITE' | 'REMOVE' | 'PROMOTE' | 'DEMOTE';
  userId?: string;
}

export class CommunityService {
  constructor(private apiClient: ApiClient) {}

  async getCommunities(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Community>>> {
    return this.apiClient.get<PaginatedResponse<Community>>(
      `${API_ENDPOINTS.COMMUNITIES}?page=${page}&limit=${limit}`
    );
  }

  async getCommunity(id: string): Promise<ApiResponse<Community>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.COMMUNITY_DETAIL, { id });
    return this.apiClient.get<Community>(url);
  }

  async createCommunity(request: CreateCommunityRequest): Promise<ApiResponse<Community>> {
    return this.apiClient.post<Community>(API_ENDPOINTS.COMMUNITIES, request);
  }

  async updateCommunity(id: string, updates: UpdateCommunityRequest): Promise<ApiResponse<Community>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.COMMUNITY_DETAIL, { id });
    return this.apiClient.put<Community>(url, updates);
  }

  async deleteCommunity(id: string): Promise<ApiResponse<void>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.COMMUNITY_DETAIL, { id });
    return this.apiClient.delete<void>(url);
  }

  async searchCommunities(query: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Community>>> {
    return this.apiClient.get<PaginatedResponse<Community>>(
      `${API_ENDPOINTS.COMMUNITIES}?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  async getCommunityMembers(communityId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<CommunityMembership>>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.COMMUNITY_MEMBERS, { id: communityId });
    return this.apiClient.get<PaginatedResponse<CommunityMembership>>(
      `${url}?page=${page}&limit=${limit}`
    );
  }

  async joinCommunity(communityId: string): Promise<ApiResponse<CommunityMembership>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.COMMUNITY_JOIN, { id: communityId });
    return this.apiClient.post<CommunityMembership>(url);
  }

  async leaveCommunity(communityId: string): Promise<ApiResponse<void>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.COMMUNITY_LEAVE, { id: communityId });
    return this.apiClient.delete<void>(url);
  }

  async getUserMemberships(): Promise<ApiResponse<CommunityMembership[]>> {
    return this.apiClient.get<CommunityMembership[]>(`${API_ENDPOINTS.COMMUNITIES}/memberships`);
  }

  // Discovery methods
  async discoverCommunities(filters?: {
    type?: string;
    location?: string;
    tags?: string[];
  }): Promise<ApiResponse<Community[]>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.tags) filters.tags.forEach(tag => params.append('tags', tag));

    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.COMMUNITIES}/discover?${queryString}` : `${API_ENDPOINTS.COMMUNITIES}/discover`;
    
    return this.apiClient.get<Community[]>(url);
  }
}