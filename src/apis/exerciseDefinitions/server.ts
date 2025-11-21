import { ObjectId } from 'mongodb';
import { exerciseDefinitions } from '@/server/database/collections';
import { put } from '@vercel/blob';
import type { ApiHandlerContext } from '@/apis/types';

export * from './index';

import { name as baseName } from './index';
import type {
    GetAllExerciseDefinitionsResponse,
    GetExerciseDefinitionByIdRequestParams,
    GetExerciseDefinitionByIdResponse,
    ExerciseDefinition,
    CreateExerciseDefinitionRequest,
    CreateExerciseDefinitionResponse
} from './types';

export { baseName as name };

// Helper to map DB ExerciseDefinition to API ExerciseDefinition
function mapToApiExerciseDefinition(definition: exerciseDefinitions.ExerciseDefinition): ExerciseDefinition {
    return {
        _id: definition._id,
        userId: definition.userId,
        name: definition.name,
        primaryMuscle: definition.primaryMuscle,
        secondaryMuscles: definition.secondaryMuscles,
        bodyWeight: definition.bodyWeight,
        type: definition.type,
        static: definition.static,
        imageUrl: definition.imageUrl,
        createdAt: definition.createdAt || new Date(0), // Fallback for legacy data
        updatedAt: definition.updatedAt || new Date(0)  // Fallback for legacy data
    };
}

/**
 * Fetches all exercise definitions.
 * Now returns full ExerciseDefinition objects including user-specific exercises.
 * API name might still be exerciseDefinitions/getAllOptions for backward compatibility,
 * but the client-side function (e.g., in ExerciseFormDialog) should expect ExerciseDefinition[].
 */
export const processGetAllOptions = async (params: unknown, context: ApiHandlerContext): Promise<GetAllExerciseDefinitionsResponse> => {
    try {
        const { userId } = context;
        // This database layer function now returns both global and user-specific exercises
        const definitionsFromDb = await exerciseDefinitions.getAllExerciseDefinitionOptions(userId || null);

        // Map to ensure all fields align with the ExerciseDefinition type for the response.
        return definitionsFromDb.map(def => ({
            _id: def._id,
            userId: def.userId,
            name: def.name,
            imageUrl: def.imageUrl,
            primaryMuscle: def.primaryMuscle,
            secondaryMuscles: def.secondaryMuscles,
            bodyWeight: def.bodyWeight,
            type: def.type,
            static: def.static,
            createdAt: def.createdAt || new Date(0), // Fallback for legacy data
            updatedAt: def.updatedAt || new Date(0)  // Fallback for legacy data
        }));
    } catch (error) {
        console.error('Error fetching exercise definitions:', error);
        // Consider returning a structured error response instead of throwing directly
        // For now, rethrow as per existing pattern.
        throw new Error('Failed to fetch exercise definitions');
    }
};

/**
 * Fetches a single exercise definition by its ID.
 * Corresponds to API: exerciseDefinitions/getById
 */
export const processGetById = async (params: GetExerciseDefinitionByIdRequestParams): Promise<GetExerciseDefinitionByIdResponse> => {
    try {
        const { definitionId } = params;

        if (!definitionId || !ObjectId.isValid(definitionId)) {
            // Consider returning a structured error object instead of throwing
            throw new Error('Invalid Definition ID');
        }

        const definitionFromDb = await exerciseDefinitions.findExerciseDefinitionById(definitionId);

        if (!definitionFromDb) {
            // Consider returning a structured error or null as per GetExerciseDefinitionByIdResponse
            return null; // Matching GetExerciseDefinitionByIdResponse which allows null
        }

        return mapToApiExerciseDefinition(definitionFromDb);
    } catch (error) {
        console.error('Error fetching exercise definition:', error);
        // Consider returning a structured error response
        throw new Error(`Failed to fetch exercise definition: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Creates a new custom exercise definition for the current user
 * Corresponds to API: exerciseDefinitions/create
 */
export const processCreateExerciseDefinition = async (
    params: CreateExerciseDefinitionRequest,
    context: ApiHandlerContext
): Promise<CreateExerciseDefinitionResponse> => {
    try {
        const { userId } = context;

        if (!userId) {
            return { error: 'You must be logged in to create custom exercises. Please log in and try again.' };
        }

        // Validate required fields
        if (!params.name || !params.name.trim()) {
            return { error: 'Exercise name is required and cannot be empty.' };
        }
        
        if (!params.primaryMuscle) {
            return { error: 'Please select a primary muscle group.' };
        }
        
        if (!params.type) {
            return { error: 'Please select an exercise type.' };
        }

        // Validate imageUrl if provided
        if (params.imageUrl && params.imageUrl.trim()) {
            try {
                new URL(params.imageUrl);
            } catch {
                return { error: 'Invalid image URL format. Please provide a valid URL or upload an image instead.' };
            }
        }

        // Handle image upload if imageFile is provided
        let finalImageUrl = params.imageUrl || '';
        
        if (params.imageFile && params.imageFileName) {
            // Check for Vercel Blob token before attempting upload
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                return { 
                    error: 'Image upload is currently unavailable. Please use an image URL instead, or contact support if this issue persists.' 
                };
            }

            try {
                // Validate base64 string and convert to Buffer
                const base64Data = params.imageFile;
                
                // Validate base64 string format
                if (!base64Data || typeof base64Data !== 'string') {
                    return { error: 'Invalid image file data. Please try selecting the image again.' };
                }
                
                // Convert base64 to Buffer for binary data
                const imageBuffer = Buffer.from(base64Data, 'base64');
                
                // Validate file size (5MB limit)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (imageBuffer.length > maxSize) {
                    return { error: 'Image file is too large (maximum 5MB). Please select a smaller image.' };
                }
                
                // Validate minimum file size (1KB)
                if (imageBuffer.length < 1024) {
                    return { error: 'Image file is too small. Please select a valid image.' };
                }
                
                // Determine content type
                const contentType = params.imageFileName.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' :
                                   params.imageFileName.match(/\.png$/i) ? 'image/png' :
                                   params.imageFileName.match(/\.gif$/i) ? 'image/gif' :
                                   params.imageFileName.match(/\.webp$/i) ? 'image/webp' :
                                   'image/jpeg'; // default
                
                // Validate content type by checking image buffer headers
                const isValidImage = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 || // JPEG
                                    imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 || // PNG
                                    imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 || // GIF
                                    imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49;   // WEBP
                
                if (!isValidImage) {
                    return { error: 'Invalid image format. Please upload a JPEG, PNG, GIF, or WEBP image.' };
                }
                
                // Upload to Vercel Blob Storage
                // The blob is immediately available after upload with access: 'public'
                const blob = await put(params.imageFileName, imageBuffer, {
                    access: 'public',
                    contentType,
                    token: process.env.BLOB_READ_WRITE_TOKEN, // Explicitly pass token
                });
                
                // Get the public URL - this URL is immediately accessible
                finalImageUrl = blob.url;
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                
                // Provide user-friendly error messages
                if (uploadError instanceof Error) {
                    const message = uploadError.message.toLowerCase();
                    
                    if (message.includes('token') || message.includes('unauthorized')) {
                        return { error: 'Image upload is temporarily unavailable. Please use an image URL instead.' };
                    }
                    
                    if (message.includes('size') || message.includes('too large')) {
                        return { error: 'Image file is too large. Please select a smaller image (maximum 5MB).' };
                    }
                    
                    if (message.includes('format') || message.includes('type')) {
                        return { error: 'Invalid image format. Please upload a JPEG, PNG, GIF, or WEBP image.' };
                    }
                }
                
                return { error: 'Failed to upload image. Please try again or use an image URL instead.' };
            }
        }

        // Create the exercise definition
        const now = new Date();
        const newDefinition: exerciseDefinitions.ExerciseDefinitionCreate = {
            userId: new ObjectId(userId),
            name: params.name.trim(),
            imageUrl: finalImageUrl,
            primaryMuscle: params.primaryMuscle,
            secondaryMuscles: params.secondaryMuscles || [],
            bodyWeight: params.bodyWeight || false,
            type: params.type,
            static: params.static || false,
            createdAt: now,
            updatedAt: now
        };

        const createdDefinition = await exerciseDefinitions.insertExerciseDefinition(newDefinition);

        return { definition: mapToApiExerciseDefinition(createdDefinition) };
    } catch (error) {
        console.error('Error creating exercise definition:', error);
        
        // Handle specific database errors
        if (error instanceof Error) {
            const message = error.message;
            
            // Handle duplicate name error
            if (message.includes('already exists')) {
                return { error: message };
            }
            
            // Handle validation errors
            if (message.includes('validation') || message.includes('invalid')) {
                return { error: message };
            }
        }
        
        // Generic fallback error
        return { error: 'Failed to create custom exercise. Please try again or contact support if the issue persists.' };
    }
}; 