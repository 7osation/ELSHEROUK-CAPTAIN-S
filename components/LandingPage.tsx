import React from 'react';
import { Button } from './ui/Button';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-white">El Sherouk Captain's</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={onLoginClick}
                className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
              >
                Log In
              </button>
              <Button onClick={onLoginClick} className="hidden sm:inline-flex">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-32 flex-grow flex items-center">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center lg:text-left lg:flex lg:items-center lg:justify-between">
          <div className="lg:w-1/2">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">Your Daily Commute,</span>
              <span className="block text-indigo-600 dark:text-indigo-400">Simplified.</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              Join the most reliable community ride-sharing service in El Sherouk. Connect with verified captains, enjoy fair tariffs, and ride with peace of mind.
            </p>
            <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start">
              <div className="rounded-md shadow">
                <Button onClick={onLoginClick} size="lg" className="w-full sm:w-auto px-8 py-3 text-base font-medium">
                  Book a Ride
                </Button>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <Button onClick={onLoginClick} variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-3 text-base font-medium">
                  Drive with Us
                </Button>
              </div>
            </div>
          </div>
          
          {/* Abstract Hero Graphic */}
          <div className="mt-12 lg:mt-0 lg:w-1/2 lg:pl-10 relative">
             <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-8">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                            <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                     <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300">
                             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                <div className="h-4 w-8 bg-green-100 dark:bg-green-900 rounded"></div>
                            </div>
                            <div className="h-3 w-40 bg-gray-100 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                    <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg w-full"></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">Why Choose Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Better rides, better community.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mb-6">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Verified Drivers</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Every captain in our community is thoroughly vetted to ensure your safety and comfort on every trip.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mb-6">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Fair Pricing</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Transparent tariffs with no hidden fees. Our smart algorithms ensure fair prices for both passengers and drivers.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mb-6">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Real-time Tracking</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Track your ride in real-time. Share your trip status with loved ones for added security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-400 dark:text-gray-500">
            &copy; 2024 El Sherouk Captain's. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
