/**
 * Font Options for Text Overlays
 * Simple, effective fonts optimized for social media content
 */

export const FONT_OPTIONS = [
  {
    id: 'inter',
    name: 'Inter',
    family: 'Inter, sans-serif',
    weight: '400',
    category: 'Clean'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    weight: '500',
    category: 'Modern'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    weight: '400',
    category: 'Clean'
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    family: 'Open Sans, sans-serif',
    weight: '400',
    category: 'Clean'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    weight: '600',
    category: 'Modern'
  },
  {
    id: 'raleway',
    name: 'Raleway',
    family: 'Raleway, sans-serif',
    weight: '500',
    category: 'Modern'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: 'Playfair Display, serif',
    weight: '400',
    category: 'Elegant'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: 'Merriweather, serif',
    weight: '400',
    category: 'Elegant'
  },
  {
    id: 'oswald',
    name: 'Oswald',
    family: 'Oswald, sans-serif',
    weight: '500',
    category: 'Bold'
  },
  {
    id: 'lato',
    name: 'Lato',
    family: 'Lato, sans-serif',
    weight: '400',
    category: 'Clean'
  },
  {
    id: 'nunito',
    name: 'Nunito',
    family: 'Nunito, sans-serif',
    weight: '600',
    category: 'Modern'
  },
  {
    id: 'quicksand',
    name: 'Quicksand',
    family: 'Quicksand, sans-serif',
    weight: '500',
    category: 'Modern'
  },
  {
    id: 'comfortaa',
    name: 'Comfortaa',
    family: 'Comfortaa, sans-serif',
    weight: '400',
    category: 'Modern'
  },
  {
    id: 'bebas',
    name: 'Bebas Neue',
    family: 'Bebas Neue, sans-serif',
    weight: '400',
    category: 'Bold'
  },
  {
    id: 'anton',
    name: 'Anton',
    family: 'Anton, sans-serif',
    weight: '400',
    category: 'Bold'
  },
  {
    id: 'pacifico',
    name: 'Pacifico',
    family: 'Pacifico, cursive',
    weight: '400',
    category: 'Fun'
  },
  {
    id: 'dancing',
    name: 'Dancing Script',
    family: 'Dancing Script, cursive',
    weight: '600',
    category: 'Fun'
  },
  {
    id: 'caveat',
    name: 'Caveat',
    family: 'Caveat, cursive',
    weight: '600',
    category: 'Fun'
  },
  {
    id: 'indie',
    name: 'Indie Flower',
    family: 'Indie Flower, cursive',
    weight: '400',
    category: 'Fun'
  },
  {
    id: 'permanent',
    name: 'Permanent Marker',
    family: 'Permanent Marker, cursive',
    weight: '400',
    category: 'Fun'
  },
  {
    id: 'blackoutline',
    name: 'Black Outline',
    family: 'Arial Black, sans-serif',
    weight: '900',
    category: 'Bold'
  }
];

// Get font by ID
export const getFontById = (id) => {
  return FONT_OPTIONS.find(font => font.id === id);
};

// Get fonts by category
export const getFontsByCategory = (category) => {
  return FONT_OPTIONS.filter(font => font.category === category);
};

// Get all categories
export const getFontCategories = () => {
  return [...new Set(FONT_OPTIONS.map(font => font.category))];
};

// Color options for text
export const TEXT_COLORS = [
  { id: 'white', name: 'White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)' },
  { id: 'black', name: 'Black', hex: '#000000', rgb: 'rgb(0, 0, 0)' },
  { id: 'red', name: 'Red', hex: '#EF4444', rgb: 'rgb(239, 68, 68)' },
  { id: 'blue', name: 'Blue', hex: '#3B82F6', rgb: 'rgb(59, 130, 246)' },
  { id: 'green', name: 'Green', hex: '#10B981', rgb: 'rgb(16, 185, 129)' },
  { id: 'yellow', name: 'Yellow', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)' },
  { id: 'purple', name: 'Purple', hex: '#8B5CF6', rgb: 'rgb(139, 92, 246)' },
  { id: 'pink', name: 'Pink', hex: '#EC4899', rgb: 'rgb(236, 72, 153)' },
  { id: 'orange', name: 'Orange', hex: '#F97316', rgb: 'rgb(249, 115, 22)' },
  { id: 'gray', name: 'Gray', hex: '#6B7280', rgb: 'rgb(107, 114, 128)' },
  { id: 'gold', name: 'Gold', hex: '#FCD34D', rgb: 'rgb(252, 211, 77)' },
  { id: 'silver', name: 'Silver', hex: '#E5E7EB', rgb: 'rgb(229, 231, 235)' }
]; 