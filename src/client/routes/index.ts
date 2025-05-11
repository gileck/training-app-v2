import { NotFound } from './NotFound';
import { AIChat } from './AIChat';
import { Settings } from './Settings';
import { FileManager } from './FileManager';
import { AIMonitoring } from './AIMonitoring';
import { TrainingPlans } from './TrainingPlans';
import { ManageTrainingPlanPage } from './ManageTrainingPlanPage';
import { WorkoutView } from './WorkoutView';
import { WorkoutPage } from './WorkoutPage';
import { createRoutes } from '../router';
import { ProgressView } from './ProgressView';
// Define routes
export const routes = createRoutes({
  '/': WorkoutView,
  '/ai-chat': AIChat,
  '/training-plans': TrainingPlans,
  '/training-plans/:planId/exercises': ManageTrainingPlanPage,
  '/training-plans/:planId/workouts': ManageTrainingPlanPage,
  '/workout/:planId/:weekNumber': WorkoutView,
  '/settings': Settings,
  '/file-manager': FileManager,
  '/ai-monitoring': AIMonitoring,
  '/not-found': NotFound,
  '/training-plans/:planId/weeks/:weekNumber/workout': WorkoutPage,
  '/workout-page': WorkoutPage,
  '/progress-view': ProgressView
});
