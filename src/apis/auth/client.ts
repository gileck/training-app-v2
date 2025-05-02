import type { CacheResult } from "@/server/cache/types"; // Corrected path
import apiClient from "@/client/utils/apiClient"; // Corrected path
import {
    registerApiName,
    loginApiName,
    logoutApiName,
    getCurrentUserApiName
} from "./index"; // Import names from index (safe)
import type {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    GetCurrentUserResponse
} from "./types";

/**
 * Task 11 (Client): Call registration API
 */
export const register = async (request: RegisterRequest): Promise<CacheResult<RegisterResponse>> => {
    return apiClient.call<CacheResult<RegisterResponse>, RegisterRequest>(
        registerApiName,
        request
    );
};

/**
 * Task 12 (Client): Call login API
 */
export const login = async (request: LoginRequest): Promise<CacheResult<LoginResponse>> => {
    return apiClient.call<CacheResult<LoginResponse>, LoginRequest>(
        loginApiName,
        request
    );
};

/**
 * Task 14 (Client): Call get current user API
 */
export const fetchCurrentUser = async (): Promise<CacheResult<GetCurrentUserResponse>> => {
    // No request body needed for 'me' endpoint
    return apiClient.call<CacheResult<GetCurrentUserResponse>, {}>(
        getCurrentUserApiName,
        {}
    );
};

/**
 * Client: Call logout API
 */
export const logout = async (): Promise<CacheResult<{ success: boolean }>> => {
    return apiClient.call<CacheResult<{ success: boolean }>, {}>(
        logoutApiName,
        {}
    );
}; 