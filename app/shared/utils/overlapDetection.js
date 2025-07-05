/**
 * Utility functions for detecting and handling text overlay overlaps
 */

/**
 * Check if two text overlays overlap (simple bounding box check)
 * @param {Object} a - First text overlay
 * @param {Object} b - Second text overlay
 * @returns {boolean} True if overlapped
 */
export function isOverlapping(a, b) {
  // Assume each text overlay is centered at (x, y) and has width/height in %
  // Default width/height if not set
  const widthA = a.width || 30; // percent
  const heightA = a.height || 8; // percent
  const widthB = b.width || 30;
  const heightB = b.height || 8;
  
  const leftA = a.position.x - widthA / 2;
  const rightA = a.position.x + widthA / 2;
  const topA = a.position.y - heightA / 2;
  const bottomA = a.position.y + heightA / 2;
  
  const leftB = b.position.x - widthB / 2;
  const rightB = b.position.x + widthB / 2;
  const topB = b.position.y - heightB / 2;
  const bottomB = b.position.y + heightB / 2;
  
  return (
    leftA < rightB && rightA > leftB && topA < bottomB && bottomA > topB
  );
}

/**
 * Reposition AI captions to avoid overlaps
 * @param {Array} texts - Array of text overlays
 * @param {number} slideRatio - Slide aspect ratio
 * @param {Function} calculateOptimalPosition - Function to calculate optimal position
 * @returns {Array} Updated texts array
 */
export function repositionAICaptions(texts, slideRatio, calculateOptimalPosition) {
  // Only reposition AI captions that overlap at initial render
  const updated = [...texts];
  
  for (let i = 0; i < updated.length; i++) {
    const t = updated[i];
    if (t.isAI) {
      let hasOverlap = false;
      
      for (let j = 0; j < updated.length; j++) {
        if (i !== j && isOverlapping(t, updated[j])) {
          hasOverlap = true;
          break;
        }
      }
      
      if (hasOverlap) {
        // Try to reposition to a free zone
        const newPos = calculateOptimalPosition(
          updated.filter((_, idx) => idx !== i),
          slideRatio,
          i
        );
        // Update position
        updated[i] = { ...t, position: newPos };
      }
    }
  }
  
  return updated;
} 