import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useSDK } from '../../contexts/SDKContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';

const CreateCommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const sdk = useSDK();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    type: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY',
    is_private: false
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (type: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY') => {
    setFormData(prev => ({
      ...prev,
      type,
      is_private: type !== 'PUBLIC'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Community name is required');
      return;
    }

    try {
      setLoading(true);
      
      const result = await sdk.communities.createCommunity({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        type: formData.type,
        is_private: formData.is_private
      });

      if (result.success && result.data) {
        toast.success('Community created successfully!');
        navigate(`/communities/${result.data.id}`);
      } else {
        toast.error('Failed to create community. Please try again.');
      }
    } catch (error) {
      console.error('Error creating community:', error);
      toast.error('Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Community - Social Recommendations</title>
        <meta name="description" content="Create a new community to share recommendations" />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/communities')}
            className="flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Communities
          </button>
          
          <h1 className="text-2xl font-bold text-secondary-900">Create Community</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Start a new community to share recommendations with like-minded people
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            {/* Community Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                Community Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., NYC Foodies, Film Buffs, Coffee Lovers"
                maxLength={100}
                required
              />
              <p className="mt-1 text-xs text-secondary-500">
                Choose a clear, descriptive name for your community
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what your community is about, what kind of recommendations you'll share..."
                className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-secondary-500">
                Help people understand what your community is about
              </p>
            </div>

            {/* Community Image */}
            <div className="mb-6">
              <label htmlFor="image_url" className="block text-sm font-medium text-secondary-700 mb-2">
                Community Image
              </label>
              <div className="flex items-center space-x-4">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Community preview"
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-secondary-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    Optional: Add an image URL to represent your community
                  </p>
                </div>
              </div>
            </div>

            {/* Community Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Community Type
              </label>
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="type"
                    value="PUBLIC"
                    checked={formData.type === 'PUBLIC'}
                    onChange={() => handleTypeChange('PUBLIC')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-secondary-900">Public</div>
                    <div className="text-sm text-secondary-500">
                      Anyone can find and join this community
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="type"
                    value="PRIVATE"
                    checked={formData.type === 'PRIVATE'}
                    onChange={() => handleTypeChange('PRIVATE')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-secondary-900">Private</div>
                    <div className="text-sm text-secondary-500">
                      Only members can see the community and its content
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="type"
                    value="INVITE_ONLY"
                    checked={formData.type === 'INVITE_ONLY'}
                    onChange={() => handleTypeChange('INVITE_ONLY')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-secondary-900">Invite Only</div>
                    <div className="text-sm text-secondary-500">
                      People can only join by invitation from existing members
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/communities')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !formData.name.trim()}
            >
              Create Community
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateCommunityPage;