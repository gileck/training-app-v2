# Exercise View Modes Feature Documentation

## Overview

The Exercise View Modes feature allows users to switch between two different viewing modes for exercises in the WorkoutView exercise tab: **Detailed View** and **Compact View**.

## Feature Components

### 1. View Mode Settings

The view mode preference is stored in the application settings and persists across sessions.

**Files Modified:**
- `src/client/settings/types.ts` - Added `exerciseViewMode: 'detailed' | 'compact'` to Settings interface

**Default Setting:**
- `exerciseViewMode: 'detailed'` - Users start with the detailed view by default

### 2. Compact Exercise Item Component

A new compact version of the exercise card component was created to provide a more condensed view.

**File Created:**
- `src/client/routes/WorkoutView/components/CompactWorkoutExerciseItem.tsx`

**Features:**
- **Small Image**: 50x50px exercise image (vs 100x100px in detailed view)
- **Condensed Layout**: Horizontal layout with image, exercise info, and controls in a single row
- **Progress Information**: Displays sets completed, progress bar, and completion badge
- **Simplified Controls**: Only includes increment (+) and decrement (-) buttons
- **Info Button**: Quick access to exercise details modal
- **Visual Feedback**: Shows completion status with color-coded progress bar and completion badge

**Removed from Compact View:**
- "Complete All Sets" button (to save space)
- Secondary muscle chips
- Reps and weight information in main view (still available in detail modal)
- Divider lines

### 3. View Mode Toggle

A toggle button was added to the exercise tab header to switch between views.

**File Modified:**
- `src/client/routes/WorkoutView/components/ExerciseTabContent.tsx`

**Toggle Features:**
- Icon button in the top-right corner of the exercise tab
- Shows `ViewCompactIcon` when in detailed view (to switch to compact)
- Shows `ViewListIcon` when in compact view (to switch to detailed)
- Tooltip indicates which view will be activated
- Styled with primary theme color and hover effects

### 4. Dynamic Component Rendering

The exercise tab now dynamically renders the appropriate component based on the user's preference.

**Implementation:**
```typescript
const ExerciseComponent = viewMode === 'compact' 
    ? CompactWorkoutExerciseItem 
    : WorkoutExerciseItem;
```

Both active and completed exercises respect the selected view mode.

## User Benefits

1. **Efficiency**: Compact view allows users to see more exercises on screen at once
2. **Personalization**: Users can choose the view that best fits their workout style
3. **Persistence**: View preference is saved and remembered across sessions
4. **Flexibility**: Quick toggle makes it easy to switch between views as needed

## Usage

### For Users

1. Navigate to a training plan's workout view
2. Click on the "Exercises" tab
3. Click the view toggle icon button in the top-right corner
4. The view will immediately switch between compact and detailed modes
5. Your preference will be saved automatically

### For Developers

To access the current view mode in other components:

```typescript
import { useSettings } from '@/client/settings/SettingsContext';

const MyComponent = () => {
    const { settings, updateSettings } = useSettings();
    const currentViewMode = settings.exerciseViewMode;
    
    // To change the view mode programmatically:
    updateSettings({ exerciseViewMode: 'compact' });
};
```

## Technical Details

### Component Props

Both `WorkoutExerciseItem` and `CompactWorkoutExerciseItem` accept the same props (defined in `WorkoutExerciseItemProps`):

- `exercise`: Exercise data with progress information
- `planId`: Training plan identifier
- `weekNumber`: Current week number
- `onSetComplete`: Callback for set completion updates
- `selectedExercises`: Array of selected exercise IDs (for selection mode)
- `handleExerciseSelect`: Callback for exercise selection
- `showSelectionMode`: Boolean to enable/disable selection mode

### Styling Considerations

- Compact view uses smaller padding and margins (1.25px vs 1.5px)
- Image is 50% smaller (50x50px vs 100x100px)
- Progress bar is slightly thinner (4px vs 6px)
- Font sizes are reduced for a more condensed appearance
- Icon buttons are smaller (32x32px vs 36x36px)

### Accessibility

- Both views maintain full keyboard navigation support
- Screen reader support is preserved through proper ARIA labels
- Tooltips provide context for icon-only buttons
- Color contrast ratios meet WCAG standards

## Future Enhancements

Potential improvements for this feature:

1. **List View**: Add a third ultra-compact view showing exercises as a simple list
2. **Grid View**: Option to display exercises in a multi-column grid on larger screens
3. **Customization**: Allow users to customize which information appears in compact view
4. **Animations**: Add smooth transitions when switching between views
5. **Mobile Optimization**: Automatically switch to compact view on smaller screens

## Related Files

- `src/client/settings/types.ts` - Settings type definitions
- `src/client/settings/SettingsContext.tsx` - Settings context provider
- `src/client/routes/WorkoutView/components/ExerciseTabContent.tsx` - Main exercise tab container
- `src/client/routes/WorkoutView/components/WorkoutExerciseItem.tsx` - Detailed view component
- `src/client/routes/WorkoutView/components/CompactWorkoutExerciseItem.tsx` - Compact view component
- `src/client/routes/WorkoutView/components/types.ts` - Shared type definitions

