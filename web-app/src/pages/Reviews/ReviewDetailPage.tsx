import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Helmet>
        <title>Review Details - Social Recommendations</title>
      </Helmet>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-secondary-900">
          Review Details
        </h1>
        <p className="mt-2 text-secondary-600">
          Review ID: {id}
        </p>
        <p className="mt-4 text-secondary-500">
          This page will show detailed review information, comments, and interactions.
        </p>
      </div>
    </>
  );
};

export default ReviewDetailPage;