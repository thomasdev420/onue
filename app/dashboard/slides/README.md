# Slides Editor - Refactored Architecture

## Overview

The slides editor has been refactored from a monolithic 1011-line component into a well-organized, maintainable structure with clear separation of concerns.

## Architecture

### File Structure

```
app/dashboard/slides/
├── page.js                    # Main entry point (now ~150 lines)
├── constants.js               # Centralised constants and configuration
├── README.md                  # This documentation
├── components/                # Reusable UI components
│   ├── SlideCanvas.jsx       # Main slide display area
│   ├── TextOverlay.jsx       # Individual text elements
│   ├── SlideControls.jsx     # Action buttons for slides
│   ├── ActionButton.jsx      # Reusable button component
│   ├── ContentModal.jsx      # Image selection modal
│   └── PromptModal.jsx       # AI prompt modal
└── hooks/                     # Custom React hooks
    ├── useSlideCanvas.js     # Canvas state and refs
    ├── useDragAndDrop.js     # Drag and drop functionality
    ├── useInlineEditing.js   # Inline text editing
    ├── useSlideManagement.js # Slide CRUD operations
    └── useSlideNavigation.js # Navigation and keyboard shortcuts
```

## Components

### Main Components

#### `page.js`
- **Purpose**: Main entry point and state management
- **Responsibilities**: 
  - Data fetching and persistence
  - Modal state management
  - Event handler coordination
  - Component composition

#### `SlideCanvas.jsx`
- **Purpose**: Main slide display area
- **Responsibilities**:
  - Slide rendering and layout
  - Integration of drag/drop and inline editing
  - Canvas event handling

#### `TextOverlay.jsx`
- **Purpose**: Individual text elements on slides
- **Responsibilities**:
  - Text positioning and styling
  - Inline editing interface
  - Drag and drop interaction

#### `SlideControls.jsx`
- **Purpose**: Action buttons for each slide
- **Responsibilities**:
  - Delete, ratio change, add text, etc.
  - Button layout and visibility

#### `ActionButton.jsx`
- **Purpose**: Reusable button component
- **Responsibilities**:
  - Consistent button styling
  - Hover effects
  - Icon and text support

#### `ContentModal.jsx`
- **Purpose**: Image selection modal
- **Responsibilities**:
  - Stock vs user image selection
  - Image grid display
  - Dropdown navigation

#### `PromptModal.jsx`
- **Purpose**: AI prompt interface
- **Responsibilities**:
  - Prompt input and submission
  - Modal styling and behavior

## Custom Hooks

### `useSlideCanvas.js`
- Manages canvas refs and slide width configuration
- Provides centralised canvas state

### `useDragAndDrop.js`
- Handles text element dragging
- Magnetic snapping to centre
- Boundary constraints
- Click vs drag detection

### `