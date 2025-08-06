// Unified image categories system
// Single source of truth for all category-related functionality

export const UNIFIED_CATEGORIES = {
  pool: {
    name: 'Pool',
    icon: '🏊',
    color: 'bg-blue-50 border-blue-200',
    keywords: ['pool', 'swimming', 'water', 'aquatic', 'swimming pool', 'poolside', 'beach', 'ocean', 'waterfront']
  },
  sunset_sunrise: {
    name: 'Sunset/Sunrise',
    icon: '🌅',
    color: 'bg-orange-50 border-orange-200',
    keywords: ['sunset', 'sunrise', 'golden hour', 'dusk', 'dawn', 'twilight', 'morning', 'evening', 'sky', 'horizon']
  },
  art: {
    name: 'Old art',
    icon: '🎨',
    color: 'bg-purple-50 border-purple-200',
    keywords: ['art', 'artistic', 'creative', 'painting', 'sculpture', 'gallery', 'museum', 'design', 'aesthetic', 'creative']
  },
  neighbourhood_walk: {
    name: 'Walk',
    icon: '🚶',
    color: 'bg-green-50 border-green-200',
    keywords: ['neighbourhood', 'walk', 'street', 'local', 'community', 'residential', 'sidewalk', 'walking', 'urban', 'city']
  },
  luxury: {
    name: 'Loud Luxury',
    icon: '💎',
    color: 'bg-yellow-50 border-yellow-200',
    keywords: ['luxury', 'premium', 'exclusive', 'high-end', 'sophisticated', 'elegant', 'upscale', 'premium', 'deluxe', 'flashy cars', 'watches', 'range rover', 'dubai', 'dark city', 'luxury cars', 'sports cars', 'supercars', 'rolex', 'cartier', 'patek philippe', 'audemars piguet', 'luxury watches', 'dubai skyline', 'night city', 'urban luxury', 'wealth', 'opulence', 'extravagance']
  },
  old_money: {
    name: 'Old Money',
    icon: '🏛️',
    color: 'bg-amber-50 border-amber-200',
    keywords: ['old money', 'heritage', 'tradition', 'classic', 'timeless', 'sophisticated', 'understated', 'elegant', 'prestigious', 'aristocratic', 'vintage', 'antique', 'manor', 'estate', 'country club', 'yacht', 'sailing', 'polo', 'tennis', 'golf', 'hunting', 'fishing', 'wine', 'whiskey', 'cigar', 'tailored', 'savile row', 'oxford', 'cambridge', 'ivy league', 'prep', 'traditional', 'conservative', 'refined', 'discreet', 'wealth', 'legacy', 'family', 'nobility', 'gentleman', 'lady', 'proper', 'etiquette']
  },
  running: {
    name: 'Running',
    icon: '🏃',
    color: 'bg-red-50 border-red-200',
    keywords: ['running', 'jogging', 'marathon', 'sprint', 'athletics', 'track', 'fitness', 'exercise', 'cardio', 'training', 'race', 'runner', 'sports', 'endurance', 'workout']
  },
  surrealism: {
    name: 'Surrealism',
    icon: '🌌',
    color: 'bg-indigo-50 border-indigo-200',
    keywords: ['surrealism', 'surreal', 'dreamlike', 'fantasy', 'abstract', 'imaginative', 'otherworldly', 'magical', 'mystical', 'dream', 'fantasy', 'unreal', 'bizarre', 'strange']
  },
  fall_evening: {
    name: 'Fall Evening',
    icon: '🍂',
    color: 'bg-orange-50 border-orange-200',
    keywords: ['fall evening', 'autumn evening', 'fall', 'autumn', 'evening', 'cozy', 'warm', 'golden hour', 'leaves', 'harvest', 'seasonal', 'comfortable', 'relaxing']
  },
  summer_lake: {
    name: 'Summer Lake',
    icon: '🏞️',
    color: 'bg-blue-50 border-blue-200',
    keywords: ['summer lake', 'lake', 'summer', 'water', 'outdoors', 'nature', 'swimming', 'boating', 'fishing', 'recreation', 'vacation', 'relaxation', 'scenic']
  },
  school: {
    name: 'School',
    icon: '🎓',
    color: 'bg-green-50 border-green-200',
    keywords: ['school', 'education', 'learning', 'classroom', 'student', 'teacher', 'academic', 'study', 'university', 'college', 'campus', 'lecture', 'homework']
  },
  gym: {
    name: 'Gym',
    icon: '💪',
    color: 'bg-red-50 border-red-200',
    keywords: ['gym', 'fitness', 'workout', 'exercise', 'training', 'muscle', 'strength', 'health', 'sports', 'athletic', 'fitness center', 'weightlifting', 'cardio']
  },
  books: {
    name: 'Books',
    icon: '📚',
    color: 'bg-yellow-50 border-yellow-200',
    keywords: ['books', 'reading', 'literature', 'library', 'bookstore', 'novel', 'story', 'knowledge', 'learning', 'education', 'literary', 'author', 'writing']
  }
};

// Helper functions for different use cases
export const getCategoryNames = () => {
  return Object.keys(UNIFIED_CATEGORIES);
};

export const getCategoryKeywords = (category) => {
  return UNIFIED_CATEGORIES[category]?.keywords || [];
};

export const getCategoryDisplay = (category) => {
  const cat = UNIFIED_CATEGORIES[category];
  return cat ? { name: cat.name, icon: cat.icon, color: cat.color } : null;
};

export const getAllCategories = () => {
  return UNIFIED_CATEGORIES;
};

// For backward compatibility with existing code
export const STOCK_PHOTO_CATEGORIES = Object.fromEntries(
  Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => [key, value.keywords])
);

export const CATEGORIES = Object.fromEntries(
  Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => [
    key, 
    { name: value.name, icon: value.icon, color: value.color }
  ])
);

export const CATEGORY_KEYWORDS = Object.fromEntries(
  Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => [key, value.keywords])
); 