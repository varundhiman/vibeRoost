import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  StarIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import Button from '../components/UI/Button';

const features = [
  {
    name: 'Community Reviews',
    description: 'Share and discover recommendations within your trusted communities.',
    icon: StarIcon,
  },
  {
    name: 'Join Communities',
    description: 'Connect with like-minded people who share your interests and tastes.',
    icon: UserGroupIcon,
  },
  {
    name: 'Social Interaction',
    description: 'Like, comment, and engage with reviews from your community members.',
    icon: ChatBubbleLeftRightIcon,
  },
];

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>VibeRoost - Discover and Share with Your Communities</title>
        <meta 
          name="description" 
          content="Join communities and discover trusted recommendations for restaurants, movies, services, and more from people you trust." 
        />
        <meta name="keywords" content="recommendations, reviews, communities, social, restaurants, movies, viberoost" />
      </Helmet>

      <div className="min-h-screen bg-dark-50">
        {/* Header */}
        <header className="relative bg-dark-100 border-b border-dark-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <span className="text-2xl font-bold text-primary-500">
                  VibeRoost
                </span>
              </div>
              <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
                <Link
                  to="/login"
                  className="whitespace-nowrap text-base font-medium text-dark-600 hover:text-dark-800"
                >
                  Sign in
                </Link>
                <Link to="/signup">
                  <Button className="ml-8">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero section */}
        <main>
          <div className="relative">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-dark-100" />
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800 mix-blend-multiply" />
                </div>
                <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
                  <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                    <span className="block text-white">Find your vibe</span>
                    <span className="block text-primary-200">with your community</span>
                  </h1>
                  <p className="mt-6 max-w-lg mx-auto text-center text-xl text-primary-200 sm:max-w-3xl">
                    Join communities of people who share your interests and discover trusted recommendations 
                    for restaurants, movies, services, and more.
                  </p>
                  <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                    <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                      <Link to="/signup">
                        <Button size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-dark-100">
                          Get started
                          <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600"
                        >
                          Sign in
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features section */}
          <div className="py-16 bg-dark-100 overflow-hidden lg:py-24">
            <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
              <div className="relative">
                <h2 className="text-center text-3xl leading-8 font-bold tracking-tight text-dark-800 sm:text-4xl">
                  Why choose VibeRoost?
                </h2>
                <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-dark-600">
                  Get personalized recommendations from people you trust in communities that matter to you.
                </p>
              </div>

              <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-center">
                <div className="relative">
                  <div className="space-y-12">
                    {features.map((feature) => (
                      <div key={feature.name} className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                            <feature.icon className="h-6 w-6" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg leading-6 font-medium text-dark-800">
                            {feature.name}
                          </h3>
                          <p className="mt-2 text-base text-dark-600">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA section */}
          <div className="bg-primary-700">
            <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                <span className="block">Ready to get started?</span>
                <span className="block">Join your first community today.</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-primary-200">
                Create your account and start discovering amazing recommendations from your communities.
              </p>
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="mt-8 bg-white text-primary-600 hover:bg-secondary-50"
                >
                  Get started for free
                </Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
            <div className="flex justify-center space-x-6 md:order-2">
              <Link to="/privacy" className="text-secondary-400 hover:text-secondary-500">
                <span className="sr-only">Privacy Policy</span>
                Privacy
              </Link>
              <Link to="/terms" className="text-secondary-400 hover:text-secondary-500">
                <span className="sr-only">Terms of Service</span>
                Terms
              </Link>
              <Link to="/contact" className="text-secondary-400 hover:text-secondary-500">
                <span className="sr-only">Contact</span>
                Contact
              </Link>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-secondary-400">
                &copy; 2024 Social Recommendations. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;