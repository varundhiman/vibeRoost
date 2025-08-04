import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { setUser } from '@socialrec/frontend-shared';
import { useSDK } from '../../contexts/SDKContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sdk = useSDK();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || 'Email verification failed');
          toast.error('Email verification failed');
          return;
        }

        if (type === 'signup' && accessToken && refreshToken) {
          // The tokens should automatically be handled by Supabase
          // Let's check if the user is now authenticated
          const currentUser = sdk.auth.getCurrentUser();
          
          if (currentUser) {
            dispatch(setUser(currentUser));
            setStatus('success');
            toast.success('Email verified successfully! Welcome to VibeRoost!');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            // Wait a moment for auth state to update
            setTimeout(() => {
              const user = sdk.auth.getCurrentUser();
              if (user) {
                dispatch(setUser(user));
                setStatus('success');
                toast.success('Email verified successfully! Welcome to VibeRoost!');
                navigate('/dashboard');
              } else {
                setStatus('error');
                setErrorMessage('Unable to complete verification. Please try logging in.');
              }
            }, 1000);
          }
        } else {
          setStatus('error');
          setErrorMessage('Invalid verification link');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during verification');
        toast.error('Verification failed');
      }
    };

    handleEmailVerification();
  }, [searchParams, sdk, dispatch, navigate]);

  return (
    <>
      <Helmet>
        <title>Email Verification - VibeRoost</title>
        <meta name="description" content="Verifying your email address" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                  Verifying your email...
                </h2>
                <p className="text-secondary-600">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                  Email Verified!
                </h2>
                <p className="text-secondary-600 mb-6">
                  Your email has been successfully verified. You'll be redirected to your dashboard shortly.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                  Verification Failed
                </h2>
                <p className="text-secondary-600 mb-6">
                  {errorMessage}
                </p>
                <div className="space-y-3">
                  <Button onClick={() => navigate('/login')} fullWidth>
                    Try Logging In
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/signup')} 
                    fullWidth
                  >
                    Sign Up Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailVerificationPage;