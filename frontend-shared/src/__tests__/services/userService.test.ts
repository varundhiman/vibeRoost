import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../services/userService';
import { ApiClient } from '../../api/client';
import { User, PrivacySettings, ProfileVisibility } from '../../types';

// Mock ApiClient
vi.mock('../../api/client');

describe('UserService', () => {
  let mockApiClient: ApiClient;
  let userService: UserService;

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    } as any;

    userService = new UserService(mockApiClient);
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        createdAt: '2023-01-01T00:00:00Z',
        privacySettings: {
          profileVisibility: ProfileVisibility.PUBLIC,
          allowDirectMessages: true,
          showInSearch: true,
        },
      };

      mockApiClient.get = vi.fn().mockResolvedValue({
        data: mockUser,
        success: true,
      });

      const result = await userService.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/profile');
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updates = { displayName: 'Updated Name' };
      const updatedUser: User = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Updated Name',
        createdAt: '2023-01-01T00:00:00Z',
        privacySettings: {
          profileVisibility: ProfileVisibility.PUBLIC,
          allowDirectMessages: true,
          showInSearch: true,
        },
      };

      mockApiClient.put = vi.fn().mockResolvedValue({
        data: updatedUser,
        success: true,
      });

      const result = await userService.updateProfile(updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/users/profile', updates);
      expect(result.data).toEqual(updatedUser);
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings', async () => {
      const privacySettings: PrivacySettings = {
        profileVisibility: ProfileVisibility.PRIVATE,
        allowDirectMessages: false,
        showInSearch: false,
      };

      const updatedUser: User = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        createdAt: '2023-01-01T00:00:00Z',
        privacySettings,
      };

      mockApiClient.put = vi.fn().mockResolvedValue({
        data: updatedUser,
        success: true,
      });

      const result = await userService.updatePrivacySettings(privacySettings);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/users/privacy', privacySettings);
      expect(result.data).toEqual(updatedUser);
    });
  });

  describe('searchUsers', () => {
    it('should search users with default pagination', async () => {
      const mockResponse = {
        data: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      };

      mockApiClient.get = vi.fn().mockResolvedValue({
        data: mockResponse,
        success: true,
      });

      const result = await userService.searchUsers('test');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/search?q=test&page=0&size=20');
      expect(result.data).toEqual(mockResponse);
    });

    it('should search users with custom pagination', async () => {
      const mockResponse = {
        data: [],
        page: 1,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      };

      mockApiClient.get = vi.fn().mockResolvedValue({
        data: mockResponse,
        success: true,
      });

      await userService.searchUsers('test', 1, 10);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/search?q=test&page=1&size=10');
    });
  });

  describe('blockUser', () => {
    it('should block a user', async () => {
      mockApiClient.post = vi.fn().mockResolvedValue({
        data: undefined,
        success: true,
      });

      const result = await userService.blockUser('user123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/users/blocks', {
        blockedUserId: 'user123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      mockApiClient.delete = vi.fn().mockResolvedValue({
        data: undefined,
        success: true,
      });

      const result = await userService.unblockUser('user123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/users/blocks/user123');
      expect(result.success).toBe(true);
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture', async () => {
      const mockFile = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });
      const mockResponse = { url: 'https://example.com/profile.jpg' };

      mockApiClient.post = vi.fn().mockResolvedValue({
        data: mockResponse,
        success: true,
      });

      const result = await userService.uploadProfilePicture(mockFile);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/users/profile/picture',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      expect(result.data).toEqual(mockResponse);
    });
  });
});