import React from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardMedia,
    CardActions,
    Chip,
    Paper,
    Divider,
    Tooltip,
    Stack,
    useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NotesIcon from '@mui/icons-material/Notes';
import TimerIcon from '@mui/icons-material/Timer';
import ScaleIcon from '@mui/icons-material/Scale';
import RepeatIcon from '@mui/icons-material/Repeat';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { ExerciseDefinition as ApiExerciseDefinitionMPE } from '@/apis/exerciseDefinitions/types';
import { GENERIC_IMAGE_PLACEHOLDER } from '../utils/constants';

interface ExerciseItemProps {
    exercise: ExerciseBase;
    definition: ApiExerciseDefinitionMPE | undefined;
    onRequestDelete: (exercise: ExerciseBase) => void;
    onEdit: (exercise: ExerciseBase) => void;
    onDuplicate: (exercise: ExerciseBase) => Promise<void>;
    isDeleting: boolean;
    isDuplicating: boolean;
}

export const ExerciseItemCard: React.FC<ExerciseItemProps> = ({ exercise, definition, onRequestDelete, onEdit, onDuplicate, isDeleting, isDuplicating }) => {
    const theme = useTheme();
    const exerciseName = definition?.name || `Exercise ID: ${exercise._id.toString()}`;
    const imageUrl = definition?.imageUrl || GENERIC_IMAGE_PLACEHOLDER;

    const handleDeleteClick = () => {
        onRequestDelete(exercise);
    };

    const handleEdit = () => {
        onEdit(exercise);
    };

    const handleDuplicate = async () => {
        await onDuplicate(exercise);
    };

    const renderDetail = (icon: React.ReactNode, label: string, value?: string | number | null) => {
        if (value === undefined || value === null || String(value).trim() === '') return null;
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                {icon}
                <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>{label}:</Typography>
                <Typography variant="body2" component="span">{String(value)}</Typography>
            </Box>
        );
    };

    return (
        <Paper data-testid="exercise-card" elevation={2} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
            <Card>
                <Stack direction="row" spacing={0}>
                    <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={exerciseName}
                        sx={{
                            width: { xs: 100, sm: 150 },
                            height: { xs: 120, sm: 'auto' },
                            minHeight: { sm: 150 },
                            objectFit: 'cover',
                            flexShrink: 0
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            (e.target as HTMLImageElement).src = GENERIC_IMAGE_PLACEHOLDER;
                        }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', p: { xs: 1.5, sm: 2 } }}>
                        <Typography variant="h6" component="div" gutterBottom noWrap sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {exerciseName}
                        </Typography>

                        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                            {renderDetail(<RepeatIcon fontSize="small" />, "Sets", exercise.sets)}
                            {renderDetail(<RepeatIcon fontSize="small" />, "Reps", exercise.reps)}
                            {renderDetail(<ScaleIcon fontSize="small" />, "Weight", exercise.weight ? `${exercise.weight}kg` : null)}
                            {renderDetail(<TimerIcon fontSize="small" />, "Duration", exercise.durationSeconds ? `${exercise.durationSeconds}s` : null)}
                        </Stack>

                        {definition && (definition.primaryMuscle || definition.secondaryMuscles?.length > 0) && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                    Muscle Groups:
                                </Typography>
                                <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                                    {definition.primaryMuscle && <Chip label={definition.primaryMuscle} size="small" color="primary" variant="filled" sx={{ fontSize: '0.65rem', height: '20px' }} />}
                                    {definition.secondaryMuscles?.slice(0, 2).map(muscle => (
                                        <Chip key={muscle} label={muscle} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: '20px' }} />
                                    ))}
                                    {(definition.secondaryMuscles?.length || 0) > 2 &&
                                        <Tooltip title={definition.secondaryMuscles?.slice(2).join(', ')}>
                                            <Chip label={`+${(definition.secondaryMuscles?.length || 0) - 2}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: '20px' }} />
                                        </Tooltip>
                                    }
                                </Stack>
                            </Box>
                        )}

                        {exercise.comments && (
                            <Tooltip title={exercise.comments} placement="top-start">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', cursor: 'default', mt: 'auto' }}>
                                    <NotesIcon fontSize="small" />
                                    <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 150, sm: 250 } }}>
                                        {exercise.comments}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                </Stack>

                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', p: 1, backgroundColor: theme.palette.action.hover, width: '100%' }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={handleEdit} disabled={isDeleting || isDuplicating} color="primary" title="Edit Exercise">
                        Edit
                    </Button>
                    <Button size="small" startIcon={<FileCopyIcon />} onClick={handleDuplicate} disabled={isDeleting || isDuplicating} title="Duplicate Exercise">
                        Duplicate
                    </Button>
                    <Button size="small" startIcon={<DeleteIcon />} onClick={handleDeleteClick} disabled={isDeleting || isDuplicating} color="error" title="Delete Exercise">
                        Delete
                    </Button>
                </CardActions>
            </Card>
        </Paper>
    );
}; 