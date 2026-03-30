# Integrated Onboarding Flow

## Overview

The integrated onboarding flow combines website scanning and personalization into a single, streamlined experience. This replaces the old separate "Personalize" feature and provides a comprehensive setup process that guides users through entering their website URL, extracting product information, and personalizing their experience.

## Flow Breakdown

### 1. URL Input Step
- **Trigger**: On first visit to dashboard (new users) or manual "Setup Website" button
- **UI**: Clean modal with URL input field
- **Validation**: Ensures valid URL format (http/https)
- **Action**: User enters their website URL

### 2. Scanning Step
- **Progress Animation**: Spinning loader with progress bar
- **Steps**:
  - ✅ Fetching product information (20%)
  - ✅ Generating product page (40%)
  - ✅ Extracting key details (60%)
  - ✅ Analyzing content (80%)
  - ✅ Scan complete! (100%)

### 3. Confirmation Step
- **Display**: Extracted information in editable fields
- **Fields**:
  - Company Name
  - Product Type
  - Product Info
  - Company URL
- **Action**: Users can edit and confirm the extracted data

### 4. Personalization Step (ENHANCED)
- **Contextual Integration**: Questions now reference the scanned website data
- **Dynamic Questions**: Questions adapt based on extracted company information
- **Questions**:
  - What type of content would work best for [Company Name]?
  - What's your main goal for [Company Name] on social media?
  - What is your role in the business?
  - What is your experience with social media marketing?
  - How much time can you dedicate to content creation weekly?
  - Who is [Company Name]'s target audience?
- **Contextual Introduction**: Shows a summary of the scanned website data
- **UI**: Step-by-step question flow with progress indicators
- **Validation**: Real-time validation with character limits and required fields

### 5. Media Upload Step (Optional)
- **Options**: Upload media or skip for later
- **Types**: Images, logos, videos
- **UI**: Drag-and-drop interface

### 6. Video Creation Step
- **Format Options**:
  - **UGC-style**: User-generated content style videos
  - **Hook & Demo**: Attention-grabbing hook with product demonstration
  - **Veo 3-style**: Advanced AI-generated video format
- **Action**: User selects preferred format to start creating

## Technical Implementation

### Components
- `WebsiteOnboarding.jsx`: Main integrated onboarding modal component
- `websiteScanService.js`: Service for website scanning and data extraction

### API Endpoints
- `GET /api/user/onboarding-status`: Check if user has completed integrated onboarding

### Data Storage
- Uses existing `persistenceService.js` to save onboarding data
- Stores data in `user_work` table with `page_type: 'onboarding'`
- **New Data Structure**:
  ```json
  {
    "websiteUrl": "https://example.com",
    "extractedData": {
      "companyName": "Example Corp",
      "productType": "SaaS Platform",
      "productInfo": "Description...",
      "companyUrl": "https://example.com"
    },
    "personalizationAnswers": {
      "contentFocus": "product demos, behind-the-scenes",
      "goals": "Increase brand awareness and drive sales",
      "role": "Founder",
      "experienceLevel": "Intermediate",
      "timeCommitment": "5-10 hours",
      "targetAudience": "young professionals, small business owners"
    },
    "selectedVideoFormat": "ugc",
    "completedAt": "2025-01-XX..."
  }
  ```

### Website Scanning Logic
The scanning service analyzes URLs and extracts information based on:
- Domain name patterns
- URL path analysis
- Common business type indicators
- Simulated AI content analysis

## Migration from Old System

### What Changed
- **Removed**: Separate "Personalize" button and `UserOnboardingModal`
- **Integrated**: All personalization questions into the main onboarding flow
- **Enhanced**: Data structure to include both website and personalization data
- **Updated**: API endpoint to check for complete onboarding data

### Backward Compatibility
- Existing users who completed the old personalization flow will still have their data
- New users will go through the integrated flow
- The system checks for complete onboarding data (both website and personalization)

## Usage

### For New Users
The integrated onboarding automatically triggers on first dashboard visit.

### For Existing Users
Click the "Setup Website" button in the dashboard to manually trigger the flow.

### Integration Points
- Dashboard: Main entry point (replaces old "Personalize" button)
- Persistence Service: Data storage (same database structure)
- User Session: Authentication and user identification

## Future Enhancements

1. **Real Website Scraping**: Replace simulation with actual web scraping
2. **AI Content Analysis**: Use AI to extract more accurate product information
3. **Logo Detection**: Automatically detect and extract company logos
4. **Social Media Integration**: Link to social media profiles
5. **Competitor Analysis**: Compare with similar businesses
6. **Progressive Enhancement**: Allow users to update individual sections later

## Error Handling

- URL validation with clear error messages
- Network error handling during scanning
- Graceful fallbacks for failed scans
- User-friendly error messages
- Real-time validation for personalization questions

## Styling

The component uses Tailwind CSS with:
- Consistent color scheme (blue primary, purple personalization, green success, orange accent)
- Smooth animations and transitions
- Responsive design
- Modern modal styling with backdrop blur
- Progress indicators for multi-step flows 