# Unified Content Engine

## Overview

The Unified Content Engine is a single, streamlined service that combines text generation and image selection into one cohesive process. This eliminates the fragmented approach where text and images were handled separately across multiple files.

## Key Benefits

1. **Simplified Architecture**: One service handles both text and image generation
2. **Better Consistency**: Text and images are selected together for optimal matching
3. **Reduced Complexity**: No more separate image selection services or fragmented logic
4. **Improved Performance**: Single API call generates complete slides with images
5. **Easier Maintenance**: All content generation logic in one place

## Architecture

### Core Components

- **`app/services/unifiedContentEngine.js`**: Main service that handles all content generation
- **`app/api/generate-slides/route.js`**: Simplified API that uses the unified engine
- **Frontend Components**: Updated to work with the unified system

### How It Works

1. **User Request**: User submits a prompt through any interface (ChatBar, PromptModal, etc.)
2. **Unified Processing**: The unified content engine:
   - Generates slide text content using AI
   - Selects appropriate image categories for each slide
   - Fetches and selects the best images from the database
   - Applies consistent styling and positioning
3. **Complete Output**: Returns fully-formed slides with text and images ready to use

## API Usage

### Generate Complete Slides

```javascript
const slides = await unifiedContentEngine.generateCompleteSlides({
  prompt: "Create 5 slides about entrepreneurship",
  slideCount: 5,
  businessContext: { companyName: "My Business" },
  userInfo: { email: "user@example.com" },
  existingSlides: [] // Optional: for adding to existing content
});
```

### Response Format

Each slide includes:
- `id`: Unique identifier
- `texts`: Array of text elements with content and positioning
- `image`: Selected image object with URL and metadata
- `imageCategory`: Category used for image selection
- `ratio`: Aspect ratio (default: '9:16')

## Image Selection

The unified engine intelligently selects images based on:

1. **Content Analysis**: AI analyzes slide content to determine appropriate image categories
2. **Category Matching**: Maps content to predefined image categories (business, technology, success, etc.)
3. **AI Selection**: Uses AI to choose the best image from available options
4. **Variety Management**: Ensures no duplicate images within a generation
5. **Fallback Handling**: Graceful degradation if images aren't available

## Text Generation

The engine generates high-quality text content with:

- **Rich Content**: 70-175 characters of detailed, informative text
- **Proper Numbering**: Each slide includes its number in the title
- **Consistent Styling**: White text with shadow for readability
- **Smart Positioning**: Text positioned for optimal visual impact

## Migration from Old System

### Removed Components

- `app/services/imageSelectionService.js` - Integrated into unified engine
- Complex image selection logic in frontend components
- Separate text positioning and styling logic

### Updated Components

- `app/api/generate-slides/route.js` - Now uses unified engine
- `app/dashboard/slides/components/PromptModal.jsx` - Simplified request format
- `app/dashboard/components/ChatBar.js` - Uses unified system
- `app/dashboard/slides/page.js` - Removed complex image selection logic

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for AI content generation
- Database connection for image storage

### Image Categories

Available categories for image selection:
- business, technology, success, motivation, growth
- creativity, social_media, entrepreneurship, marketing
- lifestyle, luxury, nature, health, education
- finance, travel, food, fashion, sports
- family, abstract, industrial, urban, rural, science, romantic

## Error Handling

The unified engine includes comprehensive error handling:

- **AI Failures**: Fallback to simpler content generation
- **Image Selection**: Graceful degradation with placeholder images
- **Parsing Errors**: Robust JSON parsing with fallback methods
- **Database Issues**: Cached results and fallback options

## Performance Optimizations

- **Caching**: Image categories and selections are cached
- **Batch Processing**: Multiple slides generated in single AI call
- **Lazy Loading**: OpenAI client initialized only when needed
- **Memory Management**: Used image tracking prevents duplicates

## Future Enhancements

- **Custom Image Categories**: User-defined categories
- **Style Preferences**: Personalized content generation
- **Batch Operations**: Generate multiple slide sets
- **Advanced Analytics**: Track content performance
- **Template System**: Predefined slide templates 