import apiClient from '@/client/utils/apiClient';
import type { CacheResult } from '@/common/cache/types';
import { suggestActionsApiName } from './index';
import type { SuggestActionsRequest, SuggestActionsResponse } from './types';

export { type SuggestActionsRequest, type SuggestActionsResponse };

export const suggestActionsForTrainingPlan = async (
    request: SuggestActionsRequest
): Promise<CacheResult<SuggestActionsResponse>> => {
    return apiClient.call<SuggestActionsResponse, SuggestActionsRequest>(suggestActionsApiName, request, { bypassCache: true });
};



