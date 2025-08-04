import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/UI/Button';
// import Input from '../../components/UI/Input';

const CommunitiesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'joined' | 'discover'>('joined');

  // Mock data
  const joinedCommunities = [
    {
      id: 1,
      name: 'NYC Foodies',
      description: 'Discover the best restaurants and food experiences in New York City',
      memberCount: 1247,
      type: 'PUBLIC',
      isAdmin: false,
      recentActivity: '2 hours ago',
    },
    {
      id: 2,
      name: 'Film Buffs',
      description: 'Movie reviews and discussions for cinema enthusiasts',
      memberCount: 892,
      type: 'PUBLIC',
      isAdmin: true,
      recentActivity: '1 day ago',
    },
    {
      id: 3,
      name: 'Tech Reviews',
      description: 'Reviews of gadgets, software, and tech services',
      memberCount: 2156,
      type: 'PRIVATE',
      isAdmin: false,
      recentActivity: '3 days ago',
    },
  ];

  const discoverCommunities = [
    {
      id: 4,
      name: 'Coffee Connoisseurs',
      description: 'For those who appreciate great coffee and cafes',
      memberCount: 567,
      type: 'PUBLIC',
    },
    {
      id: 5,
      name: 'Book Club Reviews',
      description: 'Share and discover your next great read',
      memberCount: 1089,
      type: 'PUBLIC',
    },
    {
      id: 6,
      name: 'Travel Enthusiasts',
      description: 'Reviews of destinations, hotels, and travel experiences',
      memberCount: 3421,
      type: 'PUBLIC',
    },
  ];

  const handleJoinCommunity = (communityId: number) => {
    console.log('Joining community:', communityId);
    // TODO: Implement join community functionality
  };

  const CommunityCard: React.FC<{ 
    community: any; 
    showJoinButton?: boolean;
    showActivity?: boolean;
  }> = ({ community, showJoinButton = false, showActivity = false }) => (
    <div className="bg-white border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-secondary-900">
              <Link 
                to={`/communities/${community.id}`}
                className="hover:text-primary-600"
              >
                {community.name}
              </Link>
            </h3>
            {community.type === 'PRIVATE' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Private
              </span>
            )}
            {community.isAdmin && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Admin
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-secondary-600">
            {community.description}
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-secondary-500">
            <div className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-1" />
              {community.memberCount.toLocaleString()} members
            </div>
            {showActivity && community.recentActivity && (
              <div>
                Last activity: {community.recentActivity}
              </div>
            )}
          </div>
        </div>
        {showJoinButton && (
          <Button
            size="sm"
            onClick={() => handleJoinCommunity(community.id)}
          >
            Join
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Communities - Social Recommendations</title>
        <meta name="description" content="Discover and join communities to share recommendations" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Communities</h1>
            <p className="mt-1 text-sm text-secondary-600">
              Connect with people who share your interests
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Community
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md leading-5 bg-white placeholder-secondary-500 focus:outline-none focus:placeholder-secondary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('joined')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'joined'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              My Communities ({joinedCommunities.length})
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discover'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Discover
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'joined' && (
            <>
              {joinedCommunities.length > 0 ? (
                joinedCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    showActivity={true}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-secondary-400" />
                  <h3 className="mt-2 text-sm font-medium text-secondary-900">
                    No communities yet
                  </h3>
                  <p className="mt-1 text-sm text-secondary-500">
                    Get started by joining your first community.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setActiveTab('discover')}>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Discover Communities
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'discover' && (
            <>
              {discoverCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  showJoinButton={true}
                />
              ))}
            </>
          )}
        </div>

        {/* Suggested Communities */}
        {activeTab === 'joined' && joinedCommunities.length > 0 && (
          <div className="bg-secondary-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              Suggested for You
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {discoverCommunities.slice(0, 3).map((community) => (
                <div key={community.id} className="bg-white rounded-lg p-4 border border-secondary-200">
                  <h4 className="font-medium text-secondary-900">{community.name}</h4>
                  <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                    {community.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-secondary-500">
                      {community.memberCount.toLocaleString()} members
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinCommunity(community.id)}
                    >
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CommunitiesPage;