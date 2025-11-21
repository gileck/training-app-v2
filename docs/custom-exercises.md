# Custom Exercise Definitions

This document describes the custom exercise feature that allows users to create their own exercise definitions.

## Overview

Users can create custom exercise definitions that are private to their account. These custom exercises appear alongside global exercises in the exercise browser and can be used in training plans just like standard exercises.

## Features

### User-Specific Exercises
- Each custom exercise is associated with a specific user via `userId` in the `exerciseDefinitions` collection
- Custom exercises are only visible to the user who created them
- Global exercises (system-provided) have `userId: null`

### Image Upload
- **Method 1: Image File Upload**
  - Users can upload image files (JPEG, PNG, GIF, WEBP)
  - Files are uploaded to Vercel Blob Storage with public access
  - Maximum file size: 5MB
  - Minimum file size: 1KB
  - Images are validated for proper format using buffer header inspection
  
- **Method 2: Image URL**
  - Users can provide a direct URL to an existing image
  - URLs are validated before saving

- **Method 3: Paste from Clipboard (Cmd+V)**
  - Users can paste images directly from their clipboard
  - Preview is shown immediately
  - Same validation rules apply as file upload

### Required Fields
- **Name**: Exercise name (unique per user scope)
- **Primary Muscle**: Selected from predefined muscle groups
- **Exercise Type**: Selected from existing system types
- **Body Weight**: Boolean flag indicating if it's a bodyweight exercise
- **Static**: Boolean flag indicating if it's a static exercise (e.g., plank)

### Optional Fields
- **Secondary Muscles**: Multi-select from predefined muscle groups
- **Image**: Via upload, URL, or paste

## Technical Implementation

### API Structure

#### Create Custom Exercise
```typescript
// Request
POST /api/exerciseDefinitions/create
{
  name: string;
  imageUrl?: string;
  imageFile?: string;  // base64-encoded
  imageFileName?: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  bodyWeight: boolean;
  type: string;
  static: boolean;
}

// Response (success)
{
  definition: ExerciseDefinition
}

// Response (error)
{
  error: string
}
```

### Data Flow

1. **Creation Flow**
   - User opens "Add Exercise" dialog
   - Clicks "Create Custom Exercise"
   - Fills form and optionally uploads/pastes image
   - Client converts image to base64 (if file upload)
   - API validates all fields and image
   - Image uploaded to Vercel Blob Storage
   - Exercise definition created in database with `userId`
   - Client refreshes exercise definitions list (bypassing cache)
   - Exercise dialog opens for the newly created exercise

2. **Display Flow**
   - Exercise definitions are fetched with user context
   - Query includes both global exercises (`userId: null`) and user's custom exercises
   - Custom exercises are marked with a "Custom" badge in the UI
   - Definitions are cached but can be force-refreshed with `bypassCache: true`

### Database Schema

```typescript
interface ExerciseDefinition {
  _id: ObjectId;
  userId?: ObjectId | null;    // null = global, non-null = custom
  name: string;
  imageUrl: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  bodyWeight: boolean;
  type: string;
  static: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Uniqueness Constraints
- Exercise names must be unique within their scope:
  - Global exercises: name must be unique among all global exercises
  - Custom exercises: name must be unique among user's custom exercises
  - A user can create "Bench Press" even if a global "Bench Press" exists

## Error Handling

### Server-Side Errors
All validation errors return structured error responses (not thrown exceptions):

```typescript
{
  error: string  // User-friendly error message
}
```

**Common Errors:**
- Missing required fields (name, primaryMuscle, type)
- Invalid image format or size
- Image upload service unavailable (missing `BLOB_READ_WRITE_TOKEN`)
- Duplicate exercise name in user's scope
- Invalid image URL format

### Client-Side Error Display
- Errors are displayed in an Alert component above the form
- Upload progress indicator shows current status
- Errors are cleared when user modifies the form

## Image Placeholder Handling

### Infinite Loop Prevention
To prevent infinite loops when image loading fails:

1. **Data URL Placeholder**: Uses an inline SVG data URL that cannot fail to load
2. **Guard Condition**: Only sets placeholder if current src is not already a data URL
3. **Shared Constant**: `GENERIC_IMAGE_PLACEHOLDER` exported from `@/client/routes/ManageTrainingPlanPage/utils/constants`

```typescript
// Placeholder is a self-contained SVG data URL
export const GENERIC_IMAGE_PLACEHOLDER = "data:image/svg+xml,..."
```

## Cache Management

### Cache Bypass After Creation
When a custom exercise is created:
1. The exercise browser calls `getAllExerciseDefinitionOptions({ bypassCache: true })`
2. This forces a fresh fetch from the server
3. Ensures the new exercise appears immediately in the list
4. Parent component's definitions are also refreshed with cache bypass

### Cache Strategy
```typescript
getAllExerciseDefinitionOptions({
  bypassCache: boolean  // true = fetch fresh data, false = use cache
})
```

## UI Components

### CreateCustomExerciseDialog
**Location**: `src/client/routes/ManageTrainingPlanPage/dialogs/CreateCustomExerciseDialog.tsx`

**Features:**
- Form validation
- Image upload with preview
- Paste image support (Cmd+V)
- Upload progress indicator
- Error display
- Tab interface for image URL vs upload

### ExerciseFormDialog (Exercise Browser)
**Location**: `src/client/routes/ManageTrainingPlanPage/dialogs/ExerciseFormDialog.tsx`

**Features:**
- "Create Custom Exercise" button
- Displays both global and custom exercises
- Custom exercises show "Custom" badge
- Searches and filters include custom exercises
- Auto-refreshes after custom exercise creation

## Environment Variables

### Required
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob Storage authentication token
  - Required for image uploads
  - If missing, users can still use image URLs but not file uploads

## Testing Considerations

1. **Image Upload**: Test with various image formats and sizes
2. **Paste Functionality**: Test clipboard paste with different image sources
3. **Name Uniqueness**: Verify duplicate name handling in both global and custom scopes
4. **Cache Refresh**: Ensure new exercises appear immediately after creation
5. **Error Handling**: Verify all error messages display correctly
6. **Placeholder Fallback**: Test image loading failures don't cause infinite loops

## Future Enhancements

Potential improvements:
- Image editing/cropping before upload
- Exercise templates/categories for custom exercises
- Sharing custom exercises between users
- Import/export custom exercise definitions
- Exercise history and usage statistics

