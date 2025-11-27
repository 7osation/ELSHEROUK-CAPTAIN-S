import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/Button';

const Header: React.FC = () => {
  const { currentUser, logout } = useAppContext();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">El Sherouk Captain's</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-300 hidden sm:block">
              Welcome, <span className="font-semibold">{currentUser?.name}</span>
            </span>
            <Button onClick={logout} variant="secondary">Logout</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;