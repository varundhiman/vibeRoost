import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Community, CommunityMembership } from '../../types';

export interface CommunityState {
  communities: Community[];
  memberships: CommunityMembership[];
  selectedCommunity: Community | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CommunityState = {
  communities: [],
  memberships: [],
  selectedCommunity: null,
  isLoading: false,
  error: null,
};

export const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    setCommunities: (state, action: PayloadAction<Community[]>) => {
      state.communities = action.payload;
      state.error = null;
    },
    addCommunity: (state, action: PayloadAction<Community>) => {
      state.communities.push(action.payload);
    },
    updateCommunity: (state, action: PayloadAction<Community>) => {
      const index = state.communities.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.communities[index] = action.payload;
      }
      if (state.selectedCommunity?.id === action.payload.id) {
        state.selectedCommunity = action.payload;
      }
    },
    removeCommunity: (state, action: PayloadAction<string>) => {
      state.communities = state.communities.filter(c => c.id !== action.payload);
      if (state.selectedCommunity?.id === action.payload) {
        state.selectedCommunity = null;
      }
    },
    setMemberships: (state, action: PayloadAction<CommunityMembership[]>) => {
      state.memberships = action.payload;
    },
    addMembership: (state, action: PayloadAction<CommunityMembership>) => {
      state.memberships.push(action.payload);
    },
    updateMembership: (state, action: PayloadAction<CommunityMembership>) => {
      const index = state.memberships.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.memberships[index] = action.payload;
      }
    },
    removeMembership: (state, action: PayloadAction<string>) => {
      state.memberships = state.memberships.filter(m => m.id !== action.payload);
    },
    setSelectedCommunity: (state, action: PayloadAction<Community | null>) => {
      state.selectedCommunity = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearCommunities: (state) => {
      state.communities = [];
      state.memberships = [];
      state.selectedCommunity = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  setCommunities,
  addCommunity,
  updateCommunity,
  removeCommunity,
  setMemberships,
  addMembership,
  updateMembership,
  removeMembership,
  setSelectedCommunity,
  setLoading,
  setError,
  clearCommunities,
} = communitySlice.actions;

// Selectors
export const selectCommunities = (state: { community: CommunityState }) => state.community.communities;
export const selectMemberships = (state: { community: CommunityState }) => state.community.memberships;
export const selectSelectedCommunity = (state: { community: CommunityState }) => state.community.selectedCommunity;
export const selectCommunityLoading = (state: { community: CommunityState }) => state.community.isLoading;
export const selectCommunityError = (state: { community: CommunityState }) => state.community.error;