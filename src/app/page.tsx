import { Ghost, Search, TrendingUp, Users, Zap, Skull, Smile } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-2xl mb-6">
            <Ghost className="h-20 w-20 text-orange-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-4">How Scary Wiki</h1>
          <div className="h-1 w-32 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full"></div>
        </div>
        <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
          The ultimate collaborative guide to rating how scary things are across multiple dimensions. 
          Discover, rate, and explore the scariest movies, books, games, and more.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/search"
            className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <Search className="h-6 w-6" />
            <span>Start Exploring</span>
          </Link>
          <Link
            href="/auth/signin"
            className="flex items-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md transition-all"
          >
            <Users className="h-6 w-6" />
            <span>Join Community</span>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 py-16">
        <div className="group text-center p-8 bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
          <div className="bg-gradient-to-br from-orange-100 to-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">Multi-Dimensional Ratings</h3>
          <p className="text-gray-600 leading-relaxed">
            Rate scary content across jump scares, gore, psychological terror, suspense, and disturbing content.
          </p>
        </div>

        <div className="group text-center p-8 bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
          <div className="bg-gradient-to-br from-orange-100 to-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Zap className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">AI-Powered Analysis</h3>
          <p className="text-gray-600 leading-relaxed">
            Get instant AI-generated scary analysis when you search for new content not yet in our database.
          </p>
        </div>

        <div className="group text-center p-8 bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
          <div className="bg-gradient-to-br from-orange-100 to-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Users className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">Community Driven</h3>
          <p className="text-gray-600 leading-relaxed">
            Join a community of horror enthusiasts rating and reviewing scary content from around the world.
          </p>
        </div>
      </div>

      {/* Top Entities Section */}
      <div className="grid md:grid-cols-3 gap-6 py-16">
        <Link
          href="/scariest"
          className="group bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200 hover:border-red-300 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Skull className="h-8 w-8 text-red-600" />
            </div>
            <span className="text-red-600 font-semibold text-sm group-hover:translate-x-2 transition-transform">
              Explore →
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">The Scariest</h3>
          <p className="text-gray-700 text-sm">
            Discover the most terrifying movies, books, and media according to our AI analysis.
          </p>
        </Link>

        <Link
          href="/least-scary"
          className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 hover:border-green-300 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Smile className="h-8 w-8 text-green-600" />
            </div>
            <span className="text-green-600 font-semibold text-sm group-hover:translate-x-2 transition-transform">
              Explore →
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">The Least Scary</h3>
          <p className="text-gray-700 text-sm">
            Find the most benign and family-friendly content in our collection.
          </p>
        </Link>

        <Link
          href="/most-popular"
          className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <span className="text-blue-600 font-semibold text-sm group-hover:translate-x-2 transition-transform">
              Explore →
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Most Popular</h3>
          <p className="text-gray-700 text-sm">
            See what the community is rating the most. Join the conversation!
          </p>
        </Link>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border-2 border-gray-100 p-10 mb-16">
        <h2 className="text-3xl font-serif font-bold text-center mb-10 text-gray-900">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center group">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
              1
            </div>
            <h4 className="font-semibold mb-2 text-gray-900">Search</h4>
            <p className="text-sm text-gray-600 leading-relaxed">Search for any scary movie, book, game, or entity</p>
          </div>
          <div className="text-center group">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
              2
            </div>
            <h4 className="font-semibold mb-2 text-gray-900">AI Analysis</h4>
            <p className="text-sm text-gray-600 leading-relaxed">Get instant AI-generated scary analysis for new content</p>
          </div>
          <div className="text-center group">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
              3
            </div>
            <h4 className="font-semibold mb-2 text-gray-900">Rate & Review</h4>
            <p className="text-sm text-gray-600 leading-relaxed">Add your own ratings across scary dimensions</p>
          </div>
          <div className="text-center group">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
              4
            </div>
            <h4 className="font-semibold mb-2 text-gray-900">Discover</h4>
            <p className="text-sm text-gray-600 leading-relaxed">Find new scary content based on your preferences</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-serif font-bold mb-4">Ready to Explore the Scary Side?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Join thousands of users discovering and rating scary content
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
          >
            <span>Sign Up & Start Rating</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
