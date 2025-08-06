/**
 * Color Background Library - 100 different colored backgrounds organized by color families
 * Similar to stock photos, organized for easy browsing and selection
 */

export const COLOR_FAMILIES = {
  reds: {
    name: 'Reds',
    colors: [
      { id: 'red-1', name: 'Crimson Red', hex: '#DC2626', rgb: 'rgb(220, 38, 38)' },
      { id: 'red-2', name: 'Fire Engine Red', hex: '#EF4444', rgb: 'rgb(239, 68, 68)' },
      { id: 'red-3', name: 'Rose Red', hex: '#F87171', rgb: 'rgb(248, 113, 113)' },
      { id: 'red-4', name: 'Light Red', hex: '#FCA5A5', rgb: 'rgb(252, 165, 165)' },
      { id: 'red-5', name: 'Pale Red', hex: '#FECACA', rgb: 'rgb(254, 202, 202)' },
      { id: 'red-6', name: 'Burgundy', hex: '#991B1B', rgb: 'rgb(153, 27, 27)' },
      { id: 'red-7', name: 'Maroon', hex: '#7F1D1D', rgb: 'rgb(127, 29, 29)' },
      { id: 'red-8', name: 'Coral Red', hex: '#F97316', rgb: 'rgb(249, 115, 22)' },
      { id: 'red-9', name: 'Salmon Red', hex: '#FB7185', rgb: 'rgb(251, 113, 133)' },
      { id: 'red-10', name: 'Ruby Red', hex: '#BE123C', rgb: 'rgb(190, 18, 60)' }
    ]
  },
  oranges: {
    name: 'Oranges',
    colors: [
      { id: 'orange-1', name: 'Vibrant Orange', hex: '#EA580C', rgb: 'rgb(234, 88, 12)' },
      { id: 'orange-2', name: 'Sunset Orange', hex: '#F97316', rgb: 'rgb(249, 115, 22)' },
      { id: 'orange-3', name: 'Peach Orange', hex: '#FB923C', rgb: 'rgb(251, 146, 60)' },
      { id: 'orange-4', name: 'Light Orange', hex: '#FDBA74', rgb: 'rgb(253, 186, 116)' },
      { id: 'orange-5', name: 'Pale Orange', hex: '#FED7AA', rgb: 'rgb(254, 215, 170)' },
      { id: 'orange-6', name: 'Amber', hex: '#D97706', rgb: 'rgb(217, 119, 6)' },
      { id: 'orange-7', name: 'Golden Orange', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)' },
      { id: 'orange-8', name: 'Tangerine', hex: '#F97316', rgb: 'rgb(249, 115, 22)' },
      { id: 'orange-9', name: 'Apricot', hex: '#FB923C', rgb: 'rgb(251, 146, 60)' },
      { id: 'orange-10', name: 'Cantaloupe', hex: '#FDBA74', rgb: 'rgb(253, 186, 116)' }
    ]
  },
  yellows: {
    name: 'Yellows',
    colors: [
      { id: 'yellow-1', name: 'Golden Yellow', hex: '#EAB308', rgb: 'rgb(234, 179, 8)' },
      { id: 'yellow-2', name: 'Sunny Yellow', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)' },
      { id: 'yellow-3', name: 'Lemon Yellow', hex: '#FCD34D', rgb: 'rgb(252, 211, 77)' },
      { id: 'yellow-4', name: 'Light Yellow', hex: '#FDE68A', rgb: 'rgb(253, 230, 138)' },
      { id: 'yellow-5', name: 'Pale Yellow', hex: '#FEF3C7', rgb: 'rgb(254, 243, 199)' },
      { id: 'yellow-6', name: 'Mustard', hex: '#D97706', rgb: 'rgb(217, 119, 6)' },
      { id: 'yellow-7', name: 'Honey', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)' },
      { id: 'yellow-8', name: 'Butter', hex: '#FCD34D', rgb: 'rgb(252, 211, 77)' },
      { id: 'yellow-9', name: 'Cream', hex: '#FDE68A', rgb: 'rgb(253, 230, 138)' },
      { id: 'yellow-10', name: 'Ivory', hex: '#FEF3C7', rgb: 'rgb(254, 243, 199)' }
    ]
  },
  greens: {
    name: 'Greens',
    colors: [
      { id: 'green-1', name: 'Emerald Green', hex: '#059669', rgb: 'rgb(5, 150, 105)' },
      { id: 'green-2', name: 'Forest Green', hex: '#16A34A', rgb: 'rgb(22, 163, 74)' },
      { id: 'green-3', name: 'Lime Green', hex: '#22C55E', rgb: 'rgb(34, 197, 94)' },
      { id: 'green-4', name: 'Light Green', hex: '#4ADE80', rgb: 'rgb(74, 222, 128)' },
      { id: 'green-5', name: 'Pale Green', hex: '#86EFAC', rgb: 'rgb(134, 239, 172)' },
      { id: 'green-6', name: 'Sage', hex: '#15803D', rgb: 'rgb(21, 128, 61)' },
      { id: 'green-7', name: 'Mint', hex: '#16A34A', rgb: 'rgb(22, 163, 74)' },
      { id: 'green-8', name: 'Olive', hex: '#65A30D', rgb: 'rgb(101, 163, 13)' },
      { id: 'green-9', name: 'Teal', hex: '#0D9488', rgb: 'rgb(13, 148, 136)' },
      { id: 'green-10', name: 'Seafoam', hex: '#14B8A6', rgb: 'rgb(20, 184, 166)' }
    ]
  },
  blues: {
    name: 'Blues',
    colors: [
      { id: 'blue-1', name: 'Royal Blue', hex: '#2563EB', rgb: 'rgb(37, 99, 235)' },
      { id: 'blue-2', name: 'Sky Blue', hex: '#3B82F6', rgb: 'rgb(59, 130, 246)' },
      { id: 'blue-3', name: 'Ocean Blue', hex: '#60A5FA', rgb: 'rgb(96, 165, 250)' },
      { id: 'blue-4', name: 'Light Blue', hex: '#93C5FD', rgb: 'rgb(147, 197, 253)' },
      { id: 'blue-5', name: 'Pale Blue', hex: '#BFDBFE', rgb: 'rgb(191, 219, 254)' },
      { id: 'blue-6', name: 'Navy', hex: '#1E3A8A', rgb: 'rgb(30, 58, 138)' },
      { id: 'blue-7', name: 'Indigo', hex: '#4338CA', rgb: 'rgb(67, 56, 202)' },
      { id: 'blue-8', name: 'Periwinkle', hex: '#6366F1', rgb: 'rgb(99, 102, 241)' },
      { id: 'blue-9', name: 'Cyan', hex: '#06B6D4', rgb: 'rgb(6, 182, 212)' },
      { id: 'blue-10', name: 'Turquoise', hex: '#0891B2', rgb: 'rgb(8, 145, 178)' }
    ]
  },
  purples: {
    name: 'Purples',
    colors: [
      { id: 'purple-1', name: 'Royal Purple', hex: '#7C3AED', rgb: 'rgb(124, 58, 237)' },
      { id: 'purple-2', name: 'Violet', hex: '#8B5CF6', rgb: 'rgb(139, 92, 246)' },
      { id: 'purple-3', name: 'Lavender', hex: '#A78BFA', rgb: 'rgb(167, 139, 250)' },
      { id: 'purple-4', name: 'Light Purple', hex: '#C4B5FD', rgb: 'rgb(196, 181, 253)' },
      { id: 'purple-5', name: 'Pale Purple', hex: '#DDD6FE', rgb: 'rgb(221, 214, 254)' },
      { id: 'purple-6', name: 'Plum', hex: '#581C87', rgb: 'rgb(88, 28, 135)' },
      { id: 'purple-7', name: 'Magenta', hex: '#BE185D', rgb: 'rgb(190, 24, 93)' },
      { id: 'purple-8', name: 'Fuchsia', hex: '#D946EF', rgb: 'rgb(217, 70, 239)' },
      { id: 'purple-9', name: 'Orchid', hex: '#EC4899', rgb: 'rgb(236, 72, 153)' },
      { id: 'purple-10', name: 'Rose', hex: '#F472B6', rgb: 'rgb(244, 114, 182)' }
    ]
  },
  pinks: {
    name: 'Pinks',
    colors: [
      { id: 'pink-1', name: 'Hot Pink', hex: '#EC4899', rgb: 'rgb(236, 72, 153)' },
      { id: 'pink-2', name: 'Rose Pink', hex: '#F472B6', rgb: 'rgb(244, 114, 182)' },
      { id: 'pink-3', name: 'Light Pink', hex: '#F9A8D4', rgb: 'rgb(249, 168, 212)' },
      { id: 'pink-4', name: 'Pale Pink', hex: '#FBCFE8', rgb: 'rgb(251, 207, 232)' },
      { id: 'pink-5', name: 'Blush', hex: '#FDF2F8', rgb: 'rgb(253, 242, 248)' },
      { id: 'pink-6', name: 'Coral Pink', hex: '#FB7185', rgb: 'rgb(251, 113, 133)' },
      { id: 'pink-7', name: 'Salmon Pink', hex: '#FDA4AF', rgb: 'rgb(253, 164, 175)' },
      { id: 'pink-8', name: 'Peach', hex: '#FED7AA', rgb: 'rgb(254, 215, 170)' },
      { id: 'pink-9', name: 'Dusty Rose', hex: '#E5B8F7', rgb: 'rgb(229, 184, 247)' },
      { id: 'pink-10', name: 'Mauve', hex: '#C4B5FD', rgb: 'rgb(196, 181, 253)' }
    ]
  },
  grays: {
    name: 'Grays',
    colors: [
      { id: 'gray-1', name: 'Charcoal', hex: '#111827', rgb: 'rgb(17, 24, 39)' },
      { id: 'gray-2', name: 'Dark Gray', hex: '#374151', rgb: 'rgb(55, 65, 81)' },
      { id: 'gray-3', name: 'Medium Gray', hex: '#6B7280', rgb: 'rgb(107, 114, 128)' },
      { id: 'gray-4', name: 'Light Gray', hex: '#9CA3AF', rgb: 'rgb(156, 163, 175)' },
      { id: 'gray-5', name: 'Pale Gray', hex: '#D1D5DB', rgb: 'rgb(209, 213, 219)' },
      { id: 'gray-6', name: 'Silver', hex: '#E5E7EB', rgb: 'rgb(229, 231, 235)' },
      { id: 'gray-7', name: 'Platinum', hex: '#F3F4F6', rgb: 'rgb(243, 244, 246)' },
      { id: 'gray-8', name: 'Pearl', hex: '#F9FAFB', rgb: 'rgb(249, 250, 251)' },
      { id: 'gray-9', name: 'Warm Gray', hex: '#78716C', rgb: 'rgb(120, 113, 108)' },
      { id: 'gray-10', name: 'Cool Gray', hex: '#6B7280', rgb: 'rgb(107, 114, 128)' }
    ]
  },
  neutrals: {
    name: 'Neutrals',
    colors: [
      { id: 'neutral-1', name: 'Pure White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)' },
      { id: 'neutral-2', name: 'Off White', hex: '#FAFAFA', rgb: 'rgb(250, 250, 250)' },
      { id: 'neutral-3', name: 'Cream', hex: '#FEF3C7', rgb: 'rgb(254, 243, 199)' },
      { id: 'neutral-4', name: 'Beige', hex: '#F5F5DC', rgb: 'rgb(245, 245, 220)' },
      { id: 'neutral-5', name: 'Ivory', hex: '#FFFFF0', rgb: 'rgb(255, 255, 240)' },
      { id: 'neutral-6', name: 'Pure Black', hex: '#000000', rgb: 'rgb(0, 0, 0)' },
      { id: 'neutral-7', name: 'Rich Black', hex: '#0A0A0A', rgb: 'rgb(10, 10, 10)' },
      { id: 'neutral-8', name: 'Warm Black', hex: '#1A1A1A', rgb: 'rgb(26, 26, 26)' },
      { id: 'neutral-9', name: 'Cool Black', hex: '#171717', rgb: 'rgb(23, 23, 23)' },
      { id: 'neutral-10', name: 'Charcoal', hex: '#111827', rgb: 'rgb(17, 24, 39)' }
    ]
  }
};

// Flatten all colors for easy access
export const ALL_COLORS = Object.values(COLOR_FAMILIES).flatMap(family => family.colors);

// Get color by ID
export const getColorById = (id) => {
  return ALL_COLORS.find(color => color.id === id);
};

// Get colors by family
export const getColorsByFamily = (familyName) => {
  return COLOR_FAMILIES[familyName]?.colors || [];
};

// Get all family names
export const getFamilyNames = () => {
  return Object.keys(COLOR_FAMILIES);
}; 