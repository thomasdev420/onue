# Mandatory Onboarding Implementation

## Overview

This implementation ensures that first-time users must complete the onboarding flow before accessing the dashboard. The onboarding popup is mandatory for new users but becomes optional for returning users who have already completed it.

## Key Features

### 1. Mandatory Flow for First-Time Users
- **No Close Button**: The X button is hidden for first-time users
- **Cannot Escape**: Users cannot close the modal until onboarding is completed
- **Required Completion**: All steps must be completed to proceed

### 2. Optional Flow for Returning Users
- **Close Button Available**: Returning users can exit the onboarding freely
- **Accessible via "Personalize"**: Users can access onboarding again through the ChatBar
- **Editable Information**: Users can update their business information and preferences

### 3. First-Time User Detection
- Uses the existing `/api/user/onboarding-status` endpoint
- Checks if user has completed onboarding data
- Automatically shows mandatory onboarding for new users
- Tracks completion status to determine user type

### 4. Implementation Details

#### WebsiteOnboarding Component Changes
- Added `isMandatory` prop (defaults to `false`)
- Conditional close button rendering based on `isMandatory`
- Modified `handleClose()` to respect mandatory state
- Updated welcome message for first-time users

#### Dashboard Layout Changes
- Added `isFirstTimeUser` state to track user type
- Automatic mandatory onboarding trigger for new users
- Loading state includes onboarding status check
- Updates completion status on finish
- Sets `isFirstTimeUser` to `false` after completion

#### Dashboard Page Changes
- Removed duplicate onboarding logic
- Simplified to use layout-level onboarding management
- "Personalize" action in ChatBar allows returning users to access onboarding

## User Flow

### First-Time Users
1. **New User Signs Up**: User creates account and is redirected to dashboard
2. **Onboarding Check**: System checks if user has completed onboarding
3. **Mandatory Modal**: If not completed, mandatory onboarding appears
4. **No Escape**: User cannot close or skip the onboarding
5. **Complete Flow**: User must complete all steps:
   - Website choice (scan or manual entry)
   - Business information entry
   - Campaign choice (optional)
   - Content categories (if creating campaign)
   - Public-surface handle/bio suggestions (when enabled in flow)
6. **Access Granted**: Only after completion can user access dashboard

### Returning Users
1. **Dashboard Access**: User can freely access dashboard
2. **Optional Access**: User can click "Personalize" in ChatBar to access onboarding
3. **Editable Flow**: User can edit existing information or add new details
4. **Free Exit**: User can close the modal at any time
5. **Updated Information**: Changes are saved and applied to future content generation

## Technical Implementation

### Props Added
```javascript
// WebsiteOnboarding component
isMandatory={isFirstTimeUser}
```

### State Management
```javascript
// Dashboard layout
const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
const [onboardingStatusChecked, setOnboardingStatusChecked] = useState(false);
const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
```

### API Integration
- Uses existing `/api/user/onboarding-status` endpoint
- Saves onboarding data via `saveUserWork()` service
- Updates completion status on finish

## Benefits

1. **Guaranteed Setup**: Ensures all new users complete essential setup
2. **Flexible Updates**: Allows returning users to modify their information
3. **Better User Experience**: Personalized onboarding for each user type
4. **Data Collection**: Captures important user and business information
5. **No User Confusion**: Clear, guided setup process for new users
6. **Consistent Experience**: All users go through the same initial flow

## Testing

To test the mandatory onboarding:

1. Create a new user account
2. Verify onboarding appears immediately with no close button
3. Complete the onboarding flow
4. Verify dashboard access is granted
5. Click "Personalize" in ChatBar
6. Confirm onboarding appears with close button available
7. Verify you can exit freely

## Future Enhancements

- Add progress indicators for multi-step flow
- Implement onboarding analytics
- Add onboarding customization based on user type
- Consider A/B testing different onboarding flows
- Add onboarding completion celebration/confetti 