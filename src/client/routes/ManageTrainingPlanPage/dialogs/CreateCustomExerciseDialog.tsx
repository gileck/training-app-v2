import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Alert,
    CircularProgress,
    Box,
    Tabs,
    Tab,
    Chip,
    OutlinedInput,
    SelectChangeEvent,
    LinearProgress,
    Typography,
} from '@mui/material';
import { createExerciseDefinition } from '@/apis/exerciseDefinitions/client';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';

interface CreateCustomExerciseDialogProps {
    open: boolean;
    onClose: () => void;
    onExerciseCreated: (definition: ExerciseDefinition) => void;
}

// Predefined muscle groups
const MUSCLE_GROUPS = [
    'Chest',
    'Back',
    'Legs',
    'Shoulders',
    'Arms',
    'Biceps',
    'Triceps',
    'Core',
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Forearms',
    'Abs',
];

// Predefined exercise types
const EXERCISE_TYPES = [
    'Upper body',
    'Legs',
    'Core',
    'Cardio',
    'Full Body',
];

export const CreateCustomExerciseDialog: React.FC<CreateCustomExerciseDialogProps> = ({
    open,
    onClose,
    onExerciseCreated,
}) => {
    const [name, setName] = useState('');
    const [primaryMuscle, setPrimaryMuscle] = useState('');
    const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
    const [type, setType] = useState('');
    const [bodyWeight, setBodyWeight] = useState(false);
    const [isStatic, setIsStatic] = useState(false);
    const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [pasteHint, setPasteHint] = useState<boolean>(false);
    
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleSecondaryMusclesChange = (event: SelectChangeEvent<typeof secondaryMuscles>) => {
        const value = event.target.value;
        setSecondaryMuscles(typeof value === 'string' ? value.split(',') : value);
    };

    // Handle pasted images (Cmd+V)
    // Wrapped in useCallback to prevent stale closures in event handlers
    const handlePastedImage = useCallback((file: File) => {
        setError(null);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Pasted content is not a valid image');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image file size must be less than 5MB. Please select a smaller image.');
            return;
        }
        
        // Validate minimum file size (1KB)
        if (file.size < 1024) {
            setError('Image file is too small. Please select a valid image.');
            return;
        }

        setImageFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Auto-switch to upload tab
        setImageTab('upload');
        setPasteHint(false);
    }, []); // No dependencies needed - all state setters are stable

    // Handle paste events
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Only handle paste when dialog is open
            if (!open) return;
            
            const items = e.clipboardData?.items;
            if (!items) return;

            // Look for image in clipboard
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (file) {
                        handlePastedImage(file);
                    }
                    break;
                }
            }
        };

        if (open) {
            document.addEventListener('paste', handlePaste);
            return () => {
                document.removeEventListener('paste', handlePaste);
            };
        }
    }, [open, handlePastedImage]); // Include handlePastedImage in dependencies

    // Show paste hint when dialog opens on upload tab
    useEffect(() => {
        if (open && imageTab === 'upload' && !imageFile) {
            setPasteHint(true);
        } else {
            setPasteHint(false);
        }
    }, [open, imageTab, imageFile]);

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null); // Clear previous errors
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image file size must be less than 5MB. Please select a smaller image.');
                return;
            }
            
            // Validate minimum file size (1KB)
            if (file.size < 1024) {
                setError('Image file is too small. Please select a valid image.');
                return;
            }

            setImageFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setUploadProgress(0);
        setUploadStatus('');

        // Validation
        if (!name.trim()) {
            setError('Exercise name is required and cannot be empty');
            return;
        }

        if (!primaryMuscle) {
            setError('Please select a primary muscle group');
            return;
        }

        if (!type) {
            setError('Please select an exercise type');
            return;
        }
        
        // Validate image URL if provided
        if (imageTab === 'url' && imageUrl.trim()) {
            try {
                new URL(imageUrl);
            } catch {
                setError('Invalid image URL. Please provide a valid URL or upload an image.');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            let imageFileBase64: string | undefined;
            let fileName: string | undefined;

            // Handle image upload
            if (imageTab === 'upload' && imageFile) {
                setUploadStatus('Preparing image...');
                setUploadProgress(10);
                
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        // Remove data URL prefix (e.g., "data:image/png;base64,")
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = () => reject(new Error('Failed to read image file'));
                });
                
                reader.readAsDataURL(imageFile);
                imageFileBase64 = await base64Promise;
                fileName = `custom-exercise-${Date.now()}-${imageFile.name}`;
                
                setUploadProgress(30);
                setUploadStatus('Uploading image...');
            } else if (imageTab === 'url') {
                setUploadStatus('Validating...');
                setUploadProgress(20);
            } else {
                setUploadProgress(20);
            }

            setUploadStatus('Creating exercise...');
            setUploadProgress(imageTab === 'upload' && imageFile ? 50 : 40);

            const result = await createExerciseDefinition({
                name: name.trim(),
                primaryMuscle,
                secondaryMuscles,
                type,
                bodyWeight,
                static: isStatic,
                imageUrl: imageTab === 'url' && imageUrl.trim() ? imageUrl.trim() : undefined,
                imageFile: imageFileBase64,
                imageFileName: fileName,
            });

            setUploadProgress(90);
            setUploadStatus('Finalizing...');

            // Check for API errors
            if (result.data?.error) {
                setError(result.data.error);
                setUploadProgress(0);
                setUploadStatus('');
                return;
            }

            if (result.data?.definition) {
                setUploadProgress(100);
                setUploadStatus('Success!');
                
                // Small delay to show success message
                await new Promise(resolve => setTimeout(resolve, 300));
                
                onExerciseCreated(result.data.definition);
                handleClose();
            } else {
                setError('Failed to create custom exercise. Please try again.');
                setUploadProgress(0);
                setUploadStatus('');
            }
        } catch (err) {
            console.error('Error creating custom exercise:', err);
            
            // Handle network or unexpected errors
            if (err instanceof Error) {
                setError(err.message || 'An unexpected error occurred. Please try again.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            
            setUploadProgress(0);
            setUploadStatus('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) {
            return; // Prevent closing while submitting
        }
        
        // Reset form
        setName('');
        setPrimaryMuscle('');
        setSecondaryMuscles([]);
        setType('');
        setBodyWeight(false);
        setIsStatic(false);
        setImageTab('url');
        setImageUrl('');
        setImageFile(null);
        setImagePreview('');
        setError(null);
        setUploadProgress(0);
        setUploadStatus('');
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            ref={dialogRef}
        >
            <DialogTitle>Create Custom Exercise</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {isSubmitting && uploadProgress > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ flex: 1, mr: 1 }}>
                                    <LinearProgress variant="determinate" value={uploadProgress} />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {uploadProgress}%
                                </Typography>
                            </Box>
                            {uploadStatus && (
                                <Typography variant="caption" color="text.secondary">
                                    {uploadStatus}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        label="Exercise Name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(null); }}
                        required
                        sx={{ mb: 2 }}
                        disabled={isSubmitting}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }} required>
                        <InputLabel>Primary Muscle</InputLabel>
                        <Select
                            value={primaryMuscle}
                            onChange={(e) => { setPrimaryMuscle(e.target.value); setError(null); }}
                            label="Primary Muscle"
                            disabled={isSubmitting}
                        >
                            {MUSCLE_GROUPS.map((muscle) => (
                                <MenuItem key={muscle} value={muscle}>
                                    {muscle}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Secondary Muscles</InputLabel>
                        <Select
                            multiple
                            value={secondaryMuscles}
                            onChange={handleSecondaryMusclesChange}
                            input={<OutlinedInput label="Secondary Muscles" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                            disabled={isSubmitting}
                        >
                            {MUSCLE_GROUPS.filter((m) => m !== primaryMuscle).map((muscle) => (
                                <MenuItem key={muscle} value={muscle}>
                                    <Checkbox checked={secondaryMuscles.indexOf(muscle) > -1} />
                                    {muscle}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }} required>
                        <InputLabel>Exercise Type</InputLabel>
                        <Select
                            value={type}
                            onChange={(e) => { setType(e.target.value); setError(null); }}
                            label="Exercise Type"
                            disabled={isSubmitting}
                        >
                            {EXERCISE_TYPES.map((exerciseType) => (
                                <MenuItem key={exerciseType} value={exerciseType}>
                                    {exerciseType}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={bodyWeight}
                                    onChange={(e) => setBodyWeight(e.target.checked)}
                                    disabled={isSubmitting}
                                />
                            }
                            label="Bodyweight Exercise"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isStatic}
                                    onChange={(e) => setIsStatic(e.target.checked)}
                                    disabled={isSubmitting}
                                />
                            }
                            label="Static Exercise (e.g., plank)"
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Tabs
                            value={imageTab}
                            onChange={(_, newValue) => setImageTab(newValue)}
                            sx={{ mb: 2 }}
                        >
                            <Tab label="Image URL" value="url" disabled={isSubmitting} />
                            <Tab label="Upload Image" value="upload" disabled={isSubmitting} />
                        </Tabs>

                        {imageTab === 'url' ? (
                            <TextField
                                fullWidth
                                label="Image URL"
                                value={imageUrl}
                                onChange={(e) => { setImageUrl(e.target.value); setError(null); }}
                                placeholder="https://example.com/image.jpg"
                                disabled={isSubmitting}
                                helperText="Paste a direct link to an image (optional)"
                            />
                        ) : (
                            <Box>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    disabled={isSubmitting}
                                    fullWidth
                                >
                                    {imageFile ? 'Change Image' : 'Select Image'}
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                    />
                                </Button>
                                
                                {pasteHint && !imagePreview && (
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            display: 'block', 
                                            mt: 1, 
                                            textAlign: 'center',
                                            color: 'text.secondary',
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        💡 Tip: You can also paste an image with Cmd+V (or Ctrl+V)
                                    </Typography>
                                )}
                                
                                {imagePreview && (
                                    <Box sx={{ mt: 2, textAlign: 'center', position: 'relative', width: '100%', height: '200px' }}>
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            unoptimized
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Exercise'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

