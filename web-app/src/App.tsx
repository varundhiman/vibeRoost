import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectIsAuthenticated, 
  selectAuthLoading,
  setUser,
  setLoading
} from '@socialrec/frontend-shared';
import { SDKProvider, useSDK } from './contexts/SDKContext';
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import SignUpPage from './pages/Auth/SignUpPage';
import EmailVerificationPage from './pages/Auth/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CommunitiesPage from './pages/Communities/CommunitiesPage';
import CommunityDetailPage from './pages/Communities/CommunityDetailPage';
import CreateCommunityPage from './pages/Communities/CreateCommunityPage';
import ReviewsPage from './pages/Reviews/ReviewsPage';
import CreateReviewPage from './pages/Reviews/CreateReviewPage';
import ReviewDetailPage from './pages/Reviews/ReviewDetailPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/UI/LoadingSpinner';

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const sdk = useSDK();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch(setLoading(true));
        await sdk.initialize();
        
        // Set up auth state listener
        const unsubscribe = sdk.auth.onAuthStateChange((user) => {
          dispatch(setUser(user));
        });

        // Check current auth state
        const currentUser = sdk.auth.getCurrentUser();
        dispatch(setUser(currentUser));

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    const cleanup = initializeApp();
    
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, [dispatch, sdk]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUpPage />} 
        />
      </Route>
      
      {/* Email verification route - outside AuthLayout to avoid redirect loops */}
      <Route 
        path="/auth/verify" 
        element={<EmailVerificationPage />} 
      />

      {/* Protected routes */}
      <Route element={<Layout />}>
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/communities" 
          element={isAuthenticated ? <CommunitiesPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/communities/create" 
          element={isAuthenticated ? <CreateCommunityPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/communities/:id" 
          element={isAuthenticated ? <CommunityDetailPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/reviews" 
          element={isAuthenticated ? <ReviewsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/reviews/create" 
          element={isAuthenticated ? <CreateReviewPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/reviews/:id" 
          element={isAuthenticated ? <ReviewDetailPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" replace />} 
        />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function App() {
  return (
    <SDKProvider>
      <AppContent />
    </SDKProvider>
  );
}

export default App;