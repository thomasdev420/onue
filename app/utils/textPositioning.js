/**
 * Smart text positioning utility to prevent text overlaps
 * 
 * IMPORTANT: AI-generated text is restricted to center and above-center positions only
 * (x = 50, y between 35-65). Users can still manually drag text anywhere, but AI 
 * generation will stay centered to ensure consistent, professional appearance.
 */

import { isOverlapping } from '../shared/utils/overlapDetection.js';

// Define text positioning zones for different slide layouts
// Note: Top zones (y <= 30) are excluded to prevent AI-generated captions from appearing
// in the top 30% of slides, while still allowing manual user positioning
const POSITIONING_ZONES = {
  '9:16': { // Vertical/Portrait - AI text: center and above center only
    zones: [
      { x: 50, y: 40, name: 'center-above-middle' },
      { x: 50, y: 50, name: 'center-middle' },
      { x: 50, y: 60, name: 'center-below-middle' }
    ],
    spacing: 35
  },
  '4:5': { // Portrait/Landscape hybrid - AI text: center and above center only
    zones: [
      { x: 50, y: 45, name: 'center-above-middle' },
      { x: 50, y: 55, name: 'center-middle' },
      { x: 50, y: 65, name: 'center-below-middle' }
    ],
    spacing: 35
  },
  '1:1': { // Square - AI text: center and above center only
    zones: [
      { x: 50, y: 45, name: 'center-above-middle' },
      { x: 50, y: 55, name: 'center-middle' },
      { x: 50, y: 65, name: 'center-below-middle' }
    ],
    spacing: 28
  }
};

/**
 * Check if a position is in the restricted top 30% area
 * @param {Object} position - Position object with x and y coordinates
 * @returns {boolean} True if position is in restricted area
 */
function isInRestrictedTopArea(position) {
  return position.y <= 30;
}

/**
 * Calculate the optimal position for a new text element
 * @param {Array} existingTexts - Array of existing text elements
 * @param {string} slideRatio - Slide aspect ratio (e.g., '9:16', '4:5')
 * @param {number} textIndex - Index of the new text element
 * @returns {Object} Position object with x and y coordinates
 */
export function calculateOptimalPosition(existingTexts, slideRatio, textIndex = 0) {
  const config = POSITIONING_ZONES[slideRatio] || POSITIONING_ZONES['9:16'];
  const zones = config.zones;
  
  // If no existing texts, use the first zone
  if (!existingTexts || existingTexts.length === 0) {
    return zones[0];
  }
  
  // Check each zone to find one that doesn't overlap with existing texts
  for (const zone of zones) {
    let hasOverlap = false;
    
    for (const existingText of existingTexts) {
      if (isOverlapping({ position: zone }, existingText)) {
        hasOverlap = true;
        break;
      }
    }
    
    if (!hasOverlap) {
      return zone;
    }
  }
  
  // If all zones are occupied, create an offset position
  return createOffsetPosition(existingTexts, slideRatio);
}

/**
 * Find the nearest zone to a given position
 * @param {Object} position - Position object with x and y
 * @param {Array} zones - Available zones
 * @returns {Object} Nearest zone
 */
function findNearestZone(position, zones) {
  let nearestZone = zones[0];
  let minDistance = Infinity;
  
  zones.forEach(zone => {
    const distance = Math.sqrt(
      Math.pow(zone.x - position.x, 2) + Math.pow(zone.y - position.y, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = zone;
    }
  });
  
  return nearestZone;
}

/**
 * Find the opposite zone to a given position
 * @param {Object} position - Position object with x and y
 * @param {Array} zones - Available zones
 * @returns {Object} Opposite zone
 */
function findOppositeZone(position, zones) {
  // For vertical slides, prefer top/bottom or left/right opposition
  if (position.y < 50) {
    // If text is in upper half, prefer lower half
    const lowerZones = zones.filter(zone => zone.y > 50);
    return lowerZones.length > 0 ? lowerZones[0] : zones[zones.length - 1];
  } else {
    // If text is in lower half, prefer upper half (but avoid restricted top 30%)
    const upperZones = zones.filter(zone => zone.y > 30 && zone.y < 50);
    return upperZones.length > 0 ? upperZones[0] : zones[0];
  }
}

/**
 * Create an offset position when all zones are occupied
 * @param {Array} existingTexts - Array of existing text elements
 * @param {string} slideRatio - Slide aspect ratio
 * @returns {Object} New position with offset
 */
function createOffsetPosition(existingTexts, slideRatio) {
  const baseX = 50;
  const baseY = 50;
  
  // Calculate average position of existing texts
  const avgX = existingTexts.reduce((sum, text) => sum + text.position.x, 0) / existingTexts.length;
  const avgY = existingTexts.reduce((sum, text) => sum + text.position.y, 0) / existingTexts.length;
  
  // Create offset based on slide ratio, ensuring we avoid the top 30%
  // AI text should stay centered, so offset vertically only
  let offsetX, offsetY;
  
  switch (slideRatio) {
    case '9:16': // Vertical - offset vertically only (stay centered)
      offsetX = 50; // Always center
      offsetY = Math.max(35, avgY > 50 ? 45 : 55); // Alternate between above and below center
      break;
    case '4:5': // Portrait/Landscape hybrid - offset vertically only
      offsetX = 50; // Always center
      offsetY = Math.max(35, avgY > 50 ? 45 : 55); // Alternate between above and below center
      break;
    case '1:1': // Square - offset vertically only
      offsetX = 50; // Always center
      offsetY = Math.max(35, avgY > 50 ? 45 : 55); // Alternate between above and below center
      break;
    default: // Default offset - center only
      offsetX = 50; // Always center
      offsetY = Math.max(35, avgY > 50 ? 45 : 55); // Alternate between above and below center
  }
  
  return { x: offsetX, y: offsetY };
}

/**
 * Apply smart positioning to a slide's text elements
 * @param {Object} slide - Slide object with texts array
 * @returns {Object} Updated slide with repositioned texts
 */
export function applySmartPositioning(slide) {
  if (!slide.texts || slide.texts.length === 0) {
    return slide;
  }

  const updatedTexts = [];
  const slideRatio = slide.ratio || '9:16';
  
  for (let i = 0; i < slide.texts.length; i++) {
    const text = slide.texts[i];
    const optimalPosition = calculateOptimalPosition(updatedTexts, slideRatio, i);
    
    updatedTexts.push({
      ...text,
      position: optimalPosition
    });
  }

  return {
    ...slide,
    texts: updatedTexts
  };
}

/**
 * Add a new text element with smart positioning
 * @param {Object} slide - Current slide
 * @param {string} content - Text content
 * @returns {Object} Updated slide with new text
 */
export function addTextWithSmartPositioning(slide, content = 'New Text') {
  const newText = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    content,
    position: calculateOptimalPosition(slide.texts || [], slide.ratio || '9:16', slide.texts ? slide.texts.length : 0)
  };
  
  const updatedTexts = [...(slide.texts || []), newText];
  
  return {
    ...slide,
    texts: updatedTexts
  };
} 