import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { selectUser } from '@socialrec/frontend-shared';

const ProfilePage: React.FC = () => {
  const user = useSelector(selectUser);

  return (
    <>
      <Helmet>
        <title>Profile - Social Recommendations</title>
      </Helmet>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-secondary-900">
          Your Profile
        </h1>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700">Email</label>
            <p className="mt-1 text-sm text-secondary-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Username</label>
            <p className="mt-1 text-sm text-secondary-900">{user?.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Display Name</label>
            <p className="mt-1 text-sm text-secondary-900">{user?.displayName}</p>
          </div>
        </div>
        <p className="mt-6 text-secondary-500">
          Profile editing functionality will be implemented here.
        </p>
      </div>
    </>
  );
};

export default ProfilePage;