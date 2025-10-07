import { NotFound } from './NotFound';
import { Settings } from './Settings';
import { TrainingPlans } from './TrainingPlans';
import { ManageTrainingPlanPage } from './ManageTrainingPlanPage';
import { WorkoutView } from './WorkoutView';
import { WorkoutPage } from './WorkoutPage';
import { SavedWorkouts } from './SavedWorkouts';
import { Profile } from './Profile';
import { createRoutes } from '../router';
import { ProgressView } from './ProgressView';
// Define routes
export const routes = createRoutes({
  '/': WorkoutView,
  '/training-plans': TrainingPlans,
  '/training-plans/:planId/exercises': ManageTrainingPlanPage,
  '/training-plans/:planId/workouts': ManageTrainingPlanPage,
  '/training-plans/:planId/ai': ManageTrainingPlanPage,
  '/workout/:planId/:weekNumber': WorkoutView,
  '/saved-workouts': SavedWorkouts,
  '/settings': Settings,
  '/profile': Profile,
  '/not-found': NotFound,
  '/training-plans/:planId/weeks/:weekNumber/workout': WorkoutPage,
  '/workout-page': WorkoutPage,
  '/progress-view': ProgressView
});
