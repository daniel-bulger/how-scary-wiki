'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Ghost, User, LogIn, LogOut, Skull, Smile, Menu, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { SearchDialog } from './SearchDialog';

export function Header() {
  const { user, loading } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setIsAdmin(response.ok);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      console.warn('Firebase not configured');
      return;
    }
    
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-lg bg-white/95 dark:bg-gray-900/95">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 md:space-x-3 group flex-shrink-0">
              <div className="relative">
                <Ghost className="h-8 w-8 md:h-9 md:w-9 text-orange-600 group-hover:text-orange-700 transition-colors" />
                <div className="absolute -inset-1 bg-orange-100 dark:bg-orange-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </div>
              <div>
                <span className="text-lg md:text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">How Scary</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block -mt-1 hidden sm:block">Wiki</span>
              </div>
            </Link>

            {/* Navigation and Search */}
            <div className="flex items-center gap-2 md:gap-4 flex-1">
              {/* Quick Nav Links - Hidden on mobile */}
              <nav className="hidden lg:flex items-center gap-2">
                <Link
                  href="/scariest"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <Skull className="h-4 w-4" />
                  <span>Scariest</span>
                </Link>
                <Link
                  href="/least-scary"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                >
                  <Smile className="h-4 w-4" />
                  <span>Least Scary</span>
                </Link>
                <Link
                  href="/most-popular"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Popular</span>
                </Link>
              </nav>

              {/* Search - Mobile optimized */}
              <div className="flex-1 max-w-xl mx-2 md:mx-4 lg:mx-auto">
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full flex items-center gap-2 md:gap-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl px-3 md:px-5 py-2 md:py-2.5 text-left transition-all hover:shadow-md group"
                >
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 text-sm md:text-base truncate">Search...</span>
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-medium hidden sm:inline">⌘K</span>
                </button>
              </div>
            </div>

            {/* User Menu and Mobile Menu Button */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>

              {loading ? (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              ) : user ? (
                <div className="flex items-center space-x-1 md:space-x-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="hidden lg:flex items-center space-x-1 p-2 md:px-3 md:py-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <div className="flex items-center space-x-1 md:space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline max-w-[150px] truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 p-2 md:px-3 md:py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg md:rounded-xl font-medium shadow-sm hover:shadow-md transition-all text-sm md:text-base"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="bg-white dark:bg-gray-900 w-64 h-full shadow-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
            </div>
            <nav className="p-4 space-y-2">
              <Link
                href="/scariest"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Skull className="h-5 w-5" />
                <span className="font-medium">Scariest Entities</span>
              </Link>
              <Link
                href="/least-scary"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
              >
                <Smile className="h-5 w-5" />
                <span className="font-medium">Least Scary Entities</span>
              </Link>
              <Link
                href="/most-popular"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Most Popular</span>
              </Link>
              <Link
                href="/search"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
              >
                <Search className="h-5 w-5" />
                <span className="font-medium">Search</span>
              </Link>
              {user && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Admin Dashboard</span>
                </Link>
              )}
              {!user && (
                <Link
                  href="/auth/signin"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium">Sign In</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      <SearchDialog open={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}