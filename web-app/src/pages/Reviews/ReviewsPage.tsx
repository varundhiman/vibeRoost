import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  PlusIcon,
  StarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/UI/Button';

const ReviewsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const reviews = [
    {
      id: 1,
      title: 'Amazing Italian Experience',
      item: 'Osteria Morini',
      itemType: 'RESTAURANT',
      rating: 5,
      description: 'The pasta was incredible and the service was top-notch...',
      author: 'You',
      community: 'NYC Foodies',
      createdAt: '2024-01-15',
      photos: ['https://via.placeholder.com/300x200'],
    },
    {
      id: 2,
      title: 'Great Sci-Fi Film',
      item: 'Dune: Part Two',
      itemType: 'MOVIE',
      rating: 4,
      description: 'Visually stunning with great performances...',
      author: 'Sarah Chen',
      community: 'Film Buffs',
      createdAt: '2024-01-14',
      photos: [],
    },
    {
      id: 3,
      title: 'Solid Coffee Shop',
      item: 'Blue Bottle Coffee',
      itemType: 'RESTAURANT',
      rating: 4,
      description: 'Good coffee and atmosphere for working...',
      author: 'Mike Johnson',
      community: 'Coffee Connoisseurs',
      createdAt: '2024-01-13',
      photos: ['https://via.placeholder.com/300x200'],
    },
  ];

  const ReviewCard: React.FC<{ review: any }> = ({ review }) => (
    <div className="bg-white border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {review.photos.length > 0 && (
          <img
            src={review.photos[0]}
            alt={review.item}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link
                to={`/reviews/${review.id}`}
                className="text-lg font-medium text-secondary-900 hover:text-primary-600"
              >
                {review.title}
              </Link>
              <p className="text-sm text-secondary-600 mt-1">
                {review.item} • {review.itemType.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center ml-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-secondary-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <p className="text-sm text-secondary-700 mt-2 line-clamp-2">
            {review.description}
          </p>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4 text-sm text-secondary-500">
              <span>By {review.author}</span>
              <span>•</span>
              <span className="text-primary-600">{review.community}</span>
              <span>•</span>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Reviews - Social Recommendations</title>
        <meta name="description" content="Browse and discover reviews from your communities" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Reviews</h1>
            <p className="mt-1 text-sm text-secondary-600">
              Discover recommendations from your communities
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link to="/reviews/create">
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                Write Review
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md leading-5 bg-white placeholder-secondary-500 focus:outline-none focus:placeholder-secondary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select className="block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
              <option>All Types</option>
              <option>Restaurants</option>
              <option>Movies</option>
              <option>Services</option>
              <option>Activities</option>
            </select>
            
            <select className="block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
              <option>All Communities</option>
              <option>NYC Foodies</option>
              <option>Film Buffs</option>
              <option>Tech Reviews</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button variant="outline">
            Load More Reviews
          </Button>
        </div>
      </div>
    </>
  );
};

export default ReviewsPage;