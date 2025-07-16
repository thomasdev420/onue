// Unified image categories system
// Single source of truth for all category-related functionality

export const UNIFIED_CATEGORIES = {
  business: {
    name: 'Business',
    icon: '🏢',
    color: 'bg-blue-50 border-blue-200',
    keywords: ['business', 'office', 'corporate', 'professional', 'executive']
  },
  technology: {
    name: 'Technology',
    icon: '💻',
    color: 'bg-purple-50 border-purple-200',
    keywords: ['tech', 'computer', 'digital', 'innovation', 'ai', 'data']
  },
  success: {
    name: 'Success',
    icon: '🏆',
    color: 'bg-yellow-50 border-yellow-200',
    keywords: ['success', 'achievement', 'winning', 'trophy', 'accomplishment']
  },
  motivation: {
    name: 'Motivation',
    icon: '💪',
    color: 'bg-orange-50 border-orange-200',
    keywords: ['motivation', 'inspiration', 'positive', 'energy', 'drive']
  },
  growth: {
    name: 'Growth',
    icon: '📈',
    color: 'bg-green-50 border-green-200',
    keywords: ['growth', 'progress', 'development', 'improvement', 'evolution']
  },
  creativity: {
    name: 'Creativity',
    icon: '🎨',
    color: 'bg-pink-50 border-pink-200',
    keywords: ['creative', 'art', 'design', 'imagination', 'aesthetic', 'creativity']
  },
  social_media: {
    name: 'Social Media',
    icon: '📱',
    color: 'bg-indigo-50 border-indigo-200',
    keywords: ['social', 'media', 'connection', 'network', 'community']
  },
  entrepreneurship: {
    name: 'Entrepreneurship',
    icon: '🚀',
    color: 'bg-red-50 border-red-200',
    keywords: ['entrepreneur', 'startup', 'business', 'leadership', 'founder']
  },
  marketing: {
    name: 'Marketing',
    icon: '📢',
    color: 'bg-teal-50 border-teal-200',
    keywords: ['marketing', 'advertising', 'promotion', 'brand', 'strategy']
  },
  lifestyle: {
    name: 'Lifestyle',
    icon: '🌟',
    color: 'bg-amber-50 border-amber-200',
    keywords: ['lifestyle', 'life', 'daily', 'personal', 'wellness']
  },
  luxury: {
    name: 'Luxury',
    icon: '💎',
    color: 'bg-gray-50 border-gray-200',
    keywords: ['luxury', 'premium', 'exclusive', 'high-end', 'sophisticated', 'elegant']
  },
  nature: {
    name: 'Nature',
    icon: '🌿',
    color: 'bg-emerald-50 border-emerald-200',
    keywords: ['nature', 'outdoor', 'landscape', 'environmental', 'sustainable', 'green', 'trees', 'tree']
  },
  health: {
    name: 'Health',
    icon: '🏥',
    color: 'bg-cyan-50 border-cyan-200',
    keywords: ['health', 'wellness', 'fitness', 'medical', 'healthcare', 'healthy']
  },
  education: {
    name: 'Education',
    icon: '🎓',
    color: 'bg-violet-50 border-violet-200',
    keywords: ['education', 'learning', 'academic', 'school', 'university', 'knowledge']
  },
  finance: {
    name: 'Finance',
    icon: '💰',
    color: 'bg-lime-50 border-lime-200',
    keywords: ['finance', 'money', 'investment', 'banking', 'financial', 'wealth']
  },
  travel: {
    name: 'Travel',
    icon: '✈️',
    color: 'bg-sky-50 border-sky-200',
    keywords: ['travel', 'adventure', 'exploration', 'journey', 'destination', 'tourism']
  },
  food: {
    name: 'Food',
    icon: '🍽️',
    color: 'bg-rose-50 border-rose-200',
    keywords: ['food', 'dining', 'restaurant', 'culinary', 'gastronomy', 'cuisine']
  },
  fashion: {
    name: 'Fashion',
    icon: '👗',
    color: 'bg-fuchsia-50 border-fuchsia-200',
    keywords: ['fashion', 'style', 'clothing', 'apparel', 'trendy', 'designer']
  },
  sports: {
    name: 'Sports',
    icon: '🏃',
    color: 'bg-orange-50 border-orange-200',
    keywords: ['sports', 'athletic', 'fitness', 'competition', 'training', 'athlete', 'sport']
  },
  family: {
    name: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-pink-50 border-pink-200',
    keywords: ['family', 'relationships', 'love', 'connection', 'togetherness']
  },
  abstract: {
    name: 'Abstract',
    icon: '🎭',
    color: 'bg-slate-50 border-slate-200',
    keywords: ['abstract', 'conceptual', 'minimal', 'geometric', 'modern', 'contemporary']
  },
  industrial: {
    name: 'Industrial',
    icon: '🏭',
    color: 'bg-zinc-50 border-zinc-200',
    keywords: ['industrial', 'manufacturing', 'factory', 'production', 'machinery']
  },
  urban: {
    name: 'Urban',
    icon: '🏙️',
    color: 'bg-stone-50 border-stone-200',
    keywords: ['urban', 'city', 'metropolitan', 'architecture', 'skyline', 'downtown']
  },
  rural: {
    name: 'Rural',
    icon: '🌾',
    color: 'bg-green-50 border-green-200',
    keywords: ['rural', 'countryside', 'farm', 'agriculture', 'pastoral', 'village']
  },
  science: {
    name: 'Science',
    icon: '🔬',
    color: 'bg-blue-50 border-blue-200',
    keywords: ['science', 'research', 'laboratory', 'experiment', 'discovery', 'scientific']
  },
  romantic: {
    name: 'Romantic',
    icon: '💖',
    color: 'bg-red-50 border-red-200',
    keywords: ['romantic', 'love', 'couple', 'romance', 'wedding', 'kiss', 'affection', 'valentine', 'sweetheart', 'date']
  },
  running: {
    name: 'Running',
    icon: '🏃',
    color: 'bg-orange-50 border-orange-200',
    keywords: ['running', 'athletic', 'fitness', 'competition', 'training', 'athlete', 'run']
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