import { ApiClient } from './api/client';
import { SupabaseAuthService, AuthConfig } from './auth/supabaseAuth';
import { ApiConfig, defaultApiConfig } from './api/config';
import { UserService } from './services/userService';
import { CommunityService } from './services/communityService';
import { ReviewService } from './services/reviewService';
import { FeedService } from './services/feedService';
import { ExternalApiService } from './services/externalApiService';

export interface SocialRecSDKConfig {
  auth: AuthConfig;
  api?: Partial<ApiConfig>;
}

export class SocialRecSDK {
  public readonly auth: SupabaseAuthService;
  public readonly api: ApiClient;
  public readonly users: UserService;
  public readonly communities: CommunityService;
  public readonly reviews: ReviewService;
  public readonly feed: FeedService;
  public readonly external: ExternalApiService;

  constructor(config: SocialRecSDKConfig) {
    // Initialize auth service
    this.auth = new SupabaseAuthService(config.auth);

    // Initialize API client with merged config
    const apiConfig = { ...defaultApiConfig, ...config.api };
    this.api = new ApiClient(this.auth, apiConfig);

    // Initialize service layers
    this.users = new UserService(this.api);
    this.communities = new CommunityService(this.api);
    this.reviews = new ReviewService(this.api);
    this.feed = new FeedService(this.api);
    this.external = new ExternalApiService(this.api);
  }

  /**
   * Initialize the SDK and set up auth state listeners
   */
  async initialize(): Promise<void> {
    // Auth service initializes automatically in constructor
    // Additional initialization logic can be added here
  }

  /**
   * Clean up resources and listeners
   */
  destroy(): void {
    // Clean up any listeners or resources
    // Auth service cleanup would go here if needed
  }
}