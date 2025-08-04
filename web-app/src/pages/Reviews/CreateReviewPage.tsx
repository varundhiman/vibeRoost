import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { 
  StarIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSDK } from '../../contexts/SDKContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';

interface CreateReviewFormData {
  itemName: string;
  itemType: string;
  title: string;
  description: string;
  rating: number;
  communities: string[];
}

const CreateReviewPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const navigate = useNavigate();
  const sdk = useSDK();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateReviewFormData>();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles].slice(0, 5));
    },
  });

  // Fetch user's communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setCommunitiesLoading(true);
        const result = await sdk.communities.getCommunities();
        
        if (result.success && result.data) {
          setCommunities(result.data.data || []);
        } else {
          console.error('Failed to fetch communities:', result);
          toast.error('Failed to load communities');
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
        toast.error('Failed to load communities');
      } finally {
        setCommunitiesLoading(false);
      }
    };

    fetchCommunities();
  }, [sdk]);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateReviewFormData) => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!data.communities || data.communities.length === 0) {
      toast.error('Please select at least one community to share with');
      return;
    }

    try {
      setLoading(true);
      
      // First, create or find the reviewable item
      const itemData = {
        type: data.itemType as any,
        title: data.itemName,
        description: data.description,
      };

      const itemResult = await sdk.reviews.createReviewableItem(itemData);
      
      if (!itemResult.success || !itemResult.data) {
        throw new Error('Failed to create reviewable item');
      }

      // Create reviews for each selected community
      const reviewPromises = data.communities.map(async (communityId) => {
        const reviewData = {
          item_id: itemResult.data.id,
          community_id: communityId,
          rating: rating,
          title: data.title,
          content: data.description,
          is_public: true,
          // TODO: Handle image uploads
        };

        return sdk.reviews.createReview(reviewData);
      });

      const results = await Promise.all(reviewPromises);
      
      // Check if all reviews were created successfully
      const failedReviews = results.filter(result => !result.success);
      
      if (failedReviews.length > 0) {
        throw new Error(`Failed to create ${failedReviews.length} review(s)`);
      }
      
      toast.success('Review created successfully!');
      navigate('/reviews');
    } catch (error: any) {
      console.error('Create review error:', error);
      toast.error(error.message || 'Failed to create review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Review - Social Recommendations</title>
        <meta name="description" content="Share your experience with the community" />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-secondary-900">
                Write a Review
              </h1>
              <p className="mt-1 text-sm text-secondary-600">
                Share your experience to help others in your communities
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Item Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="What are you reviewing?"
                  placeholder="Restaurant name, movie title, etc."
                  error={errors.itemName?.message}
                  {...register('itemName', {
                    required: 'Item name is required',
                  })}
                />

                <div>
                  <label className="block text-sm font-medium text-secondary-700">
                    Category
                  </label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    {...register('itemType', {
                      required: 'Category is required',
                    })}
                  >
                    <option value="">Select category</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="MOVIE">Movie</option>
                    <option value="TV_SHOW">TV Show</option>
                    <option value="SERVICE">Service</option>
                    <option value="VACATION_SPOT">Vacation Spot</option>
                    <option value="ACTIVITY">Activity</option>
                    <option value="RECIPE">Recipe</option>
                  </select>
                  {errors.itemType && (
                    <p className="mt-1 text-sm text-red-600">{errors.itemType.message}</p>
                  )}
                </div>
              </div>

              {/* Review Title */}
              <Input
                label="Review Title"
                placeholder="Summarize your experience in a few words"
                error={errors.title?.message}
                {...register('title', {
                  required: 'Title is required',
                  maxLength: {
                    value: 100,
                    message: 'Title must be less than 100 characters',
                  },
                })}
              />

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <StarIcon
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-secondary-300'
                        } hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-secondary-600">
                    {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Tell us about your experience..."
                  {...register('description', {
                    required: 'Description is required',
                    minLength: {
                      value: 10,
                      message: 'Description must be at least 10 characters',
                    },
                  })}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Photos (optional)
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-secondary-300 hover:border-secondary-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <PhotoIcon className="mx-auto h-12 w-12 text-secondary-400" />
                  <p className="mt-2 text-sm text-secondary-600">
                    {isDragActive
                      ? 'Drop the files here...'
                      : 'Drag & drop photos here, or click to select'}
                  </p>
                  <p className="text-xs text-secondary-500">
                    PNG, JPG, WEBP up to 5 files
                  </p>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Communities */}
              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Share with Communities *
                </label>
                {communitiesLoading ? (
                  <div className="mt-2 text-sm text-secondary-500">Loading communities...</div>
                ) : communities.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {communities.map((community) => (
                      <label key={community.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={community.id}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          {...register('communities', {
                            required: 'Please select at least one community'
                          })}
                        />
                        <span className="ml-2 text-sm text-secondary-700">{community.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-secondary-500">
                    No communities found. You need to join communities to share reviews.
                  </div>
                )}
                {errors.communities && (
                  <p className="mt-1 text-sm text-red-600">{errors.communities.message}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/reviews')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                >
                  Publish Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateReviewPage;