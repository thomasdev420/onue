'use client';

import React, { useState } from 'react';
import { Search, Play, Heart, BarChart3, ChevronDown, Star, HelpCircle, Eye, ArrowUpDown, Filter, Check } from 'lucide-react';

export default function ResearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedFilter, setSelectedFilter] = useState('relevance');
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Display options
  const [displayOptions, setDisplayOptions] = useState({
    views: true,
    likes: true,
    bookmarks: false,
    engagementRate: false
  });
  
  // Sort options
  const [sortOption, setSortOption] = useState('likes-most');
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    'mobile-app': true,
    'no-medium': true,
    'linktree': true,
    'ebook': true,
    'website': true,
    'amazon-affiliate': true
  });

  const filters = [
    { id: 'tiktok', name: 'TikTok', icon: <Play size={16} />, hasDropdown: true },
    { id: 'relevance', name: 'Relevance', icon: <Search size={16} />, hasDropdown: false },
    { id: 'viral', name: 'Viral', icon: <Star size={16} />, hasDropdown: false },
    { id: 'engagement', name: 'High Engagement', icon: <Heart size={16} />, hasDropdown: false },
    { id: 'popular', name: 'Popular (100K+)', icon: <BarChart3 size={16} />, hasDropdown: false }
  ];

  const videoItems = [
    {
      id: 1,
      title: 'Review somersby...',
      fireScore: 30,
      views: '6.1K',
      user: 'Review somersby...',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Two people holding up three Somersby cans'
    },
    {
      id: 2,
      title: 'Как да отворите Somersby с бутилка от минерална вода',
      fireScore: 35,
      views: '99.1K',
      user: 'Бях барманка на...',
      userDisplayName: 'Ana-Mariya',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Person in black clothing pouring liquid from a bottle'
    },
    {
      id: 3,
      title: 'SOMERSBY TWIST',
      fireScore: 48,
      views: '813.3K',
      user: 'SOMERSBY TWIS...',
      userDisplayName: 'Mister_Bartender1',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Blue-green Somersby bottle with lime wedge'
    },
    {
      id: 4,
      title: 'Somersby Mango-Lemon Blackberry uittesten',
      fireScore: 19,
      views: '32.9K',
      user: 'Welke Somersby...',
      userDisplayName: 'Matthias Olbrechts',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Man with shaved head and sunglasses at table with Somersby bottles'
    },
    {
      id: 5,
      title: 'Bev Review Satur...',
      fireScore: 20,
      views: '4.5K',
      user: 'Ms Z Mjezu',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Person holding up Somersby can with air conditioner in background'
    },
    {
      id: 6,
      title: 'một chút ngọt một...',
      fireScore: 16,
      views: '23.7K',
      user: 'DEPOT THỦ ĐỨC SG',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Hand holding Somersby Apple Sparkling Cider can'
    },
    {
      id: 7,
      title: 'Want to work in IT Support? LEARN THIS FIRST!!',
      fireScore: 47,
      views: '156.2K',
      user: 'IT Tips Daily',
      userDisplayName: 'Tech Guru',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Man looking up at camera'
    },
    {
      id: 8,
      title: 'For us, we rly like ✨Somersby✨',
      fireScore: 36,
      views: '78.9K',
      user: 'Lifestyle Vibes',
      userDisplayName: 'Sarah & Emma',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Two women holding up small items'
    },
    {
      id: 9,
      title: 'SOMERSBY ÄPPELCIDER',
      fireScore: 11,
      views: '12.3K',
      user: 'Swedish Drinks',
      userDisplayName: 'Nordic Taste',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Somersby Apple can on table'
    },
    {
      id: 10,
      title: 'SOMERSBY ÄPPELCIDER',
      fireScore: 39,
      views: '45.7K',
      user: 'German Beverages',
      userDisplayName: 'Deutsche Drinks',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Somersby Äppelcider can'
    },
    {
      id: 11,
      title: 'How can u get a help desk job with security plus when security plus teaches nothing about IT?',
      fireScore: 25,
      views: '89.4K',
      user: 'IT Career Tips',
      userDisplayName: 'Tech Career Coach',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Woman looking at camera with comment box overlay'
    },
    {
      id: 12,
      title: 'RSBY UỐNG CỰC NGON BẮT MÓN CỰC DÍNH',
      fireScore: 58,
      views: '234.1K',
      user: 'Vietnamese Food',
      userDisplayName: 'Food Explorer',
      userAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      description: 'Woman with pink hair holding Somersby can'
    }
  ];

  const filteredItems = videoItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDisplayToggle = (option) => {
    setDisplayOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleFilterToggle = (option) => {
    setFilterOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 pl-4">
        {/* Header */}
        <div className="mb-8">
          {/* Title and Subtitle */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Content library</h1>
            <p className="text-sm text-gray-600">See what TikToks businesses are posting</p>
          </div>
          
          {/* Search and Action Buttons */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search 1634 slideshows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 flex-shrink-0">
              {/* Display Button */}
              <div className="relative">
                <button 
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                    openDropdown === 'display' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setOpenDropdown(openDropdown === 'display' ? null : 'display')}
                >
                  <Eye size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Display</span>
                </button>
                
                {openDropdown === 'display' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleDisplayToggle('views')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${displayOptions.views ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {displayOptions.views && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Views</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleDisplayToggle('likes')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${displayOptions.likes ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {displayOptions.likes && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Likes</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleDisplayToggle('bookmarks')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${displayOptions.bookmarks ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {displayOptions.bookmarks && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Bookmarks</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleDisplayToggle('engagementRate')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${displayOptions.engagementRate ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {displayOptions.engagementRate && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Engagement Rate</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Button */}
              <div className="relative">
                <button 
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                    openDropdown === 'sort' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                >
                  <ArrowUpDown size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Sort</span>
                </button>
                
                {openDropdown === 'sort' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'views-most' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('views-most')}>
                        <span className="text-sm">Views (Most)</span>
                      </div>
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'views-least' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('views-least')}>
                        <span className="text-sm">Views (Least)</span>
                      </div>
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'likes-most' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('likes-most')}>
                        <span className="text-sm">Likes (Most)</span>
                      </div>
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'likes-least' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('likes-least')}>
                        <span className="text-sm">Likes (Least)</span>
                      </div>
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'bookmarks-most' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('bookmarks-most')}>
                        <span className="text-sm">Bookmarks (Most)</span>
                      </div>
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'bookmarks-least' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('bookmarks-least')}>
                        <span className="text-sm">Bookmarks (Least)</span>
                      </div>
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'engagement-most' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('engagement-most')}>
                        <span className="text-sm">Likes Engagement Rate (Most)</span>
                      </div>
                      <div className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${sortOption === 'engagement-least' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSortOption('engagement-least')}>
                        <span className="text-sm">Likes Engagement Rate (Least)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button 
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                    openDropdown === 'filter' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                >
                  <Filter size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filter</span>
                </button>
                
                {openDropdown === 'filter' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    <div className="p-2">
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        </div>
                        <span className="text-sm text-gray-700">Select All</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        </div>
                        <span className="text-sm text-gray-700">None</span>
                        <span className="text-xs text-gray-500 ml-auto">(703)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleFilterToggle('mobile-app')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterOptions['mobile-app'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {filterOptions['mobile-app'] && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Mobile App</span>
                        <span className="text-xs text-gray-500 ml-auto">(281)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleFilterToggle('no-medium')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterOptions['no-medium'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {filterOptions['no-medium'] && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">No medium</span>
                        <span className="text-xs text-gray-500 ml-auto">(153)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleFilterToggle('linktree')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterOptions['linktree'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {filterOptions['linktree'] && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Linktree</span>
                        <span className="text-xs text-gray-500 ml-auto">(90)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleFilterToggle('ebook')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterOptions['ebook'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {filterOptions['ebook'] && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">eBook</span>
                        <span className="text-xs text-gray-500 ml-auto">(88)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleFilterToggle('website')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterOptions['website'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {filterOptions['website'] && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Website</span>
                        <span className="text-xs text-gray-500 ml-auto">(76)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleFilterToggle('amazon-affiliate')}>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterOptions['amazon-affiliate'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {filterOptions['amazon-affiliate'] && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Amazon Affiliate</span>
                        <span className="text-xs text-gray-500 ml-auto">(56)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 