import { ApiHandlers, ApiHandlerContext } from "./types";
import * as chat from "./chat/server";
import * as clearCache from "./settings/clearCache/server";
import * as fileManagement from "./fileManagement/server";
import * as aiUsage from "./monitoring/aiUsage/server";
import * as auth from "./auth/server";
import * as trainingPlansServer from "./trainingPlans/server";
import * as exercisesServer from "./exercises/server";
import * as exerciseDefinitionsServer from "./exerciseDefinitions/server";
import * as weeklyProgressServer from "./weeklyProgress/server";
import * as progressViewServer from "./progressView/server";
import * as exerciseHistoryServer from './exerciseHistory/server';
import * as exerciseActivityLogServer from './exerciseActivityLog/server';
import {
  getAllApiName as savedWorkoutsGetAllApiName,
  createApiName as savedWorkoutsCreateApiName,
  deleteApiName as savedWorkoutsDeleteApiName,
  getDetailsApiName as savedWorkoutsGetDetailsApiName,
  addExerciseApiName as savedWorkoutsAddExerciseApiName,
  removeExerciseApiName as savedWorkoutsRemoveExerciseApiName,
  renameApiName as savedWorkoutsRenameApiName
} from './savedWorkouts/index';
import * as savedWorkoutsServer from './savedWorkouts/server';

export const apiHandlers: ApiHandlers = {
  [chat.name]: { process: chat.process as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [clearCache.name]: { process: clearCache.process as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [fileManagement.name]: { process: fileManagement.process as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [aiUsage.all]: { process: aiUsage.getAllUsage as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [aiUsage.summary]: { process: aiUsage.getSummary as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [auth.register]: { process: auth.registerUser as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [auth.login]: { process: auth.loginUser as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [auth.getCurrentUserApiName]: { process: auth.getCurrentUser as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [auth.logout]: { process: auth.logoutUser as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.getAllTrainingPlansApiName]: { process: trainingPlansServer.getAllTrainingPlans as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.getTrainingPlanApiName]: { process: trainingPlansServer.getTrainingPlanById as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.getActiveTrainingPlanApiName]: { process: trainingPlansServer.getActiveTrainingPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.createTrainingPlanApiName]: { process: trainingPlansServer.createTrainingPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.updateTrainingPlanApiName]: { process: trainingPlansServer.updateTrainingPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.deleteTrainingPlanApiName]: { process: trainingPlansServer.deleteTrainingPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.duplicateTrainingPlanApiName]: { process: trainingPlansServer.duplicateTrainingPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [trainingPlansServer.setActiveTrainingPlanApiName]: { process: trainingPlansServer.setActiveTrainingPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exercisesServer.getExercisesApiName]: { process: exercisesServer.getExercisesForPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exercisesServer.addExerciseApiName]: { process: exercisesServer.addExerciseToPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exercisesServer.updateExerciseApiName]: { process: exercisesServer.updateExerciseInPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exercisesServer.deleteExerciseApiName]: { process: exercisesServer.deleteExerciseFromPlan as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exerciseDefinitionsServer.getAllOptionsApiName]: { process: exerciseDefinitionsServer.processGetAllOptions as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exerciseDefinitionsServer.getByIdApiName]: { process: exerciseDefinitionsServer.processGetById as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [weeklyProgressServer.getWeeklyProgressApiName]: { process: weeklyProgressServer.getWeeklyProgress as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [weeklyProgressServer.updateSetCompletionApiName]: { process: weeklyProgressServer.updateSetCompletion as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [weeklyProgressServer.addWeeklyNoteApiName]: { process: weeklyProgressServer.addWeeklyNote as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [weeklyProgressServer.editWeeklyNoteApiName]: { process: weeklyProgressServer.editWeeklyNote as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [weeklyProgressServer.deleteWeeklyNoteApiName]: { process: weeklyProgressServer.deleteWeeklyNote as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [progressViewServer.getDailyActivityApiName]: { process: progressViewServer.getDailyActivity as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exerciseHistoryServer.getHistoryApiName]: { process: exerciseHistoryServer.getExerciseHistory as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exerciseActivityLogServer.getActivityLogsApiName]: { process: exerciseActivityLogServer.getActivityLogs as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exerciseActivityLogServer.updateActivityLogApiName]: { process: exerciseActivityLogServer.updateActivityLog as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exerciseActivityLogServer.deleteActivityLogApiName]: { process: exerciseActivityLogServer.deleteActivityLog as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [exerciseActivityLogServer.getActivitySummaryApiName]: { process: exerciseActivityLogServer.getActivitySummary as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [savedWorkoutsGetAllApiName]: { process: savedWorkoutsServer.getAllSavedWorkouts as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [savedWorkoutsCreateApiName]: { process: savedWorkoutsServer.createSavedWorkout as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [savedWorkoutsDeleteApiName]: { process: savedWorkoutsServer.deleteSavedWorkout as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [savedWorkoutsGetDetailsApiName]: { process: savedWorkoutsServer.getSavedWorkoutDetails as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [savedWorkoutsAddExerciseApiName]: { process: savedWorkoutsServer.addExerciseToSavedWorkout as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [savedWorkoutsRemoveExerciseApiName]: { process: savedWorkoutsServer.removeExerciseFromSavedWorkout as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> },
  [savedWorkoutsRenameApiName]: { process: savedWorkoutsServer.renameSavedWorkout as unknown as (params: unknown, context: ApiHandlerContext) => Promise<unknown> }
};
