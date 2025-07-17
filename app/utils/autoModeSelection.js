/**
 * Auto Mode Selection Utility
 * Intelligently selects the optimal model based on prompt analysis
 */

/**
 * Analyze prompt complexity and determine optimal mode
 * @param {string} prompt - User prompt
 * @param {Object} context - Additional context (businessContext, userInfo, etc.)
 * @param {string} service - Service type ('visual', 'category', 'keyword', 'content', 'chat')
 * @returns {string} Optimal mode ('normal' or 'max')
 */
export function selectOptimalMode(prompt, context = {}, service = 'content') {
  try {
    // Get complexity score
    const complexityScore = analyzePromptComplexity(prompt, context);
    
    // Get service-specific requirements
    const serviceRequirements = getServiceRequirements(service);
    
    // Calculate optimal mode
    const optimalMode = calculateOptimalMode(complexityScore, serviceRequirements, context);
    
    return optimalMode;
  } catch (error) {
    console.warn('Auto mode selection failed, falling back to normal:', error);
    return 'normal';
  }
}

/**
 * Analyze prompt complexity
 * @param {string} prompt - User prompt
 * @param {Object} context - Additional context
 * @returns {Object} Complexity analysis
 */
function analyzePromptComplexity(prompt, context = {}) {
  const analysis = {
    length: prompt.length,
    wordCount: prompt.split(/\s+/).length,
    hasComplexKeywords: detectComplexKeywords(prompt),
    hasTechnicalTerms: detectTechnicalTerms(prompt),
    hasVisualElements: detectVisualElements(prompt),
    hasSpecificEntities: detectSpecificEntities(prompt),
    businessContext: context.businessContext ? 1 : 0,
    complexityScore: 0
  };
  
  // Calculate complexity score (0-100)
  analysis.complexityScore = calculateComplexityScore(analysis);
  
  return analysis;
}

/**
 * Detect complex keywords that suggest sophisticated content
 * @param {string} prompt - User prompt
 * @returns {boolean} Whether prompt contains complex keywords
 */
function detectComplexKeywords(prompt) {
  const complexKeywords = [
    'strategy', 'analysis', 'research', 'comprehensive', 'detailed',
    'sophisticated', 'advanced', 'complex', 'nuanced', 'strategic',
    'optimization', 'automation', 'integration', 'implementation',
    'framework', 'methodology', 'approach', 'perspective', 'insight',
    'trend', 'pattern', 'correlation', 'causation', 'hypothesis',
    'theoretical', 'practical', 'empirical', 'analytical', 'critical'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  return complexKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Detect technical terms that suggest complex content
 * @param {string} prompt - User prompt
 * @returns {boolean} Whether prompt contains technical terms
 */
function detectTechnicalTerms(prompt) {
  const technicalTerms = [
    'api', 'algorithm', 'database', 'framework', 'architecture',
    'protocol', 'interface', 'system', 'platform', 'infrastructure',
    'deployment', 'scalability', 'performance', 'optimization',
    'machine learning', 'ai', 'artificial intelligence', 'data science',
    'analytics', 'metrics', 'kpi', 'roi', 'conversion', 'funnel',
    'automation', 'workflow', 'process', 'methodology', 'strategy'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  return technicalTerms.some(term => lowerPrompt.includes(term));
}

/**
 * Detect visual elements that suggest image-heavy content
 * @param {string} prompt - User prompt
 * @returns {boolean} Whether prompt suggests visual content
 */
function detectVisualElements(prompt) {
  const visualKeywords = [
    'image', 'photo', 'picture', 'visual', 'graphic', 'design',
    'layout', 'style', 'aesthetic', 'branding', 'logo', 'icon',
    'color', 'typography', 'illustration', 'animation', 'video',
    'presentation', 'slide', 'deck', 'infographic', 'chart',
    'diagram', 'mockup', 'prototype', 'wireframe', 'template'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  return visualKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Detect specific entities (people, companies, places)
 * @param {string} prompt - User prompt
 * @returns {boolean} Whether prompt contains specific entities
 */
function detectSpecificEntities(prompt) {
  // Check for proper nouns (capitalized words)
  const words = prompt.split(/\s+/);
  const properNouns = words.filter(word => 
    word.length > 2 && 
    word[0] === word[0].toUpperCase() && 
    !['The', 'And', 'For', 'With', 'From', 'About', 'This', 'That'].includes(word)
  );
  
  return properNouns.length >= 2;
}

/**
 * Calculate complexity score based on analysis
 * @param {Object} analysis - Complexity analysis
 * @returns {number} Complexity score (0-100)
 */
function calculateComplexityScore(analysis) {
  let score = 0;
  
  // Length factor (0-20 points)
  if (analysis.length > 200) score += 20;
  else if (analysis.length > 100) score += 15;
  else if (analysis.length > 50) score += 10;
  else score += 5;
  
  // Word count factor (0-15 points)
  if (analysis.wordCount > 30) score += 15;
  else if (analysis.wordCount > 20) score += 10;
  else if (analysis.wordCount > 10) score += 5;
  
  // Complex keywords (0-20 points)
  if (analysis.hasComplexKeywords) score += 20;
  
  // Technical terms (0-20 points)
  if (analysis.hasTechnicalTerms) score += 20;
  
  // Visual elements (0-10 points)
  if (analysis.hasVisualElements) score += 10;
  
  // Specific entities (0-10 points)
  if (analysis.hasSpecificEntities) score += 10;
  
  // Business context (0-5 points)
  score += analysis.businessContext * 5;
  
  return Math.min(score, 100);
}

/**
 * Get service-specific requirements
 * @param {string} service - Service type
 * @returns {Object} Service requirements
 */
function getServiceRequirements(service) {
  const requirements = {
    visual: {
      normalThreshold: 40, // Visual analysis benefits more from MAX mode
      maxThreshold: 70
    },
    category: {
      normalThreshold: 50,
      maxThreshold: 80
    },
    keyword: {
      normalThreshold: 50,
      maxThreshold: 80
    },
    content: {
      normalThreshold: 60,
      maxThreshold: 85
    },
    chat: {
      normalThreshold: 70,
      maxThreshold: 90
    }
  };
  
  return requirements[service] || requirements.content;
}

/**
 * Calculate optimal mode based on complexity and service requirements
 * @param {number} complexityScore - Complexity score (0-100)
 * @param {Object} serviceRequirements - Service-specific requirements
 * @param {Object} context - Additional context
 * @returns {string} Optimal mode ('normal' or 'max')
 */
function calculateOptimalMode(complexityScore, serviceRequirements, context = {}) {
  // Check for user preferences or overrides
  if (context.forceMode) {
    return context.forceMode;
  }
  
  // Check for business context that might require higher quality
  if (context.businessContext?.businessType === 'premium' || 
      context.businessContext?.businessType === 'luxury') {
    return 'max';
  }
  
  // Use service-specific thresholds
  if (complexityScore >= serviceRequirements.maxThreshold) {
    return 'max';
  } else if (complexityScore >= serviceRequirements.normalThreshold) {
    return 'max';
  } else {
    return 'normal';
  }
}

/**
 * Get mode explanation for transparency
 * @param {string} prompt - User prompt
 * @param {string} selectedMode - Selected mode
 * @param {Object} analysis - Complexity analysis
 * @param {string} service - Service type
 * @returns {string} Explanation of why this mode was chosen
 */
export function getModeExplanation(prompt, selectedMode, analysis, service) {
  const explanations = {
    normal: {
      visual: 'Simple visual analysis - using faster model for quick image selection',
      category: 'Basic categorization - using efficient model for category detection',
      keyword: 'Standard keyword extraction - using balanced model for keyword analysis',
      content: 'Straightforward content - using faster model for quick generation',
      chat: 'Simple conversation - using efficient model for chat responses'
    },
    max: {
      visual: 'Complex visual analysis - using premium model for detailed image understanding',
      category: 'Sophisticated categorization - using advanced model for nuanced category detection',
      keyword: 'Complex keyword extraction - using premium model for precise keyword analysis',
      content: 'Complex content generation - using advanced model for high-quality output',
      chat: 'Sophisticated conversation - using premium model for detailed responses'
    }
  };
  
  const baseExplanation = explanations[selectedMode][service] || explanations[selectedMode].content;
  
  // Add specific reasons
  const reasons = [];
  if (analysis.hasComplexKeywords) reasons.push('complex keywords detected');
  if (analysis.hasTechnicalTerms) reasons.push('technical terms found');
  if (analysis.hasVisualElements) reasons.push('visual elements present');
  if (analysis.hasSpecificEntities) reasons.push('specific entities identified');
  if (analysis.length > 100) reasons.push('long prompt');
  
  if (reasons.length > 0) {
    return `${baseExplanation} (${reasons.join(', ')})`;
  }
  
  return baseExplanation;
} 