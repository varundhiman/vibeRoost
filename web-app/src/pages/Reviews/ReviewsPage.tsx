import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  StarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useSDK } from '../../contexts/SDKContext';
import Button from '../../components/UI/Button';

// Mock data for fallback - moved outside component to avoid re-creation
const mockReviews = [
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

const ReviewsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sdk = useSDK();

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const result = await sdk.reviews.getReviews(1, 20, selectedCommunity || undefined);

        if (result.success && result.data) {
          setReviews(result.data.data || []);
          setHasMore(result.data.pagination?.has_more || false);
        } else {
          console.error('Failed to fetch reviews:', result);
          // Use mock data as fallback
          setReviews(mockReviews);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Use mock data as fallback
        setReviews(mockReviews);
        setHasMore(false);
        toast.error('Failed to load reviews, showing sample data');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sdk, selectedCommunity]);

  // Fetch communities for filter
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const result = await sdk.communities.getCommunities();

        if (result.success && result.data) {
          setCommunities(result.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
      }
    };

    fetchCommunities();
  }, [sdk]);

  const loadMoreReviews = async () => {
    try {
      const nextPage = page + 1;
      const result = await sdk.reviews.getReviews(nextPage, 20, selectedCommunity || undefined);

      if (result.success && result.data) {
        setReviews(prev => [...prev, ...(result.data.data || [])]);
        setPage(nextPage);
        setHasMore(result.data.pagination?.has_more || false);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
      toast.error('Failed to load more reviews');
    }
  };

  const ReviewCard: React.FC<{ review: any }> = ({ review }) => (
    <div className="bg-white border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {(review.images || review.photos)?.length > 0 && (
          <img
            src={(review.images || review.photos)[0]}
            alt={review.item || review.title}
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
                {review.title || 'Untitled Review'}
              </Link>
              <p className="text-sm text-secondary-600 mt-1">
                {review.item || 'Unknown Item'} • {(review.itemType || 'unknown').toLowerCase()}
              </p>
            </div>
            <div className="flex items-center ml-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${i < (review.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-secondary-300'
                    }`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-secondary-700 mt-2 line-clamp-2">
            {review.description || review.content || 'No description available'}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4 text-sm text-secondary-500">
              <span>By {review.author || 'Unknown'}</span>
              <span>•</span>
              <span className="text-primary-600">{review.community || 'Community'}</span>
              <span>•</span>
              <span>{new Date(review.createdAt || review.created_at).toLocaleDateString()}</span>
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
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="RESTAURANT">Restaurants</option>
              <option value="MOVIE">Movies</option>
              <option value="TV_SHOW">TV Shows</option>
              <option value="SERVICE">Services</option>
              <option value="ACTIVITY">Activities</option>
              <option value="VACATION_SPOT">Vacation Spots</option>
              <option value="RECIPE">Recipes</option>
            </select>

            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
            >
              <option value="">All Communities</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-secondary-200 rounded-lg p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-secondary-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-secondary-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-secondary-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-secondary-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-secondary-400 mb-4">
              <StarIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No reviews found</h3>
            <p className="text-secondary-600 mb-6">
              {selectedCommunity || selectedType
                ? 'Try adjusting your filters or create the first review for this selection.'
                : 'Be the first to write a review in your communities!'
              }
            </p>
            <Link to="/reviews/create">
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                Write First Review
              </Button>
            </Link>
          </div>
        )}

        {/* Load More */}
        {!loading && reviews.length > 0 && hasMore && (
          <div className="text-center">
            <Button variant="outline" onClick={loadMoreReviews}>
              Load More Reviews
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ReviewsPage;