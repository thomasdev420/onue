# User Work Persistence System

This document explains the comprehensive persistence system implemented to save user work across all pages in the application.

## Overview

The persistence system automatically saves user work to the database and restores it when users return to pages. This prevents data loss when navigating between pages or refreshing the browser.

## How It Works

### 1. Database Table
The system uses a `user_work` table in Supabase with the following structure:
- `user_id`: User's email/ID
- `page_type`: Type of page (slides, memes, content, etc.)
- `work_data`: JSON data containing the user's work
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated

### 2. Persistence Service
Located at `app/services/persistenceService.js`, this service provides:
- `saveUserWork()`: Save data to database
- `loadUserWork()`: Load data from database
- `autoSaveWork()`: Debounced auto-save function
- `usePersistence()`: React hook for easy integration

### 3. Auto-Save Features
- **Debounced saving**: Prevents excessive database calls (1-second delay)
- **Visual feedback**: Shows save status (saving, saved, error)
- **Automatic loading**: Restores work when page loads
- **Error handling**: Graceful fallback if save fails

## Pages with Persistence

### 1. Slides Editor (`/dashboard/slides`)
- Saves all slides with images, text, and positioning
- Preserves slide order and active slide index
- Maintains text content and positions

### 2. Meme Creator (`/dashboard/memes`)
- Saves selected meme, background, and custom uploads
- Preserves text content, positioning, and sizing
- Maintains scroll positions for meme/background selectors

### 3. Content Manager (`/dashboard/content`)
- Saves uploaded images and videos
- Preserves file metadata and organization
- Maintains user's content library

## Adding Persistence to New Pages

### Step 1: Import the hook
```javascript
import { usePersistence } from '../../services/persistenceService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
```

### Step 2: Define default data
```javascript
const defaultData = {
  // Your default state here
  field1: 'default value',
  field2: [],
  // etc.
};
```

### Step 3: Use the persistence hook
```javascript
const { 
  data, 
  updateData, 
  resetData,
  saveStatus, 
  isLoading 
} = usePersistence('page-name', defaultData);
```

### Step 4: Add the status indicator
```javascript
return (
  <div>
    <SaveStatusIndicator saveStatus={saveStatus} />
    {/* Your page content */}
  </div>
);
```

### Step 5: Update your state management
Replace `useState` with the persistence data:
```javascript
// Instead of:
const [myData, setMyData] = useState(defaultValue);

// Use:
const { data: myData, updateData: setMyData } = usePersistence('page-name', defaultValue);
```

## Database Setup

You'll need to create the `user_work` table in your Supabase database:

```sql
CREATE TABLE user_work (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  page_type TEXT NOT NULL,
  work_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_type)
);

-- Add indexes for better performance
CREATE INDEX idx_user_work_user_id ON user_work(user_id);
CREATE INDEX idx_user_work_page_type ON user_work(page_type);
```

## Benefits

1. **No Data Loss**: User work is automatically saved and restored
2. **Better UX**: Users can navigate freely without losing progress
3. **Cross-Device**: Work is saved to database, accessible from any device
4. **Performance**: Debounced saving prevents excessive API calls
5. **Reliability**: Error handling ensures graceful degradation

## Troubleshooting

### Data not saving
- Check browser console for errors
- Verify user is authenticated
- Ensure database table exists and has correct permissions

### Data not loading
- Check if user has existing saved data
- Verify page type matches saved data
- Check network connectivity

### Performance issues
- The debounce delay can be adjusted in `persistenceService.js`
- Consider implementing data compression for large objects
- Monitor database query performance

## Future Enhancements

1. **Data compression**: Compress large JSON objects before saving
2. **Versioning**: Add version control for user work
3. **Collaboration**: Allow sharing of saved work between users
4. **Backup**: Implement automatic backup of user work
5. **Analytics**: Track save/load patterns for optimization 