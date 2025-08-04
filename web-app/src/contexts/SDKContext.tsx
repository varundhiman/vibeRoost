import React, { createContext, useContext, ReactNode } from 'react';
import { SocialRecSDK } from '@socialrec/frontend-shared';

interface SDKContextType {
  sdk: SocialRecSDK;
}

const SDKContext = createContext<SDKContextType | undefined>(undefined);

interface SDKProviderProps {
  children: ReactNode;
}

// Initialize SDK instance
const sdk = new SocialRecSDK({
  auth: {
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL || 'http://localhost:54321',
    supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  },
  api: {
    baseURL: process.env.REACT_APP_SUPABASE_URL 
      ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1`
      : 'http://localhost:54321/functions/v1',
  },
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