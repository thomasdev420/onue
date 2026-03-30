# Unified Content Engine

## Overview

The Unified Content Engine is the server-side orchestrator for **structured slide payloads**: it pairs LLM-generated copy with retrieval-ranked brand assets so founders ship consistent, machine-summarizable narratives (aligned with AI-mediated discovery, not “social scheduling” as a product story).

## Key Features

### 🎯 **Intelligent Image Selection**
- **Specific Keyword Matching**: Extracts precise keywords from user prompts for targeted image selection
- **AI-Powered Semantic Fallback**: When specific keywords don't match, uses GPT-4o-mini's contextual knowledge to find the most relevant image category
- **Dynamic Reasoning**: Leverages AI's vast knowledge about people, places, concepts, and cultural references
- **Context-Aware Selection**: Considers business context and user preferences for better image relevance

### 🧠 **AI-Powered Category Detection**
- Analyzes user prompts to determine the most appropriate image categories
- Extracts 3-5 specific keywords for precise image matching
- Uses GPT-4o-mini for intelligent reasoning about content themes

### 📊 **Smart Image Scoring**
- Scores images based on exact and partial keyword matches
- Prevents duplicate image usage across slides
- Graceful fallback when preferred images aren't available

## How It Works

### 1. **Keyword Extraction**
The system analyzes the user's prompt to extract:
- Primary image category (e.g., "luxury", "technology", "business")
- Specific keywords (e.g., "iman gadzhi" maps to ["iman", "gadzhi", "entrepreneur", "luxury", "wealth"])

### 2. **Image Selection Process**
1. **Primary Search**: Look for images matching specific keywords + category keywords
2. **AI-Powered Fallback**: If no matches found, use GPT-4o-mini's contextual knowledge:
   - Analyze the prompt using AI's vast knowledge about people, places, and concepts
   - Determine the most semantically relevant image category
   - Consider cultural associations, visual symbolism, and emotional resonance
3. **Best Match Selection**: Score and select the most relevant available image

### 3. **AI-Powered Fallback Examples**
- **"iman gadzhi"**: no specific images, then AI reasoning, then "luxury" (wealth, entrepreneurship, success)
- **"elon musk"**: no specific images, then AI reasoning, then "technology" (innovation, space, future)
- **"kylie jenner"**: no specific images, then AI reasoning, then "luxury" (fashion, wealth, influence)
- **"meditation"**: no specific images, then AI reasoning, then "lifestyle" (wellness, peace, mindfulness)

## AI-Powered Intelligence

The system leverages GPT-4o-mini's vast contextual knowledge for dynamic reasoning:

### Dynamic Entity Recognition
- **People**: Entrepreneurs, celebrities, athletes, public figures, business leaders
- **Companies**: Tech companies, luxury brands, startups, corporations
- **Concepts**: Abstract ideas, cultural phenomena, trends, movements
- **Places**: Cities, countries, landmarks, cultural locations

### Intelligent Reasoning Examples
- **"iman gadzhi"**: AI recognizes wealth, entrepreneurship, luxury lifestyle; selects "luxury"
- **"elon musk"**: AI recognizes innovation, technology, space exploration; selects "technology"
- **"kylie jenner"**: AI recognizes fashion, wealth, public influence signals; selects "luxury"
- **"meditation"**: AI recognizes wellness, mindfulness, personal growth; selects "lifestyle"
- **"sustainable living"**: AI recognizes environmental consciousness; selects "nature"

## API Usage

```javascript
const unifiedEngine = new UnifiedContentEngine();

const slides = await unifiedEngine.generateCompleteSlides({
  prompt: "Create 5 slides about iman gadzhi life",
  slideCount: 5,
  businessContext: {
    companyName: "Your Business",
    businessType: "Technology"
  },
  userInfo: {
    name: "John Doe",
    email: "john@example.com"
  }
});
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required for AI-powered features
- `SUPABASE_URL`: Database connection for image storage
- `SUPABASE_ANON_KEY`: Database authentication

### Image Categories
Available categories are defined in `app/shared/constants/imageCategories.js`:
- business, technology, success, motivation, growth
- creativity, social_media, entrepreneurship, marketing
- lifestyle, luxury, nature, health, education
- finance, travel, food, fashion, sports
- family, abstract, industrial, urban, rural
- science, romantic, running

## Performance Optimizations

- **Caching**: Image queries are cached to reduce database calls
- **AI-Powered Reasoning**: Dynamic fallback using GPT-4o-mini's contextual knowledge
- **Sequential Processing**: Prevents race conditions in image selection
- **Memory Management**: Tracks used images to prevent duplicates

## Error Handling

- Graceful fallback when specific keywords don't match
- AI reasoning when static mapping isn't available
- Default to "business" category if all else fails
- Comprehensive logging for debugging

## Future Enhancements

- **Image Quality Scoring**: Rank images by visual quality and relevance
- **User Preference Learning**: Remember user's image style preferences
- **Dynamic Category Expansion**: Auto-generate new categories based on usage
- **Multi-Modal Selection**: Consider image content analysis for better matching 