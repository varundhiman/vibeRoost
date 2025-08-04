import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { setUser } from '@socialrec/frontend-shared';
import { useSDK } from '../../contexts/SDKContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sdk = useSDK();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email: data.email });
      
      const { user, error } = await sdk.auth.signIn(data.email, data.password);
      
      console.log('Login result:', { user, error });
      
      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Invalid email or password');
        return;
      }
      
      if (user) {
        console.log('Login successful, user:', user);
        dispatch(setUser(user));
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        console.warn('No user returned from login');
        toast.error('Login failed - no user returned');
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setLoading(true);
      
      const { error } = await sdk.auth.signInWithProvider(provider);
      
      if (error) {
        toast.error(`Failed to sign in with ${provider}`);
        return;
      }
      
      toast.success(`Signing in with ${provider}...`);
      // The auth state change will be handled by the App component
    } catch (error) {
      console.error('Social login error:', error);
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In - VibeRoost</title>
        <meta name="description" content="Sign in to your VibeRoost account" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-center text-3xl font-bold text-dark-800">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-dark-600">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-primary-500 hover:text-primary-400"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-300 rounded bg-dark-50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-dark-800">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-500 hover:text-primary-400">
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Sign in
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-100 text-dark-600">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
            >
              <span className="sr-only">Sign in with Google</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
            >
              <span className="sr-only">Sign in with Facebook</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin('apple')}
              disabled={loading}
            >
              <span className="sr-only">Sign in with Apple</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C8.396 0 8.025.044 6.79.207 5.557.37 4.697.723 3.953 1.468c-.744.744-1.097 1.604-1.26 2.837C2.53 5.54 2.486 5.911 2.486 9.532s.044 3.992.207 5.225c.163 1.233.516 2.093 1.26 2.837.744.744 1.604 1.097 2.837 1.26 1.235.163 1.606.207 5.227.207s3.992-.044 5.225-.207c1.233-.163 2.093-.516 2.837-1.26.744-.744 1.097-1.604 1.26-2.837.163-1.233.207-1.604.207-5.225s-.044-3.992-.207-5.225c-.163-1.233-.516-2.093-1.26-2.837C16.339.723 15.479.37 14.246.207 13.011.044 12.64 0 12.017 0zm0 2.162c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 3.675c-3.368 0-6.099 2.731-6.099 6.099s2.731 6.099 6.099 6.099 6.099-2.731 6.099-6.099-2.731-6.099-6.099-6.099zm0 10.055c-2.187 0-3.956-1.769-3.956-3.956s1.769-3.956 3.956-3.956 3.956 1.769 3.956 3.956-1.769 3.956-3.956 3.956zm7.75-10.292c0 .787-.64 1.427-1.427 1.427s-1.427-.64-1.427-1.427.64-1.427 1.427-1.427 1.427.64 1.427 1.427z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;