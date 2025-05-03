import React from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Alert,
    Stack,
    Chip,
    Checkbox,
    SxProps,
    Theme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import Image from 'next/image';

import { WorkoutViewProps, WorkoutExerciseItemProps, WeekNavigatorProps, LoadingErrorDisplayProps } from '../types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../../hooks/useExerciseSetCompletion';

// --- Retro Theme Colors --- //
const RETRO_BACKGROUND = '#000a12';
const RETRO_BOX = '#001a2c';
const RETRO_PRIMARY = '#00ff00';
const RETRO_SECONDARY = '#ff00ff';
const RETRO_ACCENT = '#00ffff';
const RETRO_ERROR = '#ff0000';

// Custom pixel-styled components
interface PixelBorderProps {
    children: React.ReactNode;
    color?: string;
    sx?: SxProps<Theme>;
    onClick?: () => void;
}

const PixelBorder: React.FC<PixelBorderProps> = ({ children, color = RETRO_PRIMARY, sx, onClick }) => (
    <Box
        sx={{
            position: 'relative',
            p: 1.5,
            bgcolor: RETRO_BOX,
            color: 'white',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderStyle: 'solid',
                borderWidth: '3px',
                borderImageSource: `
                    linear-gradient(
                        to bottom right, 
                        ${color}, 
                        transparent 50%
                    )
                `,
                borderImageSlice: '3',
                borderImageWidth: '3px',
                borderImageOutset: '0',
                borderImageRepeat: 'stretch',
                pointerEvents: 'none',
            },
            ...sx
        }}
        onClick={onClick}
    >
        {children}
    </Box>
);

interface PixelButtonProps {
    children: React.ReactNode;
    color?: string;
    sx?: SxProps<Theme>;
    onClick?: () => void;
    disabled?: boolean;
    fullWidth?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
}

const PixelButton: React.FC<PixelButtonProps> = ({
    children,
    color = RETRO_PRIMARY,
    sx,
    onClick,
    disabled,
    fullWidth,
    startIcon,
    endIcon
}) => (
    <Button
        sx={{
            bgcolor: '#000',
            color: color,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '0.75rem',
            padding: '8px 16px',
            border: `2px solid ${color}`,
            borderRadius: 0,
            textTransform: 'none',
            position: 'relative',
            transition: 'all 0.1s',
            minWidth: fullWidth ? '100%' : 'auto',

            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `linear-gradient(to bottom, ${color}20, transparent)`,
                opacity: 0.5,
            },

            '&:hover': {
                bgcolor: color,
                color: '#000',
                '&::before': {
                    opacity: 0,
                }
            },

            '&.Mui-disabled': {
                opacity: 0.5,
                color: `${color}90`,
                border: `2px solid ${color}50`,
            },
            ...sx
        }}
        onClick={onClick}
        disabled={disabled}
        fullWidth={fullWidth}
        startIcon={startIcon}
        endIcon={endIcon}
    >
        {children}
    </Button>
);

// --- Sub Components --- //

const LoadingErrorDisplay = ({ isLoading, error }: LoadingErrorDisplayProps) => {
    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: RETRO_PRIMARY }} />
        </Box>
    );
    if (error) return (
        <Alert
            severity="error"
            sx={{
                my: 2,
                bgcolor: 'transparent',
                color: RETRO_ERROR,
                border: `2px solid ${RETRO_ERROR}`,
                borderRadius: 0,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '0.75rem',
                '& .MuiAlert-icon': {
                    color: RETRO_ERROR
                }
            }}
        >
            {error}
        </Alert>
    );
    return null;
};

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentWeek, maxWeeks, onNavigate }) => {
    return (
        <PixelBorder sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton
                onClick={() => onNavigate(currentWeek - 1)}
                disabled={currentWeek <= 1}
                sx={{ color: RETRO_PRIMARY }}
            >
                <ArrowBackIcon />
            </IconButton>

            <Typography sx={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '0.875rem',
                color: RETRO_PRIMARY,
                textAlign: 'center'
            }}>
                WEEK {currentWeek}-{maxWeeks}
            </Typography>

            <IconButton
                onClick={() => onNavigate(currentWeek + 1)}
                disabled={currentWeek >= maxWeeks}
                sx={{ color: RETRO_PRIMARY }}
            >
                <ArrowForwardIcon />
            </IconButton>
        </PixelBorder>
    );
};

const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
    exercise,
    planId,
    weekNumber,
    onSetComplete,
    showSelectionMode,
    selectedExercises,
    handleExerciseSelect
}) => {
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const setsDone = exercise.progress?.setsCompleted || 0;
    const totalSets = exercise.sets;
    const isExerciseComplete = setsDone >= totalSets;
    const exerciseId = exercise._id.toString();

    const { isUpdating, handleSetCheckboxClick, handleCompleteAllSets } = useExerciseSetCompletion(
        planId,
        weekNumber,
        onSetComplete
    );

    const handleOpenDetailModal = () => setIsDetailModalOpen(true);
    const handleCloseDetailModal = () => setIsDetailModalOpen(false);

    // Calculate percent for progress bar
    const progressPercent = (setsDone / totalSets) * 100;

    // Get color based on completion
    const getItemColor = () => {
        if (isExerciseComplete) return RETRO_PRIMARY;
        if (progressPercent > 0) return RETRO_ACCENT;
        return RETRO_SECONDARY;
    };

    const itemColor = getItemColor();

    return (
        <>
            <PixelBorder
                color={itemColor}
                sx={{
                    mb: 3,
                    position: 'relative',
                    animation: isExerciseComplete ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                        '0%': { boxShadow: '0 0 0 0 rgba(0, 255, 0, 0.3)' },
                        '70%': { boxShadow: '0 0 0 10px rgba(0, 255, 0, 0)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(0, 255, 0, 0)' },
                    }
                }}
            >
                {/* Header with name and completion status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Typography sx={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.75rem',
                        color: itemColor
                    }}>
                        {exercise.name || `EX_${exercise._id}`}
                    </Typography>

                    {showSelectionMode ? (
                        <Checkbox
                            checked={selectedExercises.includes(exerciseId)}
                            onChange={() => handleExerciseSelect(exerciseId)}
                            sx={{
                                color: RETRO_SECONDARY,
                                '&.Mui-checked': {
                                    color: RETRO_PRIMARY
                                }
                            }}
                        />
                    ) : (
                        isExerciseComplete && (
                            <Box sx={{ color: RETRO_PRIMARY, display: 'flex', alignItems: 'center' }}>
                                <Typography
                                    sx={{
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.6rem',
                                        mr: 0.5
                                    }}
                                >
                                    COMPLETE
                                </Typography>
                                <CheckCircleIcon fontSize="small" />
                            </Box>
                        )
                    )}
                </Box>

                {/* Progress bar */}
                <Box sx={{ position: 'relative', height: 10, mb: 2, bgcolor: '#011221', border: `1px solid ${itemColor}` }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 1,
                            left: 1,
                            height: 'calc(100% - 2px)',
                            width: `calc(${progressPercent}% - 2px)`,
                            bgcolor: itemColor,
                            backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.2) 50%)',
                            backgroundSize: '10px 10px',
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Left: Image */}
                    <Box
                        sx={{
                            width: 70,
                            height: 70,
                            position: 'relative',
                            border: `2px solid ${itemColor}`,
                            bgcolor: RETRO_BOX,
                            flexShrink: 0,
                            padding: '2px',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)',
                                pointerEvents: 'none',
                            }
                        }}
                    >
                        {exercise.definition?.imageUrl ? (
                            <Image
                                src={exercise.definition.imageUrl}
                                alt={exercise.name || 'Exercise'}
                                fill
                                style={{
                                    objectFit: 'contain',
                                    filter: 'grayscale(0.5) brightness(1.2) contrast(1.2)'
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: RETRO_BOX
                                }}
                            >
                                <VideogameAssetIcon sx={{ color: itemColor }} />
                            </Box>
                        )}
                    </Box>

                    {/* Right: Details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                color: 'white',
                                fontFamily: "'Press Start 2P', monospace",
                                fontSize: '0.7rem',
                                mb: 1
                            }}
                        >
                            SETS: {setsDone}/{totalSets}
                        </Typography>

                        <Typography
                            sx={{
                                color: 'white',
                                fontFamily: "'Press Start 2P', monospace",
                                fontSize: '0.7rem',
                                mb: 1
                            }}
                        >
                            REPS: {exercise.reps}
                            {exercise.definition?.bodyWeight ? ' [BW]' : ''}
                            {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` [${exercise.weight}KG]`}
                        </Typography>

                        {/* Muscle tags */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {exercise.definition?.primaryMuscle && (
                                <Chip
                                    label={exercise.definition.primaryMuscle}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        bgcolor: 'transparent',
                                        color: RETRO_PRIMARY,
                                        border: `1px solid ${RETRO_PRIMARY}`,
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.5rem',
                                        borderRadius: 0
                                    }}
                                />
                            )}
                            {exercise.definition?.secondaryMuscles?.slice(0, 1).map((muscle, index) => (
                                <Chip
                                    key={index}
                                    label={muscle}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        bgcolor: 'transparent',
                                        color: RETRO_ACCENT,
                                        border: `1px solid ${RETRO_ACCENT}`,
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.5rem',
                                        borderRadius: 0
                                    }}
                                />
                            ))}
                            {exercise.definition?.hasComments && (
                                <Chip
                                    label="INFO"
                                    size="small"
                                    sx={{
                                        height: 22,
                                        bgcolor: 'transparent',
                                        color: RETRO_SECONDARY,
                                        border: `1px solid ${RETRO_SECONDARY}`,
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.5rem',
                                        borderRadius: 0
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                        onClick={handleOpenDetailModal}
                        sx={{
                            color: RETRO_ACCENT,
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.7rem',
                            minWidth: 'auto',
                            p: 0,
                            '&:hover': {
                                bgcolor: 'transparent',
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                        INFO
                    </Button>

                    <Stack direction="row" spacing={1}>
                        <IconButton
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone - 2, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone <= 0}
                            sx={{
                                color: 'white',
                                border: '1px solid white',
                                borderRadius: 0,
                                p: '3px',
                                '&.Mui-disabled': {
                                    color: 'rgba(255,255,255,0.3)',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }
                            }}
                        >
                            <RemoveIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone >= totalSets}
                            sx={{
                                color: itemColor,
                                border: `1px solid ${itemColor}`,
                                borderRadius: 0,
                                p: '3px',
                                '&.Mui-disabled': {
                                    color: `${itemColor}50`,
                                    border: `1px solid ${itemColor}50`
                                }
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handleCompleteAllSets(exerciseId, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone >= totalSets}
                            sx={{
                                color: RETRO_PRIMARY,
                                border: `1px solid ${RETRO_PRIMARY}`,
                                borderRadius: 0,
                                p: '3px',
                                '&.Mui-disabled': {
                                    color: `${RETRO_PRIMARY}50`,
                                    border: `1px solid ${RETRO_PRIMARY}50`
                                }
                            }}
                        >
                            <DoneAllIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </PixelBorder>

            <ExerciseDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                exercise={exercise}
                planId={planId}
                weekNumber={weekNumber}
            />
        </>
    );
};

// Main Component
export const RetroWorkoutView: React.FC<WorkoutViewProps> = ({
    planId,
    weekNumber,
    planDetails,
    isLoading,
    error,
    activeExercises,
    completedExercises,
    showCompleted,
    selectedExercises,
    showSelectionMode,
    progressPercentage,
    totalExercises,
    completedExercisesCount,

    navigate,
    handleSetCompletionUpdate,
    handleExerciseSelect,
    handleStartSelectionMode,
    handleCancelSelectionMode,
    handleStartWorkout,
    toggleShowCompleted,
    handleNavigateWeek
}) => {
    if (isLoading) {
        return (
            <Box sx={{ bgcolor: RETRO_BACKGROUND, color: 'white', minHeight: '100vh', p: { xs: 2, sm: 3 } }}>
                <LoadingErrorDisplay isLoading={true} error={null} />
            </Box>
        );
    }

    if (!planId) {
        return (
            <Box sx={{ bgcolor: RETRO_BACKGROUND, color: 'white', minHeight: '100vh', p: { xs: 2, sm: 3 } }}>
                <Typography sx={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '1rem',
                    color: RETRO_ERROR,
                    mb: 2
                }}>
                    NO TRAINING PLAN SELECTED
                </Typography>
                <Typography sx={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.75rem',
                    color: 'white',
                    mb: 3
                }}>
                    {error || "PLEASE SELECT A TRAINING PLAN"}
                </Typography>
                <PixelButton
                    color={RETRO_PRIMARY}
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                >
                    GO TO PLANS
                </PixelButton>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ bgcolor: RETRO_BACKGROUND, color: 'white', minHeight: '100vh', p: { xs: 2, sm: 3 } }}>
                <Typography sx={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '1rem',
                    color: RETRO_PRIMARY,
                    mb: 2
                }}>
                    {planDetails?.name || `PLAN_${planId}`} - WEEK {weekNumber}
                </Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
                <PixelButton
                    color={RETRO_PRIMARY}
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mt: 2 }}
                >
                    BACK TO PLANS
                </PixelButton>
            </Box>
        );
    }

    if (!planDetails) {
        return (
            <Box sx={{ bgcolor: RETRO_BACKGROUND, color: 'white', minHeight: '100vh', p: { xs: 2, sm: 3 } }}>
                <Typography sx={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.75rem'
                }}>
                    PLAN DETAILS COULD NOT BE LOADED.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            bgcolor: RETRO_BACKGROUND,
            color: 'white',
            minHeight: '100vh',
            p: { xs: 2, sm: 3 },
            overflowX: 'hidden'
        }}>
            {/* Header */}
            <Box
                sx={{
                    mb: 3,
                    textAlign: 'center',
                    animation: 'flicker 2s infinite alternate'
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        color: RETRO_PRIMARY,
                        textShadow: `0 0 5px ${RETRO_PRIMARY}, 0 0 10px ${RETRO_PRIMARY}`,
                        mb: 1
                    }}
                >
                    {planDetails.name.toUpperCase()}
                </Typography>

                <Typography
                    sx={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.7rem',
                        color: RETRO_SECONDARY,
                        mb: 2
                    }}
                >
                    TRAINING PROGRAM v1.0
                </Typography>

                <Box sx={{
                    position: 'relative',
                    height: 4,
                    bgcolor: '#001a2c',
                    width: '80%',
                    mx: 'auto',
                    mb: 3
                }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${progressPercentage}%`,
                            bgcolor: RETRO_PRIMARY,
                            backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.2) 50%)',
                            backgroundSize: '10px 10px',
                            animation: 'progress-bar-scroll 20s linear infinite',
                            '@keyframes progress-bar-scroll': {
                                '0%': { backgroundPosition: '0 0' },
                                '100%': { backgroundPosition: '100px 0' }
                            }
                        }}
                    />
                </Box>

                <Typography
                    sx={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.75rem',
                        color: progressPercentage === 100 ? RETRO_PRIMARY : 'white'
                    }}
                >
                    PROGRESS: {completedExercisesCount}/{totalExercises} [{progressPercentage.toFixed(0)}%]
                </Typography>
            </Box>

            <WeekNavigator
                currentWeek={weekNumber}
                maxWeeks={planDetails.durationWeeks}
                onNavigate={handleNavigateWeek}
            />

            {/* Workout actions */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.75rem',
                    color: RETRO_ACCENT
                }}>
                    EXERCISES:
                </Typography>

                {!showSelectionMode ? (
                    <PixelButton
                        color={RETRO_SECONDARY}
                        onClick={handleStartSelectionMode}
                    >
                        CREATE WORKOUT
                    </PixelButton>
                ) : (
                    <Stack direction="row" spacing={1}>
                        <PixelButton
                            color={RETRO_PRIMARY}
                            onClick={handleStartWorkout}
                            disabled={selectedExercises.length === 0}
                        >
                            START [{selectedExercises.length}]
                        </PixelButton>
                        <PixelButton
                            color={RETRO_ERROR}
                            onClick={handleCancelSelectionMode}
                        >
                            CANCEL
                        </PixelButton>
                    </Stack>
                )}
            </Box>

            {/* Exercises list */}
            {activeExercises.length === 0 && completedExercises.length === 0 ? (
                <PixelBorder color={RETRO_ERROR}>
                    <Typography
                        sx={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            color: RETRO_ERROR
                        }}
                    >
                        NO EXERCISES FOUND
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            color: 'white',
                            mt: 1
                        }}
                    >
                        GAME OVER
                    </Typography>
                </PixelBorder>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    {activeExercises.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                sx={{
                                    fontFamily: "'Press Start 2P', monospace",
                                    fontSize: '0.75rem',
                                    color: RETRO_ACCENT,
                                    mb: 2,
                                    textShadow: `0 0 5px ${RETRO_ACCENT}`
                                }}
                            >
                                ACTIVE QUESTS:
                            </Typography>
                            {activeExercises.map((exercise) => (
                                <WorkoutExerciseItem
                                    key={exercise._id.toString()}
                                    exercise={exercise}
                                    planId={planId}
                                    weekNumber={weekNumber}
                                    onSetComplete={handleSetCompletionUpdate}
                                    showSelectionMode={showSelectionMode}
                                    selectedExercises={selectedExercises}
                                    handleExerciseSelect={handleExerciseSelect}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Completed Exercises */}
                    {completedExercises.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <PixelButton
                                onClick={toggleShowCompleted}
                                fullWidth
                                color={RETRO_PRIMARY}
                                sx={{
                                    justifyContent: 'space-between',
                                    mb: 2
                                }}
                                endIcon={showCompleted ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            >
                                COMPLETED QUESTS [{completedExercises.length}]
                            </PixelButton>

                            {showCompleted && (
                                <Box>
                                    {completedExercises.map((exercise) => (
                                        <WorkoutExerciseItem
                                            key={exercise._id.toString()}
                                            exercise={exercise}
                                            planId={planId}
                                            weekNumber={weekNumber}
                                            onSetComplete={handleSetCompletionUpdate}
                                            showSelectionMode={showSelectionMode}
                                            selectedExercises={selectedExercises}
                                            handleExerciseSelect={handleExerciseSelect}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {/* Selected exercises summary */}
            {showSelectionMode && selectedExercises.length > 0 && (
                <PixelBorder
                    color={RETRO_SECONDARY}
                    sx={{
                        mt: 3,
                        position: 'sticky',
                        bottom: 16,
                        zIndex: 10,
                        boxShadow: `0 0 15px ${RETRO_SECONDARY}`,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.75rem',
                            mb: 2,
                            color: RETRO_SECONDARY
                        }}
                    >
                        SELECTED: {selectedExercises.length}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {selectedExercises.map((exerciseId) => {
                            const exercise = [...activeExercises, ...completedExercises].find(e =>
                                e._id.toString() === exerciseId
                            );
                            return (
                                <Chip
                                    key={exerciseId}
                                    label={exercise?.name || exerciseId}
                                    onDelete={() => handleExerciseSelect(exerciseId)}
                                    sx={{
                                        borderRadius: 0,
                                        bgcolor: 'transparent',
                                        border: `1px solid ${RETRO_SECONDARY}`,
                                        color: RETRO_SECONDARY,
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.6rem',
                                        height: 'auto',
                                        py: 0.5,
                                        '& .MuiChip-deleteIcon': {
                                            color: RETRO_SECONDARY,
                                            '&:hover': {
                                                color: RETRO_ERROR
                                            }
                                        }
                                    }}
                                />
                            );
                        })}
                    </Box>

                    <PixelButton
                        color={RETRO_PRIMARY}
                        onClick={handleStartWorkout}
                        fullWidth
                    >
                        START WORKOUT
                    </PixelButton>
                </PixelBorder>
            )}

            {/* Custom Footer */}
            <Box sx={{ mt: 5, textAlign: 'center' }}>
                <Typography
                    sx={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.5)'
                    }}
                >
                    © 2023 RETRO FITNESS v1.0
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.5)',
                        mt: 0.5
                    }}
                >
                    PRESS START TO BEGIN
                </Typography>
            </Box>
        </Box>
    );
}; 