import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import {
    login as apiLogin,
    register as apiRegister,
    fetchCurrentUser as apiFetchCurrentUser,
    logout as apiLogout
} from '@/apis/auth/client'; // Assuming correct path alias
import type {
    User,
    LoginRequest,
    RegisterRequest
} from '@/apis/auth/types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<boolean>;
    register: (details: RegisterRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
    const [error, setError] = useState<string | null>(null);

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiFetchCurrentUser();
            if (response.data?.user) {
                setUser(response.data.user);
            } else {
                setUser(null);
                // Don't set an error here, just means not logged in
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            setUser(null);
            // Optionally set an error state if the API call itself fails
            // setError("Failed to check authentication status.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check auth status on initial load
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiLogin(credentials);
            if (response.data?.user) {
                setUser(response.data.user);
                setIsLoading(false);
                return true;
            } else {
                setError(response.data?.error || 'Login failed. Please check credentials.');
                setUser(null);
                setIsLoading(false);
                return false;
            }
        } catch (err: unknown) {
            console.error("Login error:", err);
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
            setError(message);
            setUser(null);
            setIsLoading(false);
            return false;
        }
    }, []);

    const register = useCallback(async (details: RegisterRequest): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiRegister(details);
            if (response.data?.user) {
                // Automatically log in user after successful registration
                // Or potentially just set user state if login required separately
                setUser(response.data.user);
                // Optional: call login or rely on cookie being set by potential future register+login flow
                await checkAuthStatus(); // Re-check auth which relies on cookie
                setIsLoading(false);
                return true;
            } else {
                setError(response.data?.error || 'Registration failed.');
                setUser(null);
                setIsLoading(false);
                return false;
            }
        } catch (err: unknown) {
            console.error("Registration error:", err);
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during registration.';
            setError(message);
            setUser(null);
            setIsLoading(false);
            return false;
        }
    }, [checkAuthStatus]);

    const logout = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await apiLogout();
        } catch (err) {
            console.error("Logout error:", err);
            // Even if API call fails, clear user state
        } finally {
            setUser(null);
            setIsLoading(false);
            // Optionally clear other app state here
        }
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 