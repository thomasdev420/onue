# Context Priority Guide for User Intent Recognition

## Overview

This guide establishes the priority order for interpreting user context and intent in Amply. The system must always prioritize explicit user input over metadata or inferred information so generations stay faithful to what the founder asked for, especially when shaping AI-discoverable positioning.

## Priority Hierarchy (Highest to Lowest)

### 1. **EXPLICIT USER INPUT** (Highest Priority)
- **What it includes**: Direct user requests, prompts, questions, and commands
- **Examples**: 
  - "Create slides about dog training"
  - "I need positioning tips for my restaurant"
  - "Generate slides about fitness"
- **Rule**: The user's explicit request is ALWAYS the primary directive

### 2. **QUESTIONNAIRE RESPONSES** (Second Priority)
- **What it includes**: Personalization answers from the onboarding process
- **Examples**:
  - Interests: "B2B SaaS, climate tech, AI tooling"
  - Goals: "Show up in AI answers for my category"
  - Role: "Founder, Marketer, Creator"
  - Experience Level: "Beginner, Intermediate, Expert"
  - Time Commitment: "2-3 hours per week"
  - Target Audience: "Small business owners"
- **Rule**: These responses provide context but should not override explicit requests

### 3. **BUSINESS CONTEXT** (Third Priority)
- **What it includes**: Information extracted from website scanning
- **Examples**:
  - Company Name: "TechCorp Solutions"
  - Business Type: "Software Development"
  - Product Info: "Custom software solutions for small businesses"
  - Website URL: "https://techcorp.com"
- **Rule**: Used to enhance personalization but should not replace user intent

### 4. **USER METADATA** (Lowest Priority)
- **What it includes**: Email addresses, usernames, profile information
- **Examples**:
  - Email: "cycling@company.com"
  - Username: "techguru"
  - Display Name: "John Smith"
- **Rule**: Should NEVER override explicit user input or questionnaire responses

## Examples of Correct Context Interpretation

### ✅ **Correct Examples**

#### Example 1: IT Company vs Cycling Email
- **User states in questionnaire**: "I run an IT company"
- **User email**: "cycling@company.com"
- **User request**: "Create slides about software development"
- **Correct interpretation**: Recognize they run an IT business and create software development content
- **Incorrect interpretation**: Assume they are a cyclist and create cycling content

#### Example 2: Restaurant Request vs Developer Role
- **User role**: "Developer"
- **User request**: "Give me positioning tips for my restaurant"
- **Correct interpretation**: Provide restaurant positioning tips
- **Incorrect interpretation**: Provide developer-focused slides

#### Example 3: Dog Training vs Business Context
- **Business type**: "Technology Consulting"
- **User request**: "Create slides about dog training"
- **Correct interpretation**: Create dog training slides
- **Incorrect interpretation**: Create technology consulting content

### ❌ **Incorrect Examples**

#### Example 1: Email Override
- **User email**: "tech@company.com"
- **User request**: "Create slides about dog training"
- **Incorrect interpretation**: Create tech-related content instead
- **Correct interpretation**: Create dog training content

#### Example 2: Business Type Override
- **Business type**: "Restaurant"
- **User request**: "Create fitness content"
- **Incorrect interpretation**: Create restaurant content
- **Correct interpretation**: Create fitness content

## Implementation Guidelines

### For AI Chat Responses
1. **Primary**: Address the user's explicit question or request
2. **Secondary**: Use questionnaire responses to personalize the tone and style
3. **Tertiary**: Reference business context when relevant
4. **Never**: Let metadata influence the core response

### For structured generation
1. **Primary**: Generate output that matches the user's specific request
2. **Secondary**: Use personalization data to adjust complexity and style
3. **Tertiary**: Incorporate business context for relevance
4. **Never**: Generate output based on metadata alone

### For Slide Creation
1. **Primary**: Create slides about the topic the user requested
2. **Secondary**: Use personalization to choose appropriate image categories and tone
3. **Tertiary**: Reference business context for examples or framing
4. **Never**: Create slides about the business type if user asked for something else

## Technical Implementation

The context priority system is implemented through:

1. **`app/utils/contextPriority.js`**: Core utility defining priority rules
2. **`buildContextAwarePrompt()`**: Function that builds system prompts with proper priority
3. **Updated API routes**: AI chat and slide generation APIs use the priority system
4. **Validation functions**: Check that responses follow priority rules

## Testing Scenarios

### Test Case 1: Explicit Request Override
- **Setup**: User with IT business context asks for "dog training tips"
- **Expected**: AI provides dog training tips
- **Not Expected**: AI provides IT consulting advice

### Test Case 2: Questionnaire Priority
- **Setup**: User states "I run a restaurant" in questionnaire but email contains "tech"
- **Expected**: AI recognizes restaurant business
- **Not Expected**: AI assumes tech business based on email

### Test Case 3: Metadata Ignored
- **Setup**: User with "cycling@company.com" email asks for "positioning advice"
- **Expected**: AI provides general positioning advice
- **Not Expected**: AI assumes cycling niche without being told

## Maintenance and Updates

- Review and update priority rules as new context sources are added
- Test context interpretation regularly with edge cases
- Monitor AI responses to ensure they follow priority guidelines
- Update documentation when priority rules change

## Conclusion

The context priority system ensures that Amply always respects the user's explicit intent while using additional context to enhance personalization, which is critical when founders are iterating on how assistants should describe them. 