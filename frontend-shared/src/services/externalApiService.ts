import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/config';
import { ApiResponse, MovieData, RestaurantData } from '../types';

export interface MovieSearchRequest {
  query: string;
  year?: number;
  page?: number;
}

export interface RestaurantSearchRequest {
  query: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  type?: string;
}

// Legacy interfaces for backward compatibility
export interface GooglePlacesSearchRequest extends RestaurantSearchRequest {}
export interface GooglePlacesData extends RestaurantData {}
export interface RottenTomatoesSearchRequest {
  query: string;
  type?: 'movie' | 'tv';
}
export interface RottenTomatoesData extends MovieData {}

export class ExternalApiService {
  constructor(private apiClient: ApiClient) {}

  // Movie API methods
  async searchMovies(request: MovieSearchRequest): Promise<ApiResponse<{ results: MovieData[]; total_results: number; total_pages: number; page: number }>> {
    const params = new URLSearchParams();
    params.append('query', request.query);
    if (request.year) params.append('year', request.year.toString());
    if (request.page) params.append('page', request.page.toString());

    return this.apiClient.get<{ results: MovieData[]; total_results: number; total_pages: number; page: number }>(
      `${API_ENDPOINTS.EXTERNAL_MOVIES_SEARCH}?${params.toString()}`
    );
  }

  async getMovieDetails(id: string): Promise<ApiResponse<MovieData>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.EXTERNAL_MOVIES_DETAIL, { id });
    return this.apiClient.get<MovieData>(url);
  }

  // Restaurant API methods
  async searchRestaurants(request: RestaurantSearchRequest): Promise<ApiResponse<{ results: RestaurantData[]; status: string; next_page_token?: string }>> {
    const params = new URLSearchParams();
    params.append('query', request.query);
    if (request.location) {
      params.append('lat', request.location.lat.toString());
      params.append('lng', request.location.lng.toString());
    }
    if (request.radius) params.append('radius', request.radius.toString());
    if (request.type) params.append('type', request.type);

    return this.apiClient.get<{ results: RestaurantData[]; status: string; next_page_token?: string }>(
      `${API_ENDPOINTS.EXTERNAL_RESTAURANTS_SEARCH}?${params.toString()}`
    );
  }

  async getRestaurantDetails(placeId: string): Promise<ApiResponse<RestaurantData>> {
    const url = this.apiClient.buildUrl(API_ENDPOINTS.EXTERNAL_RESTAURANTS_DETAIL, { id: placeId });
    return this.apiClient.get<RestaurantData>(url);
  }


}