import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-500">
            VibeRoost
          </h1>
          <p className="mt-2 text-sm text-dark-600">
            Discover and share recommendations with your communities
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-dark-100 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-dark-200">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;