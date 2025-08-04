import React, { createContext, useContext, ReactNode } from 'react';
import { SocialRecSDK } from '@socialrec/frontend-shared';

interface SDKContextType {
  sdk: SocialRecSDK;
}

const SDKContext = createContext<SDKContextType | undefined>(undefined);

interface SDKProviderProps {
  children: ReactNode;
}

// Production Supabase configuration - use these values for both local and production
const SUPABASE_URL = 'https://ovjsvutuyfuiomgwbfzt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92anN2dXR1eWZ1aW9tZ3diZnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODYxOTYsImV4cCI6MjA2OTc2MjE5Nn0.7PcEOP5oTub9Yn4tN-a6DyyI7jd552oeu-MAAQKK_eI';

// Debug environment variables
console.log('Environment variables:', {
  REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
  REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
  USING_HARDCODED: 'YES - for consistent local/prod behavior'
});

// Initialize SDK instance - use hardcoded production values for consistency
const sdk = new SocialRecSDK({
  auth: {
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  },
  api: {
    baseURL: `${SUPABASE_URL}/functions/v1`,
  },
});

console.log('SDK initialized with config:', {
  supabaseUrl: SUPABASE_URL,
  apiBaseURL: `${SUPABASE_URL}/functions/v1`,
});

export const SDKProvider: React.FC<SDKProviderProps> = ({ children }) => {
  return (
    <SDKContext.Provider value={{ sdk }}>
      {children}
    </SDKContext.Provider>
  );
};

export const useSDK = (): SocialRecSDK => {
  const context = useContext(SDKContext);
  if (context === undefined) {
    throw new Error('useSDK must be used within a SDKProvider');
  }
  return context.sdk;
};

export default SDKContext;