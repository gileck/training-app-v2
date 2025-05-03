import { apiClient } from "@/client/utils/apiClient";
import type { CacheResult } from "@/server/cache/types";
import {
    GetWeeklyProgressRequest, GetWeeklyProgressResponse,
    UpdateSetCompletionRequest, UpdateSetCompletionResponse,
    AddWeeklyNoteRequest, AddWeeklyNoteResponse,
    EditWeeklyNoteRequest, EditWeeklyNoteResponse,
    DeleteWeeklyNoteRequest, DeleteWeeklyNoteResponse
} from "./types";
import {
    nameGet as getWeeklyProgressApiName,
    nameUpdateSet as updateSetCompletionApiName,
    nameAddNote as addWeeklyNoteApiName,
    nameEditNote as editWeeklyNoteApiName,
    nameDeleteNote as deleteWeeklyNoteApiName
} from "./index";

/**
 * Task 26 (Client): Get weekly progress for an exercise.
 * Caching might be desired but needs careful invalidation after updates.
 */
export const getWeeklyProgress = async (params: GetWeeklyProgressRequest): Promise<CacheResult<GetWeeklyProgressResponse>> => {
    return apiClient.call<CacheResult<GetWeeklyProgressResponse>, GetWeeklyProgressRequest>(
        getWeeklyProgressApiName,
        params,
        { disableCache: true } // Ensure we always get the latest progress
    );
};

/**
 * Task 27 (Client): Update set completion status.
 * Always bypass cache as this modifies data.
 */
export const updateSetCompletion = async (params: UpdateSetCompletionRequest): Promise<CacheResult<UpdateSetCompletionResponse>> => {
    return apiClient.call<CacheResult<UpdateSetCompletionResponse>, UpdateSetCompletionRequest>(
        updateSetCompletionApiName,
        params,
        { disableCache: true } // Ensure no caching for updates
    );
};

// --- Weekly Notes --- //

/**
 * Task 28 (Client): Add a weekly note.
 */
export const addWeeklyNote = async (params: AddWeeklyNoteRequest): Promise<CacheResult<AddWeeklyNoteResponse>> => {
    return apiClient.call<CacheResult<AddWeeklyNoteResponse>, AddWeeklyNoteRequest>(
        addWeeklyNoteApiName,
        params,
        { disableCache: true } // Disable cache as it modifies data
    );
};

/**
 * Task 28 (Client): Edit a weekly note.
 */
export const editWeeklyNote = async (params: EditWeeklyNoteRequest): Promise<CacheResult<EditWeeklyNoteResponse>> => {
    return apiClient.call<CacheResult<EditWeeklyNoteResponse>, EditWeeklyNoteRequest>(
        editWeeklyNoteApiName,
        params,
        { disableCache: true } // Disable cache as it modifies data
    );
};

/**
 * Task 28 (Client): Delete a weekly note.
 */
export const deleteWeeklyNote = async (params: DeleteWeeklyNoteRequest): Promise<CacheResult<DeleteWeeklyNoteResponse>> => {
    return apiClient.call<CacheResult<DeleteWeeklyNoteResponse>, DeleteWeeklyNoteRequest>(
        deleteWeeklyNoteApiName,
        params,
        { disableCache: true } // Disable cache as it modifies data
    );
}; 