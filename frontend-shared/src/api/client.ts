import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiConfig, defaultApiConfig } from './config';
import { SupabaseAuthService } from '../auth/supabaseAuth';
import { ApiError, ApiResponse, EdgeFunctionResponse } from '../types';

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private authService: SupabaseAuthService;
  private config: ApiConfig;

  constructor(
    authService: SupabaseAuthService,
    config: ApiConfig = defaultApiConfig
  ) {
    this.authService = authService;
    this.config = config;
    
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for adding auth token and Supabase headers
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add Supabase-specific headers for Edge Functions
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        if (supabaseAnonKey) {
          config.headers.apikey = supabaseAnonKey;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for Edge Function response handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Handle Edge Function response format
        return this.transformEdgeFunctionResponse(response);
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors by refreshing token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.authService.refreshSession();
            const token = await this.authService.getAccessToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.authService.signOut();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleEdgeFunctionError(error));
      }
    );
  }

  private transformEdgeFunctionResponse(response: AxiosResponse): AxiosResponse {
    // Check if this is an Edge Function response format
    const data = response.data;
    
    if (data && typeof data === 'object' && ('data' in data || 'error' in data)) {
      const edgeResponse = data as EdgeFunctionResponse;
      
      if (edgeResponse.error) {
        // Convert Edge Function error to axios error format
        const error = new Error(edgeResponse.error.message) as AxiosError;
        error.response = {
          ...response,
          status: this.getStatusCodeFromErrorCode(edgeResponse.error.code),
          data: edgeResponse.error
        };
        throw error;
      }
      
      // Return the data portion for successful responses
      return {
        ...response,
        data: edgeResponse.data
      };
    }
    
    // Return as-is if not Edge Function format (for backward compatibility)
    return response;
  }

  private handleEdgeFunctionError(error: AxiosError): ApiError {
    if (!error.response) {
      // Network error or timeout
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        details: error.message,
      };
    }

    const { status, data } = error.response;
    
    // Handle Edge Function error format
    if (data && typeof data === 'object' && 'error' in data) {
      const edgeError = (data as EdgeFunctionResponse).error;
      if (edgeError) {
        return {
          message: edgeError.message,
          code: edgeError.code,
          details: edgeError.details,
        };
      }
    }
    
    // Fallback to status-based error handling
    switch (status) {
      case 400:
        return {
          message: 'Invalid request. Please check your input.',
          code: 'VALIDATION_ERROR',
          details: data,
        };
      case 401:
        return {
          message: 'Authentication required. Please log in.',
          code: 'AUTH_REQUIRED',
          details: data,
        };
      case 403:
        return {
          message: 'Access denied. You do not have permission.',
          code: 'FORBIDDEN',
          details: data,
        };
      case 404:
        return {
          message: 'Resource not found.',
          code: 'NOT_FOUND',
          details: data,
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: data,
        };
      case 500:
        return {
          message: 'Server error. Please try again later.',
          code: 'INTERNAL_ERROR',
          details: data,
        };
      case 502:
        return {
          message: 'External service error. Please try again later.',
          code: 'EXTERNAL_API_ERROR',
          details: data,
        };
      default:
        return {
          message: 'An unexpected error occurred.',
          code: 'INTERNAL_ERROR',
          details: data,
        };
    }
  }

  private getStatusCodeFromErrorCode(errorCode: string): number {
    switch (errorCode) {
      case 'AUTH_REQUIRED':
      case 'AUTH_INVALID':
        return 401;
      case 'FORBIDDEN':
        return 403;
      case 'NOT_FOUND':
        return 404;
      case 'CONFLICT':
      case 'ALREADY_EXISTS':
        return 409;
      case 'VALIDATION_ERROR':
      case 'INVALID_INPUT':
        return 400;
      case 'RATE_LIMIT_EXCEEDED':
        return 429;
      case 'EXTERNAL_API_ERROR':
        return 502;
      case 'SERVICE_UNAVAILABLE':
        return 503;
      default:
        return 500;
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    attempts: number = this.config.retryAttempts
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempts > 1 && this.shouldRetry(error as AxiosError)) {
        await this.delay(this.config.retryDelay);
        return this.retryRequest(requestFn, attempts - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.get<T>(url, config));
    return { data: response.data, success: true };
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.post<T>(url, data, config));
    return { data: response.data, success: true };
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.put<T>(url, data, config));
    return { data: response.data, success: true };
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.patch<T>(url, data, config));
    return { data: response.data, success: true };
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.delete<T>(url, config));
    return { data: response.data, success: true };
  }

  // Utility method to replace path parameters
  buildUrl(template: string, params: Record<string, string>): string {
    return Object.entries(params).reduce(
      (url, [key, value]) => url.replace(`{${key}}`, encodeURIComponent(value)),
      template
    );
  }
}