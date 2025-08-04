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

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  displayName: string;
}

const SignUpPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sdk = useSDK();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setLoading(true);
      
      const { user, error } = await sdk.auth.signUp(data.email, data.password, {
        username: data.username,
        display_name: data.displayName,
        full_name: data.displayName,
      });
      
      if (error) {
        toast.error(error.message || 'Failed to create account');
        return;
      }
      
      if (user) {
        dispatch(setUser(user));
        toast.success('Account created successfully! Please check your email to verify your account.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - VibeRoost</title>
        <meta name="description" content="Create your VibeRoost account" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-center text-3xl font-bold text-dark-800">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-dark-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-500 hover:text-primary-400"
            >
              sign in to your existing account
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
            label="Username"
            type="text"
            autoComplete="username"
            error={errors.username?.message}
            helperText="This will be your unique identifier"
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters',
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Username can only contain letters, numbers, and underscores',
              },
            })}
          />

          <Input
            label="Display Name"
            type="text"
            autoComplete="name"
            error={errors.displayName?.message}
            helperText="This is how others will see your name"
            {...register('displayName', {
              required: 'Display name is required',
              minLength: {
                value: 2,
                message: 'Display name must be at least 2 characters',
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
              },
            })}
          />

          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
          />

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-300 rounded bg-dark-50"
              required
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-dark-800">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-400">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-500 hover:text-primary-400">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Create account
          </Button>
        </form>
      </div>
    </>
  );
};

export default SignUpPage;