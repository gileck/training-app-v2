import { ApiHandlers, ApiHandler } from "./types";
import * as chat from "./chat/server";
import * as clearCache from "./settings/clearCache/server";
import * as fileManagement from "./fileManagement/server";
import * as aiUsage from "./monitoring/aiUsage/server";
import * as auth from "./auth/server";

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
};
