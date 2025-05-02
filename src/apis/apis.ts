import { ApiHandlers, ApiHandler } from "./types";
import * as chat from "./chat/server";
import * as clearCache from "./settings/clearCache/server";
import * as fileManagement from "./fileManagement/server";
import * as aiUsage from "./monitoring/aiUsage/server";
import * as auth from "./auth/server";
import * as trainingPlans from "./trainingPlans/server";

export const apiHandlers: ApiHandlers = {
  [chat.name]: { process: chat.process as ApiHandler['process'] },
  [clearCache.name]: { process: clearCache.process as ApiHandler['process'] },
  [fileManagement.name]: { process: fileManagement.process as ApiHandler['process'] },
  [aiUsage.all]: { process: aiUsage.getAllUsage as ApiHandler['process'] },
  [aiUsage.summary]: { process: aiUsage.getSummary as ApiHandler['process'] },
  [auth.registerApiName]: { process: auth.registerUser as ApiHandler['process'] },
  [auth.loginApiName]: { process: auth.loginUser as ApiHandler['process'] },
  [auth.logoutApiName]: { process: auth.logoutUser as ApiHandler['process'] },
  [auth.getCurrentUserApiName]: { process: auth.getCurrentUser as ApiHandler['process'] },
  [trainingPlans.getAllApiName]: { process: trainingPlans.getAllTrainingPlans as ApiHandler['process'] },
  [trainingPlans.getByIdApiName]: { process: trainingPlans.getTrainingPlanById as ApiHandler['process'] },
  [trainingPlans.createApiName]: { process: trainingPlans.createTrainingPlan as ApiHandler['process'] },
  [trainingPlans.updateApiName]: { process: trainingPlans.updateTrainingPlan as ApiHandler['process'] },
  [trainingPlans.deleteApiName]: { process: trainingPlans.deleteTrainingPlan as ApiHandler['process'] },
  [trainingPlans.duplicateApiName]: { process: trainingPlans.duplicateTrainingPlan as ApiHandler['process'] },
};
