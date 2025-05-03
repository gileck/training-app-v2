import { NotFound } from './NotFound';
import { AIChat } from './AIChat';
import { Settings } from './Settings';
import { FileManager } from './FileManager';
import { AIMonitoring } from './AIMonitoring';
import { TrainingPlans } from './TrainingPlans';
import { ManagePlanExercises } from './ManagePlanExercises';
import { WorkoutView } from './WorkoutView';
import { WorkoutPage } from './WorkoutPage';
import { SavedWorkouts } from './SavedWorkouts';
import { createRoutes } from '../router';

// Define routes
export const routes = createRoutes({
  '/': WorkoutView,
  '/ai-chat': AIChat,
  '/training-plans': TrainingPlans,
  '/training-plans/:planId/exercises': ManagePlanExercises,
  '/workout/:planId/:weekNumber': WorkoutView,
  '/settings': Settings,
  '/file-manager': FileManager,
  '/ai-monitoring': AIMonitoring,
  '/not-found': NotFound,
  '/training-plans/:planId/weeks/:weekNumber/workout': WorkoutPage,
  '/workout-page': WorkoutPage,
  '/saved-workouts': SavedWorkouts,
});
