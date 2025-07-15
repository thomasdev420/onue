/**
 * AI Clarification System
 * 
 * Detects vague, ambiguous, or underspecified prompts and generates
 * targeted clarifying questions to gather more context before responding.
 */

// Types of ambiguity that require clarification
export const AMBIGUITY_TYPES = {
  VAGUE_TOPIC: 'vague_topic',
  MISSING_CONTEXT: 'missing_context',
  UNCLEAR_INTENT: 'unclear_intent',
  BROAD_REQUEST: 'broad_request',
  MISSING_DETAILS: 'missing_details',
  MULTIPLE_INTERPRETATIONS: 'multiple_interpretations',
  MISSING_TARGET_AUDIENCE: 'missing_target_audience',
  MISSING_GOAL: 'missing_goal',
  MISSING_STYLE: 'missing_style',
  MISSING_PLATFORM: 'missing_platform'
};

// Patterns that indicate vague or ambiguous prompts
export const VAGUE_PATTERNS = [
  // Only extremely vague requests that are impossible to work with
  {
    pattern: /^(create|make|generate|build)\s+(something|stuff|things?)$/i,
    type: AMBIGUITY_TYPES.BROAD_REQUEST,
    severity: 'high'
  },
  {
    pattern: /^(help|assist|support)\s+(me|us)$/i,
    type: AMBIGUITY_TYPES.UNCLEAR_INTENT,
    severity: 'high'
  },
  // Only very short prompts that are clearly incomplete
  {
    pattern: /^.{1,5}$/,
    type: AMBIGUITY_TYPES.MISSING_CONTEXT,
    severity: 'high'
  }
];

// Context-specific clarification questions
export const CLARIFICATION_QUESTIONS = {
  [AMBIGUITY_TYPES.VAGUE_TOPIC]: [
    "What would you like help with?"
  ],
  
  [AMBIGUITY_TYPES.MISSING_CONTEXT]: [
    "What are you working on?"
  ],
  
  [AMBIGUITY_TYPES.UNCLEAR_INTENT]: [
    "What do you need help with?"
  ],
  
  [AMBIGUITY_TYPES.BROAD_REQUEST]: [
    "What type of content do you want?"
  ],
  
  [AMBIGUITY_TYPES.MISSING_DETAILS]: [
    "What's your topic?"
  ],
  
  [AMBIGUITY_TYPES.MISSING_TARGET_AUDIENCE]: [
    "Who's your audience?"
  ],
  
  [AMBIGUITY_TYPES.MISSING_GOAL]: [
    "What's your goal?"
  ],
  
  [AMBIGUITY_TYPES.MISSING_STYLE]: [
    "What style do you prefer?"
  ],
  
  [AMBIGUITY_TYPES.MISSING_PLATFORM]: [
    "Which platform?"
  ],
  
  [AMBIGUITY_TYPES.MULTIPLE_INTERPRETATIONS]: [
    "Can you clarify?"
  ]
};

/**
 * Analyze a prompt for vagueness and ambiguity
 * @param {string} prompt - The user's prompt
 * @param {Object} context - Current conversation context
 * @returns {Object} Analysis result
 */
export function analyzePromptClarity(prompt, context = {}) {
  if (!prompt || typeof prompt !== 'string') {
    return {
      needsClarification: false,
      reasons: [],
      suggestions: []
    };
  }

  const trimmedPrompt = prompt.trim();
  const reasons = [];
  const suggestions = [];
  let overallSeverity = 'low';

  // Check against vague patterns
  VAGUE_PATTERNS.forEach(({ pattern, type, severity, extract }) => {
    const match = trimmedPrompt.match(pattern);
    if (match) {
      reasons.push({
        type,
        severity,
        pattern: pattern.toString(),
        extracted: extract ? extract(match) : null
      });
      
      if (severity === 'high') {
        overallSeverity = 'high';
      } else if (severity === 'medium' && overallSeverity !== 'high') {
        overallSeverity = 'medium';
      }
    }
  });

  // Additional context-based checks
  if (context.businessContext) {
    // Check if prompt lacks business context when available
    const businessTerms = [
      context.businessContext.companyName,
      context.businessContext.businessType,
      context.businessContext.productInfo
    ].filter(Boolean);

    if (businessTerms.length > 0 && !businessTerms.some(term => 
      trimmedPrompt.toLowerCase().includes(term.toLowerCase())
    )) {
      reasons.push({
        type: AMBIGUITY_TYPES.MISSING_CONTEXT,
        severity: 'medium',
        pattern: 'missing_business_context',
        extracted: 'business context available but not referenced'
      });
    }
  }

  // Only check for extremely short prompts
  if (trimmedPrompt.length < 5) {
    reasons.push({
      type: AMBIGUITY_TYPES.MISSING_CONTEXT,
      severity: 'high',
      pattern: 'short_prompt',
      extracted: `prompt length: ${trimmedPrompt.length} characters`
    });
  }

  // Check for question marks (might indicate user is asking for clarification)
  if (trimmedPrompt.includes('?')) {
    reasons.push({
      type: AMBIGUITY_TYPES.UNCLEAR_INTENT,
      severity: 'medium',
      pattern: 'question_prompt',
      extracted: 'user appears to be asking a question'
    });
  }

  // Generate suggestions based on reasons
  reasons.forEach(reason => {
    const questions = CLARIFICATION_QUESTIONS[reason.type] || [];
    suggestions.push(...questions);
  });

  // Remove duplicates and limit suggestions
  const uniqueSuggestions = [...new Set(suggestions)].slice(0, 3);

  return {
    needsClarification: reasons.length > 0,
    reasons,
    suggestions: uniqueSuggestions,
    severity: overallSeverity,
    promptLength: trimmedPrompt.length
  };
}

/**
 * Generate a clarification response
 * @param {Object} analysis - Result from analyzePromptClarity
 * @param {string} originalPrompt - The original user prompt
 * @param {Object} context - Current conversation context
 * @returns {string} Clarification response
 */
export function generateClarificationResponse(analysis, originalPrompt, context = {}) {
  if (!analysis.needsClarification) {
    return null;
  }

  const { suggestions } = analysis;
  let response = '';

  // Add a conversational clarification follow-up if needed
  if (suggestions.length > 0) {
    // Pick the most relevant suggestion and rephrase for a conversational flow
    let followUp = suggestions[0];
    // Light rephrasing for natural tone
    if (followUp.endsWith('?')) {
      followUp = followUp;
    } else {
      followUp = followUp.charAt(0).toUpperCase() + followUp.slice(1) + '?';
    }
    // If we already answered part of the prompt, add the follow-up naturally
    if (response) {
      response += ' ' + followUp;
    } else {
      // Otherwise, just ask the follow-up in a friendly way
      response = followUp;
    }
  }

  // If for some reason nothing was generated, fall back to a gentle nudge
  if (!response) {
    response = "Could you tell me a bit more so I can help you better?";
  }

  return response;
}

/**
 * Check if a response is a clarification request
 * @param {string} response - AI response to check
 * @returns {boolean} True if response is asking for clarification
 */
export function isClarificationResponse(response) {
  if (!response || typeof response !== 'string') {
    return false;
  }

  const clarificationIndicators = [
    /could you (help me understand|clarify|provide more details)/i,
    /i need (more information|additional details|to understand)/i,
    /to give you the most (relevant|helpful|accurate)/i,
    /could you tell me more about/i,
    /what specific/i,
    /which platform/i,
    /who is your target audience/i,
    /what's your main goal/i,
    /what type of content/i
  ];

  return clarificationIndicators.some(indicator => indicator.test(response));
}

/**
 * Extract key information from a clarified response
 * @param {string} clarifiedResponse - User's response to clarification
 * @param {Object} originalAnalysis - Original analysis that triggered clarification
 * @returns {Object} Extracted information
 */
export function extractClarifiedInformation(clarifiedResponse, originalAnalysis) {
  const extracted = {
    topic: null,
    goal: null,
    audience: null,
    platform: null,
    style: null,
    format: null
  };

  if (!clarifiedResponse) {
    return extracted;
  }

  const response = clarifiedResponse.toLowerCase();

  // Extract topic
  const topicPatterns = [
    /(?:about|on|regarding)\s+([^.!?]+)/i,
    /(?:topic|subject|focus)\s+(?:is|on)\s+([^.!?]+)/i
  ];

  topicPatterns.forEach(pattern => {
    const match = clarifiedResponse.match(pattern);
    if (match && !extracted.topic) {
      extracted.topic = match[1].trim();
    }
  });

  // Extract goal
  const goalPatterns = [
    /(?:goal|objective|aim)\s+(?:is|to)\s+([^.!?]+)/i,
    /(?:want|need)\s+to\s+([^.!?]+)/i
  ];

  goalPatterns.forEach(pattern => {
    const match = clarifiedResponse.match(pattern);
    if (match && !extracted.goal) {
      extracted.goal = match[1].trim();
    }
  });

  // Extract audience
  const audiencePatterns = [
    /(?:audience|target|for)\s+(?:is|are)\s+([^.!?]+)/i,
    /(?:targeting|reaching)\s+([^.!?]+)/i
  ];

  audiencePatterns.forEach(pattern => {
    const match = clarifiedResponse.match(pattern);
    if (match && !extracted.audience) {
      extracted.audience = match[1].trim();
    }
  });

  // Extract platform
  const platforms = ['tiktok', 'instagram', 'linkedin', 'facebook', 'twitter', 'youtube'];
  platforms.forEach(platform => {
    if (response.includes(platform) && !extracted.platform) {
      extracted.platform = platform;
    }
  });

  // Extract style
  const styles = ['professional', 'casual', 'funny', 'serious', 'inspirational', 'educational'];
  styles.forEach(style => {
    if (response.includes(style) && !extracted.style) {
      extracted.style = style;
    }
  });

  // Extract format
  const formats = ['slides', 'video', 'post', 'content', 'campaign'];
  formats.forEach(format => {
    if (response.includes(format) && !extracted.format) {
      extracted.format = format;
    }
  });

  return extracted;
}

/**
 * Build an enhanced prompt from clarified information
 * @param {string} originalPrompt - Original vague prompt
 * @param {Object} clarifiedInfo - Information from clarification response
 * @param {Object} context - Current conversation context
 * @returns {string} Enhanced prompt
 */
export function buildEnhancedPrompt(originalPrompt, clarifiedInfo, context = {}) {
  let enhanced = originalPrompt;

  // Add extracted information to the prompt
  const additions = [];

  if (clarifiedInfo.topic) {
    additions.push(`Topic: ${clarifiedInfo.topic}`);
  }
  if (clarifiedInfo.goal) {
    additions.push(`Goal: ${clarifiedInfo.goal}`);
  }
  if (clarifiedInfo.audience) {
    additions.push(`Target audience: ${clarifiedInfo.audience}`);
  }
  if (clarifiedInfo.platform) {
    additions.push(`Platform: ${clarifiedInfo.platform}`);
  }
  if (clarifiedInfo.style) {
    additions.push(`Style: ${clarifiedInfo.style}`);
  }
  if (clarifiedInfo.format) {
    additions.push(`Format: ${clarifiedInfo.format}`);
  }

  if (additions.length > 0) {
    enhanced += `\n\nAdditional context: ${additions.join(', ')}`;
  }

  return enhanced;
}

const clarificationSystem = {
  AMBIGUITY_TYPES,
  VAGUE_PATTERNS,
  CLARIFICATION_QUESTIONS,
  analyzePromptClarity,
  generateClarificationResponse,
  isClarificationResponse,
  extractClarifiedInformation,
  buildEnhancedPrompt
};

export default clarificationSystem; 