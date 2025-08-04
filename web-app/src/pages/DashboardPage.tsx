import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { 
  PlusIcon, 
  UserGroupIcon, 
  StarIcon,
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';
import { selectUser } from '@socialrec/frontend-shared';
import Button from '../components/UI/Button';

const DashboardPage: React.FC = () => {
  const user = useSelector(selectUser);

  // Mock data for demonstration
  const recentActivity = [
    {
      id: 1,
      type: 'review',
      user: 'Sarah Chen',
      action: 'reviewed',
      item: 'Blue Hill Restaurant',
      rating: 5,
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'community',
      user: 'Mike Johnson',
      action: 'joined',
      item: 'NYC Foodies',
      time: '4 hours ago',
    },
    {
      id: 3,
      type: 'like',
      user: 'Emma Wilson',
      action: 'liked your review of',
      item: 'The Avengers: Endgame',
      time: '1 day ago',
    },
  ];

  const quickStats = [
    { name: 'Reviews Written', value: '12', icon: StarIcon },
    { name: 'Communities Joined', value: '5', icon: UserGroupIcon },
    { name: 'Likes Received', value: '48', icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - Social Recommendations</title>
        <meta name="description" content="Your personal dashboard for Social Recommendations" />
      </Helmet>

      <div className="space-y-6">
        {/* Welcome header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  Welcome back, {user?.displayName || user?.username}!
                </h1>
                <p className="mt-1 text-sm text-secondary-600">
                  Here's what's happening in your communities today.
                </p>
              </div>
              <Link to="/reviews/create">
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Review
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-6 w-6 text-secondary-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-secondary-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-secondary-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                Recent Activity
              </h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivity.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-secondary-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                              {activity.type === 'review' && (
                                <StarIcon className="h-4 w-4 text-white" />
                              )}
                              {activity.type === 'community' && (
                                <UserGroupIcon className="h-4 w-4 text-white" />
                              )}
                              {activity.type === 'like' && (
                                <ChatBubbleLeftRightIcon className="h-4 w-4 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-secondary-500">
                                <span className="font-medium text-secondary-900">
                                  {activity.user}
                                </span>{' '}
                                {activity.action}{' '}
                                <span className="font-medium text-secondary-900">
                                  {activity.item}
                                </span>
                                {activity.rating && (
                                  <span className="ml-1">
                                    {'★'.repeat(activity.rating)}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-secondary-500">
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  to="/reviews"
                  className="w-full flex justify-center items-center px-4 py-2 border border-secondary-300 shadow-sm text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
                >
                  View all activity
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/reviews/create"
                  className="w-full flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <StarIcon className="h-5 w-5 mr-3" />
                  Write a Review
                </Link>
                <Link
                  to="/communities"
                  className="w-full flex items-center px-4 py-3 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
                >
                  <UserGroupIcon className="h-5 w-5 mr-3" />
                  Explore Communities
                </Link>
                <Link
                  to="/profile"
                  className="w-full flex items-center px-4 py-3 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
                >
                  <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trending in Communities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
              Trending in Your Communities
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Ramen Yashima', category: 'Restaurant', community: 'NYC Foodies', rating: 4.8 },
                { name: 'Dune: Part Two', category: 'Movie', community: 'Film Buffs', rating: 4.6 },
                { name: 'Central Park', category: 'Activity', community: 'NYC Explorers', rating: 4.9 },
              ].map((item, index) => (
                <div key={index} className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-secondary-900">{item.name}</h4>
                  <p className="text-sm text-secondary-500">{item.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded">
                      {item.community}
                    </span>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-secondary-600">{item.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;