# AI Clarification System

## Overview

The AI Clarification System is designed to handle vague, ambiguous, or underspecified user prompts by asking targeted clarifying questions before providing responses. This ensures that AI responses are deeply aligned with user intent and reduces misinterpretation.

## Key Features

### 1. Intelligent Ambiguity Detection
- **Pattern Recognition**: Detects common vague patterns like "create content", "help me", "ideas"
- **Context Awareness**: Considers business context and user history when analyzing prompts
- **Severity Levels**: Categorizes ambiguity as high, medium, or low priority

### 2. Targeted Clarification Questions
- **Context-Specific**: Questions are tailored to the type of ambiguity detected
- **Progressive**: Asks the most important questions first
- **User-Friendly**: Clear, actionable questions that guide users to provide useful information

### 3. Enhanced Response Generation
- **Information Extraction**: Parses user clarification responses to extract key details
- **Prompt Enhancement**: Builds comprehensive prompts from original request + clarification
- **Memory Integration**: Works seamlessly with the AI memory system

## How It Works

### 1. Prompt Analysis
```javascript
import { analyzePromptClarity } from '../utils/clarificationSystem.js';

const analysis = analyzePromptClarity(userPrompt, context);
// Returns: { needsClarification: true, reasons: [...], suggestions: [...] }
```

### 2. Clarification Generation
```javascript
import { generateClarificationResponse } from '../utils/clarificationSystem.js';

const clarification = generateClarificationResponse(analysis, originalPrompt, context);
// Returns: "I'd love to help you create exactly what you need! To give you the most relevant and helpful response, I need a bit more information..."
```

### 3. Information Extraction
```javascript
import { extractClarifiedInformation } from '../utils/clarificationSystem.js';

const clarifiedInfo = extractClarifiedInformation(userResponse, originalAnalysis);
// Returns: { topic: "...", goal: "...", audience: "...", platform: "...", style: "..." }
```

### 4. Enhanced Prompt Building
```javascript
import { buildEnhancedPrompt } from '../utils/clarificationSystem.js';

const enhancedPrompt = buildEnhancedPrompt(originalPrompt, clarifiedInfo, context);
// Returns: Original prompt + extracted information in structured format
```

## Ambiguity Types

The system detects and handles various types of ambiguity:

### High Priority
- **BROAD_REQUEST**: "create content", "make something"
- **UNCLEAR_INTENT**: "help me", "assist us"
- **MISSING_CONTEXT**: Very short prompts (< 15 characters)

### Medium Priority
- **VAGUE_TOPIC**: "content", "marketing", "strategy"
- **MISSING_DETAILS**: "create slides about business"
- **MISSING_GOAL**: "I want to grow", "looking for ideas"
- **MISSING_PLATFORM**: "unspecified distribution surface"

### Context-Specific
- **MISSING_TARGET_AUDIENCE**: No audience specified
- **MISSING_STYLE**: No tone or style preferences
- **MULTIPLE_INTERPRETATIONS**: Ambiguous language

## API Integration

### AI Chat API (`/api/ai-chat`)
```javascript
// Request
{
  "prompt": "create content",
  "businessContext": {...},
  "userInfo": {...},
  "isClarificationFollowup": false,
  "originalAnalysis": null
}

// Response (if clarification needed)
{
  "response": "I'd love to help you create exactly what you need!...",
  "needsClarification": true,
  "analysis": {
    "originalPrompt": "create content",
    "reasons": [...],
    "suggestions": [...]
  }
}
```

### Slide Generation API (`/api/generate-slides`)
```javascript
// Request
{
  "prompt": "make slides",
  "slideCount": 5,
  "businessContext": {...},
  "userInfo": {...},
  "isClarificationFollowup": false,
  "originalAnalysis": null
}

// Response (if clarification needed)
{
  "response": "I'd love to help you create slides!...",
  "needsClarification": true,
  "analysis": {...}
}
```

## Frontend Integration

### React Hook (`useClarification`)
```javascript
import { useClarification } from '../shared/hooks/useClarification.js';

const {
  needsClarification,
  handleClarificationRequest,
  submitClarification,
  cancelClarification,
  getClarificationText,
  isWaitingForClarification,
  getOriginalPrompt
} = useClarification();
```

### Usage in Components
```javascript
// Check if response needs clarification
if (needsClarification(apiResponse)) {
  handleClarificationRequest(apiResponse, originalPrompt);
}

// Handle clarification follow-up
const response = await submitClarification(
  userClarification, 
  apiCallFunction, 
  additionalParams
);
```

### Clarification Modal
```javascript
import ClarificationModal from '../components/ClarificationModal.jsx';

<ClarificationModal
  isOpen={isWaitingForClarification()}
  clarificationText={getClarificationText()}
  originalPrompt={getOriginalPrompt()}
  onSubmit={handleClarificationSubmit}
  onCancel={cancelClarification}
  onClose={cancelClarification}
/>
```

## Configuration

### Vague Patterns
Customize detection patterns in `app/utils/clarificationSystem.js`:

```javascript
export const VAGUE_PATTERNS = [
  {
    pattern: /^(create|make|generate|build)\s+(content|something|stuff|things?)$/i,
    type: AMBIGUITY_TYPES.BROAD_REQUEST,
    severity: 'high'
  },
  // Add more patterns as needed
];
```

### Clarification Questions
Customize questions for each ambiguity type:

```javascript
export const CLARIFICATION_QUESTIONS = {
  [AMBIGUITY_TYPES.VAGUE_TOPIC]: [
    "What specific topic or subject would you like me to help you with?",
    "Could you tell me more about what you're trying to achieve?",
    "What type of content are you looking to create?"
  ],
  // Add more question sets
};
```

## Best Practices

### 1. User Experience
- **Clear Questions**: Ask specific, actionable questions
- **Progressive Disclosure**: Start with the most important questions
- **Context Preservation**: Always show the original request
- **Easy Cancellation**: Allow users to cancel clarification process

### 2. Response Quality
- **Information Extraction**: Parse user responses for key details
- **Prompt Enhancement**: Build comprehensive prompts from clarifications
- **Memory Integration**: Use extracted information to improve future responses
- **Error Handling**: Gracefully handle clarification failures

### 3. Performance
- **Efficient Detection**: Use regex patterns for fast ambiguity detection
- **Caching**: Cache clarification responses when appropriate
- **Rate Limiting**: Prevent abuse of clarification system

## Examples

### Example 1: Vague generation request
**User Input**: "create something"

**System Response**: 
```
I'd love to help you create exactly what you need! To give you the most relevant and helpful response, I need a bit more information.

Could you help me understand:

1. What type of output are you looking for? (e.g., slides, short-form storyboards, narrative variants)
2. Could you specify the format and topic you have in mind?
3. What's your target audience and main message?

The more specific you can be, the better I can tailor my response to your needs.
```

**User Clarification**: "I want educational slides about category positioning for small business owners"

**Enhanced Prompt**: 
```
create slides

Additional context: Topic: category positioning, Goal: educational narrative, Target audience: small business owners, Format: slides
```

### Example 2: Missing Business Context
**User Input**: "help with positioning"

**System Response**:
```
I see you're working with [Company Name]. I'd love to help! Could you provide more details about what you're working on?

Could you help me understand:

1. What specific aspect would you like me to focus on?
2. Could you give me some context about your project or goal?
3. What's your main goal or challenge right now?
```

## Troubleshooting

### Common Issues

1. **False Positives**: Adjust pattern sensitivity in `VAGUE_PATTERNS`
2. **Missing Clarifications**: Check `CLARIFICATION_QUESTIONS` configuration
3. **API Errors**: Verify request/response format matches expected structure
4. **UI Issues**: Ensure ClarificationModal is properly integrated

### Debugging

Enable debug logging:
```javascript
console.log('Clarification analysis:', analysis);
console.log('Enhanced prompt:', enhancedPrompt);
```

## Future Enhancements

1. **Machine Learning**: Train models to better detect ambiguity patterns
2. **Multi-language Support**: Extend to support multiple languages
3. **Voice Integration**: Handle clarification through voice interactions
4. **Predictive Clarification**: Suggest clarifications based on user history
5. **A/B Testing**: Test different clarification approaches for effectiveness

## Contributing

When adding new ambiguity types or clarification questions:

1. Add new type to `AMBIGUITY_TYPES`
2. Create detection pattern in `VAGUE_PATTERNS`
3. Add questions to `CLARIFICATION_QUESTIONS`
4. Update documentation
5. Add tests for new functionality

## Related Systems

- **AI Memory System**: Stores user preferences from clarifications
- **Context Priority System**: Ensures explicit user input is prioritized
- **Business Context Service**: Provides company-specific context for clarifications 