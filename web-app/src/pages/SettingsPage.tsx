import React from 'react';
import { Helmet } from 'react-helmet-async';

const SettingsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Settings - Social Recommendations</title>
      </Helmet>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-secondary-900">
          Settings
        </h1>
        <p className="mt-4 text-secondary-500">
          Privacy settings, notifications, and account preferences will be implemented here.
        </p>
      </div>
    </>
  );
};

export default SettingsPage;