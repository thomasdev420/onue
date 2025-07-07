/**
 * Context Priority Rules for User Intent Recognition
 * 
 * This utility defines the priority order for interpreting user context and intent.
 * The system must always prioritize explicit user input over metadata or inferred information.
 */

/**
 * Priority levels for user context interpretation (highest to lowest)
 */
export const CONTEXT_PRIORITY_LEVELS = {
  // Level 1: Explicit user input (highest priority)
  EXPLICIT_INPUT: 1,
  
  // Level 2: Questionnaire responses and personalization answers
  QUESTIONNAIRE_RESPONSES: 2,
  
  // Level 3: Website scanning and business context extraction
  BUSINESS_CONTEXT: 3,
  
  // Level 4: User profile metadata (lowest priority)
  METADATA: 4
};

/**
 * Context sources and their priority levels
 */
export const CONTEXT_SOURCES = {
  // Explicit user input (highest priority)
  'user_prompt': CONTEXT_PRIORITY_LEVELS.EXPLICIT_INPUT,
  'direct_question': CONTEXT_PRIORITY_LEVELS.EXPLICIT_INPUT,
  'user_request': CONTEXT_PRIORITY_LEVELS.EXPLICIT_INPUT,
  
  // Questionnaire and personalization responses
  'personalization.interests': CONTEXT_PRIORITY_LEVELS.QUESTIONNAIRE_RESPONSES,
  'personalization.goals': CONTEXT_PRIORITY_LEVELS.QUESTIONNAIRE_RESPONSES,
  'personalization.role': CONTEXT_PRIORITY_LEVELS.QUESTIONNAIRE_RESPONSES,
  'personalization.experienceLevel': CONTEXT_PRIORITY_LEVELS.QUESTIONNAIRE_RESPONSES,
  'personalization.timeCommitment': CONTEXT_PRIORITY_LEVELS.QUESTIONNAIRE_RESPONSES,
  'personalization.targetAudience': CONTEXT_PRIORITY_LEVELS.QUESTIONNAIRE_RESPONSES,
  
  // Business context from website scanning
  'businessContext.companyName': CONTEXT_PRIORITY_LEVELS.BUSINESS_CONTEXT,
  'businessContext.businessType': CONTEXT_PRIORITY_LEVELS.BUSINESS_CONTEXT,
  'businessContext.productInfo': CONTEXT_PRIORITY_LEVELS.BUSINESS_CONTEXT,
  'businessContext.websiteUrl': CONTEXT_PRIORITY_LEVELS.BUSINESS_CONTEXT,
  
  // Metadata (lowest priority)
  'userInfo.email': CONTEXT_PRIORITY_LEVELS.METADATA,
  'userInfo.name': CONTEXT_PRIORITY_LEVELS.METADATA,
  'userInfo.username': CONTEXT_PRIORITY_LEVELS.METADATA
};

/**
 * Examples of correct context interpretation
 */
export const CONTEXT_EXAMPLES = {
  CORRECT: [
    {
      scenario: "User states 'I run an IT company' in questionnaire, but email contains 'cycling'",
      correct_interpretation: "Recognize they run an IT business",
      incorrect_interpretation: "Assume they are a cyclist",
      reason: "Explicit questionnaire response overrides email metadata"
    },
    {
      scenario: "User asks for 'marketing tips for my restaurant' but their role is 'developer'",
      correct_interpretation: "Provide restaurant marketing tips",
      incorrect_interpretation: "Provide developer-focused content",
      reason: "Explicit request overrides role information"
    },
    {
      scenario: "User selects 'fitness' as interest but asks for 'business advice'",
      correct_interpretation: "Provide business advice with fitness context if relevant",
      incorrect_interpretation: "Only provide fitness content",
      reason: "Explicit request is primary, interests provide context"
    }
  ],
  
  INCORRECT: [
    {
      scenario: "User asks for 'dog training tips' but email is 'tech@company.com'",
      incorrect_interpretation: "Provide tech-related content instead",
      correct_interpretation: "Provide dog training tips",
      reason: "Email metadata should never override explicit requests"
    }
  ]
};

/**
 * Build context-aware system prompt with proper priority
 * @param {Object} context - User context object
 * @param {string} userPrompt - The user's explicit request
 * @returns {string} Formatted system prompt
 */
export function buildContextAwarePrompt(context, userPrompt) {
  let systemPrompt = `You are Swiftreel, a helpful AI assistant for content creation.`;

  // Add explicit instruction about priority
  systemPrompt += `\n\nCRITICAL CONTEXT PRIORITY RULES:
- The user's explicit request/prompt is ALWAYS the most important instruction
- Questionnaire responses and personalization answers are second priority
- Business context from website scanning is third priority  
- User metadata (email, username) is lowest priority and should never override explicit input
- If user asks for "dogs", create content about dogs regardless of their business type
- If user states "I run an IT company" in questionnaire, recognize they run an IT business even if their email contains unrelated words`;

  // Add business context (third priority)
  if (context.businessContext) {
    systemPrompt += `\n\nBusiness Context:`;
    const bc = context.businessContext;
    
    if (bc.companyName) {
      systemPrompt += `\n- Company: ${bc.companyName}`;
    }
    if (bc.businessType) {
      systemPrompt += `\n- Business Type: ${bc.businessType}`;
    }
    if (bc.productInfo) {
      systemPrompt += `\n- Product/Service: ${bc.productInfo}`;
    }
    if (bc.websiteUrl) {
      systemPrompt += `\n- Website: ${bc.websiteUrl}`;
    }
  }

  // Add personalization context (second priority)
  if (context.businessContext?.personalization) {
    systemPrompt += `\n\nUser Profile (from questionnaire):`;
    const personalization = context.businessContext.personalization;
    
    if (personalization.interests) {
      systemPrompt += `\n- Interests: ${personalization.interests}`;
    }
    if (personalization.goals) {
      systemPrompt += `\n- Main Goal: ${personalization.goals}`;
    }
    if (personalization.role) {
      systemPrompt += `\n- Role: ${personalization.role}`;
    }
    if (personalization.experienceLevel) {
      systemPrompt += `\n- Experience Level: ${personalization.experienceLevel}`;
    }
    if (personalization.timeCommitment) {
      systemPrompt += `\n- Time Commitment: ${personalization.timeCommitment}`;
    }
    if (personalization.targetAudience) {
      systemPrompt += `\n- Target Audience: ${personalization.targetAudience}`;
    }
  }

  // Add user metadata (lowest priority - for reference only)
  if (context.userInfo?.name) {
    systemPrompt += `\n\nUser: ${context.userInfo.name}`;
  }

  // Final instruction emphasizing priority
  systemPrompt += `\n\nINSTRUCTION: The user's explicit request is your primary directive. Use the context above to enhance and personalize your response, but never let it override what the user specifically asked for.`;

  return systemPrompt;
}

/**
 * Validate context interpretation follows priority rules
 * @param {Object} context - The context being used
 * @param {string} userRequest - The user's explicit request
 * @param {string} aiResponse - The AI's response
 * @returns {Object} Validation result
 */
export function validateContextPriority(context, userRequest, aiResponse) {
  const issues = [];
  
  // Check if AI response ignores explicit user request
  if (userRequest && !aiResponse.toLowerCase().includes(userRequest.toLowerCase().split(' ')[0])) {
    issues.push('AI response may not be addressing the user\'s explicit request');
  }
  
  // Check if metadata is being over-prioritized
  if (context.userInfo?.email && aiResponse.toLowerCase().includes(context.userInfo.email.split('@')[0])) {
    issues.push('AI response appears to be influenced by email metadata over explicit input');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations: issues.length > 0 ? [
      'Ensure the AI response directly addresses the user\'s explicit request',
      'Use context to enhance the response, not replace the user\'s intent',
      'Prioritize questionnaire responses over metadata'
    ] : []
  };
}

const contextPriorityUtils = {
  CONTEXT_PRIORITY_LEVELS,
  CONTEXT_SOURCES,
  CONTEXT_EXAMPLES,
  buildContextAwarePrompt,
  validateContextPriority
};

export default contextPriorityUtils; 