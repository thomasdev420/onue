# AI Memory System Documentation

## Overview

The AI Memory System is a comprehensive learning and preference management system that makes Swiftreel's AI feel smarter with every interaction. It stores, learns from, and applies user preferences, creative directions, and interaction patterns across sessions.

## Key Features

### 🧠 **Intelligent Memory Extraction**
- Automatically identifies and stores meaningful user preferences
- Extracts creative benchmarks (e.g., "like Nike's Just Do It")
- Learns from repeated patterns and language
- Prioritizes explicit user input over metadata

### 📊 **Memory Categories**
The system organizes memories into 8 categories:

1. **Creative Preferences** - Creative benchmarks and inspiration sources
2. **Goals & Objectives** - User's stated goals and objectives
3. **Style Preferences** - Content style and tone preferences
4. **Content Patterns** - Recurring themes and topics
5. **Brand Voice** - Brand tone and voice preferences
6. **Target Audience** - Audience specifications
7. **Interaction History** - User interaction patterns
8. **Success Metrics** - Performance and success indicators

### 🎯 **Priority System**
Memories are ranked by priority (1-5):
- **5 (Critical)** - Core user identity and preferences
- **4 (High)** - Important creative directions
- **3 (Medium)** - Style preferences and patterns
- **2 (Low)** - General interaction patterns
- **1 (Minor)** - Casual mentions and observations

### 🔄 **Continuous Learning**
- Tracks access frequency to identify most important preferences
- Updates memory relevance based on usage patterns
- Automatically cleans up old, low-value memories
- Maintains context across multiple sessions

## How It Works

### 1. **Memory Extraction**
When a user interacts with the AI, the system automatically analyzes their input for meaningful insights:

```javascript
// Example: User says "I want to create a marketing campaign like Nike's Just Do It"
// System extracts:
{
  category: 'creative_preferences',
  priority: 4,
  type: 'creative_benchmark',
  value: 'Nike\'s Just Do It',
  context: 'User referenced creative inspiration'
}
```

### 2. **Memory Storage**
Insights are stored in the database with metadata:
- User ID
- Category and priority
- Original input context
- Creation and access timestamps
- Access count for relevance tracking

### 3. **Memory Retrieval**
When generating responses, the system:
- Retrieves relevant memories for the user
- Prioritizes high-priority and frequently accessed memories
- Builds context-aware prompts for the AI
- Respects current user requests over stored preferences

### 4. **Memory Application**
The AI uses stored memories to:
- Enhance personalization without overriding current requests
- Provide more relevant suggestions
- Maintain consistency across interactions
- Adapt to evolving user preferences

## Technical Implementation

### Database Schema
```sql
CREATE TABLE ai_memory (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    priority INTEGER NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    context TEXT,
    original_input TEXT,
    created_at TIMESTAMP,
    last_accessed TIMESTAMP,
    access_count INTEGER DEFAULT 1
);
```

### API Endpoints

#### `GET /api/user/memory`
Retrieve user memories with optional filtering:
```javascript
// Get all memories
GET /api/user/memory

// Get memories by category
GET /api/user/memory?category=creative_preferences

// Get with summary
GET /api/user/memory?summary=true&limit=10
```

#### `DELETE /api/user/memory`
Clean up old memories:
```javascript
DELETE /api/user/memory?daysOld=90
```

### React Hook
```javascript
import useAIMemory from '../shared/hooks/useAIMemory';

function MyComponent() {
  const {
    memories,
    loading,
    error,
    fetchMemories,
    getCreativePreferences,
    getHighPriorityMemories,
    hasPreferences
  } = useAIMemory();

  // Use memory data...
}
```

## Usage Examples

### Example 1: Creative Benchmark Learning
**User Input:** "I want to create content like Apple's minimalist style"

**System Learns:**
- Creative preference for minimalist style
- Apple as a creative benchmark
- High priority (4) for style preferences

**Future Interactions:**
- AI suggests minimalist approaches
- References Apple's design principles when relevant
- Maintains consistency in style recommendations

### Example 2: Goal Recognition
**User Input:** "My goal is to increase brand awareness among young professionals"

**System Learns:**
- Goal: Increase brand awareness
- Target audience: Young professionals
- Critical priority (5) for goals

**Future Interactions:**
- AI focuses on brand awareness strategies
- Tailors content for young professional audience
- Suggests relevant platforms and approaches

### Example 3: Style Preference Evolution
**User Input:** "I prefer casual, conversational tone"

**System Learns:**
- Style preference: Casual, conversational
- High priority (4) for brand voice

**Future Interactions:**
- AI maintains casual tone in responses
- Suggests conversational content approaches
- Adapts if user requests formal tone (respects current choice)

## Memory Management

### Automatic Features
- **Extraction:** Automatically identifies meaningful insights
- **Storage:** Stores with appropriate priority and categorization
- **Access Tracking:** Updates usage statistics
- **Cleanup:** Removes old, low-priority memories

### Manual Management
Users can view and manage their memories through:
- **Settings Page:** Memory manager component
- **Category Filtering:** View memories by type
- **Priority Indicators:** See importance levels
- **Cleanup Tools:** Remove old memories

## Best Practices

### For Users
1. **Be Specific:** Clear, detailed preferences are better remembered
2. **Consistency:** Repeated preferences get higher priority
3. **Context Matters:** Provide context for better understanding
4. **Evolving Preferences:** System adapts to changing needs

### For Developers
1. **Respect Current Requests:** Never override explicit user input
2. **Enhance, Don't Replace:** Use memory to improve, not replace
3. **Privacy First:** Only store meaningful, non-sensitive data
4. **Performance:** Efficient retrieval and storage patterns

## Privacy & Security

### Data Storage
- User memories are stored securely in Supabase
- Access is restricted to authenticated users
- No sensitive personal information is stored
- Users can view and manage their own memories

### Data Retention
- Low-priority memories are automatically cleaned up after 90 days
- Users can manually delete memories
- Access patterns are tracked for relevance, not surveillance

## Future Enhancements

### Planned Features
1. **Memory Analytics:** Insights into learning patterns
2. **Memory Sharing:** Share preferences across team accounts
3. **Memory Templates:** Pre-built preference sets
4. **Advanced Extraction:** More sophisticated pattern recognition
5. **Memory Export:** Backup and transfer capabilities

### Integration Opportunities
1. **Content Performance:** Link memories to successful content
2. **A/B Testing:** Test different preference combinations
3. **Team Collaboration:** Shared team preferences
4. **Platform Integration:** Cross-platform preference sync

## Troubleshooting

### Common Issues

**Q: Why isn't the AI remembering my preferences?**
A: Check that you're logged in and the memory system is enabled. Preferences are extracted automatically from your interactions.

**Q: How do I clear my stored preferences?**
A: Use the memory manager in Settings to view and delete specific memories, or use the cleanup function.

**Q: Can I manually add preferences?**
A: Currently, preferences are extracted automatically. Manual entry is planned for future releases.

**Q: How long are memories stored?**
A: High-priority memories are kept indefinitely. Low-priority memories are cleaned up after 90 days.

## Conclusion

The AI Memory System transforms Swiftreel from a simple content creation tool into an intelligent assistant that learns and adapts to each user's unique preferences and goals. By prioritizing explicit user input while leveraging learned preferences, it provides a personalized experience that improves with every interaction.

The system respects user privacy, maintains performance, and continuously evolves to provide better, more relevant assistance while always putting the user's current needs first. 