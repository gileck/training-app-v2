import React from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    useTheme,
    useMediaQuery,
    Paper,
    Divider,
    Tabs,
    Tab,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    alpha,
    Collapse,
    Alert,
    Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';

import { useManageTrainingPlanPage } from './hooks/useManageTrainingPlanPage';
import { LoadingErrorDisplay } from './components/LoadingErrorDisplay';
import { ExerciseItemCard } from './components/ExerciseItemCard';
import { ExerciseFormDialog } from './dialogs/ExerciseFormDialog';
import { ExerciseDetailsDialog } from './dialogs/ExerciseDetailsDialog';
import { ConfirmDeleteDialog } from './dialogs/ConfirmDeleteDialog';
import { SavedWorkoutDeleteDialog } from './dialogs/SavedWorkoutDeleteDialog';
import { SavedWorkoutRenameDialog } from './dialogs/SavedWorkoutRenameDialog';
import { SavedWorkoutAddExerciseDialog } from './dialogs/SavedWorkoutAddExerciseDialog';
import { SavedWorkoutAddWorkoutDialog } from './dialogs/SavedWorkoutAddWorkoutDialog';

export const ManageTrainingPlanPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const {
        planId,
        navigate,
        currentTab,
        handleTabChange,
        isPageLoading,
        error,
        exercises,
        planDetails,
        definitionsMapMPE,
        existingExerciseDefinitionIdsInPlan,
        deletingExerciseId,
        duplicatingExerciseId,
        isExerciseBrowserOpen,
        handleOpenExerciseBrowser,
        handleBrowserDialogClose,
        isExerciseDetailsDialogOpen,
        selectedDefinitionForDetails,
        exerciseBeingEdited,
        handleOpenEditForm,
        handleExerciseSelectFromBrowser,
        handleDetailsDialogSave,
        handleDetailsDialogClose,
        isConfirmDeleteExerciseDialogOpen,
        exercisePendingDeletion,
        handleRequestDeleteExercise,
        handleConfirmDeleteExerciseDialogClose,
        executeDeleteExercise,
        handleDuplicateExercise,
        savedWorkout_workouts,
        savedWorkout_error,
        savedWorkout_successMessage,
        savedWorkout_setSuccessMessage,
        savedWorkout_deleteDialogOpen,
        savedWorkout_openDeleteDialog,
        savedWorkout_handleDeleteWorkout,
        savedWorkout_setDeleteDialogOpen,
        savedWorkout_renameDialogOpen,
        savedWorkout_openRenameDialog,
        savedWorkout_handleRenameWorkout,
        savedWorkout_setRenameDialogOpen,
        savedWorkout_workoutToRename,
        savedWorkout_newWorkoutName,
        savedWorkout_setNewWorkoutName,
        savedWorkout_isRenamingWorkoutId,
        savedWorkout_expandedWorkoutId,
        savedWorkout_handleToggleExpand,
        savedWorkout_exerciseDefinitionMap,
        savedWorkout_addExerciseDialogOpen,
        savedWorkout_handleOpenAddExerciseDialog,
        savedWorkout_handleCloseAddExerciseDialog,
        savedWorkout_workoutToAddExerciseTo,
        savedWorkout_searchTerm,
        savedWorkout_setSearchTerm,
        savedWorkout_isLoadingDialogExercises,
        savedWorkout_dialogPlanContextError,
        savedWorkout_filteredDefinitionsForDialog,
        savedWorkout_handleConfirmAddExercise,
        savedWorkout_isAddingSingleExercise,
        savedWorkout_handleRemoveExercise,
        savedWorkout_isRemovingExercise,
        savedWorkout_isAddWorkoutDialogOpen,
        savedWorkout_handleOpenAddWorkoutDialog,
        savedWorkout_handleCloseAddWorkoutDialog,
        savedWorkout_newWorkoutNameForAdd,
        savedWorkout_setNewWorkoutNameForAdd,
        savedWorkout_addWorkoutError,
        savedWorkout_handleConfirmAddNewWorkout,
    } = useManageTrainingPlanPage();

    const pageTitle = isPageLoading
        ? "Loading Plan Content..."
        : planDetails?.name
            ? `Manage: ${planDetails.name}`
            : error === 'Training plan not found.' || savedWorkout_error === 'Training Plan ID not found.'
                ? `Training Plan Not Found`
                : `Manage Plan: ${planId || 'Unknown'}`;

    if (!planId && !isPageLoading && currentTab === 0) {
        return (
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    {isMobile ? 'Back' : 'Back to Training Plans'}
                </Button>
                <Typography variant="h5" gutterBottom>Manage Plan Content</Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
            </Box>
        );
    }
    if (!planId && !isPageLoading && currentTab === 1) {
        return (
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                <Button onClick={() => navigate('/training-plans')} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                    {isMobile ? 'Back' : 'Back to Training Plans'}
                </Button>
                <Typography variant="h5" gutterBottom>Manage Plan Content</Typography>
                <LoadingErrorDisplay isLoading={false} error={savedWorkout_error || "Training Plan ID is required to manage workouts."} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 2 }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ mb: 2 }}
            >
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                >
                    {isMobile ? 'Back' : 'Back to Training Plans'}
                </Button>
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        flexGrow: { sm: 1 },
                        textAlign: 'center',
                        order: { xs: 2, sm: 0 }
                    }}
                >
                    {pageTitle}
                </Typography>
            </Stack>

            {savedWorkout_successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => savedWorkout_setSuccessMessage(null)}>
                    {savedWorkout_successMessage}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="Plan management tabs">
                    <Tab label="Exercises" />
                    <Tab label="Workouts" />
                </Tabs>
            </Box>

            {currentTab === 0 && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenExerciseBrowser}
                            disabled={isPageLoading || !planDetails || !!error}
                        >
                            Add Exercise
                        </Button>
                    </Box>
                    <LoadingErrorDisplay isLoading={isPageLoading} error={error && error !== 'Training plan not found.' ? error : null} />
                    {!isPageLoading && planDetails && (!error || error === 'Training plan not found.') && (
                        <Box >
                            {exercises.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography sx={{ mb: 2 }}>
                                        No exercises found for this plan. Click &quot;Add Exercise&quot; above to get started.
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Stack spacing={2}>
                                        {exercises.map((exercise) => {
                                            const definition = definitionsMapMPE[exercise.exerciseDefinitionId.toString()];
                                            return (
                                                <ExerciseItemCard
                                                    key={exercise._id.toString()}
                                                    exercise={exercise}
                                                    definition={definition}
                                                    onRequestDelete={handleRequestDeleteExercise}
                                                    onEdit={handleOpenEditForm}
                                                    onDuplicate={handleDuplicateExercise}
                                                    isDeleting={deletingExerciseId === exercise._id.toString()}
                                                    isDuplicating={duplicatingExerciseId === exercise._id.toString()}
                                                />
                                            );
                                        })}
                                    </Stack>
                                </>
                            )}
                        </Box>
                    )}
                </>
            )}

            {currentTab === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={savedWorkout_handleOpenAddWorkoutDialog}
                            disabled={isPageLoading || !planDetails || !!savedWorkout_error}
                            color="primary"
                        >
                            Add Workout
                        </Button>
                    </Box>
                    <LoadingErrorDisplay isLoading={isPageLoading} error={savedWorkout_error} />
                    {!isPageLoading && !savedWorkout_error && savedWorkout_workouts.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ mb: 2 }}>
                                No saved workouts found for this plan. Click &quot;Add Workout&quot; above to get started.
                            </Typography>
                        </Box>
                    )}
                    {!isPageLoading && !savedWorkout_error && savedWorkout_workouts.length > 0 && (
                        <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(320px, 1fr))' }, gap: 2.5 }}>
                                {savedWorkout_workouts.map((workout) => (
                                    <Paper key={workout._id} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, display: 'flex', flexDirection: 'column' }}>
                                        <Box onClick={() => savedWorkout_handleToggleExpand(workout._id)}
                                            sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', bgcolor: alpha(theme.palette.primary.main, 0.08), borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="h2" sx={{ fontWeight: '600', color: theme.palette.primary.main, fontSize: '1.1rem' }}>{workout.name}</Typography>
                                                {(workout.exercises && workout.exercises.length > 0 || savedWorkout_expandedWorkoutId === workout._id && workout.exercises && workout.exercises.length === 0) && (
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                                                        {workout.exercises ? workout.exercises.length : 0} {workout.exercises && workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <IconButton size="small" sx={{ color: theme.palette.primary.main }}>
                                                {savedWorkout_expandedWorkoutId === workout._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>
                                        <Collapse in={savedWorkout_expandedWorkoutId === workout._id} timeout="auto" unmountOnExit sx={{ px: 0 }}>
                                            <Divider sx={{ mx: 0, bgcolor: alpha(theme.palette.primary.main, 0.15) }} />
                                            <Box sx={{ p: 2 }}>
                                                {workout.exercisesError ? (<Typography color="error" sx={{ my: 1, fontSize: '0.875rem' }}>{workout.exercisesError}</Typography>
                                                ) : workout.exercises && workout.exercises.length > 0 ? (
                                                    <List dense disablePadding sx={{ mb: 1 }}>
                                                        {workout.exercises.map((exercise, index) => {
                                                            const definition = savedWorkout_exerciseDefinitionMap.get(exercise.exerciseDefinitionId.toString());
                                                            return (
                                                                <ListItem key={`${workout._id}-${exercise.exerciseDefinitionId.toString()}-${index}`} sx={{ bgcolor: theme.palette.grey[100], mb: 1, borderRadius: '8px', p: 1, border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`, minHeight: '50px' }}
                                                                    secondaryAction={ (
                                                                        <IconButton edge="end" aria-label="remove exercise" onClick={() => savedWorkout_handleRemoveExercise(workout._id, exercise.exerciseDefinitionId.toString())} size="small" sx={{ color: alpha(theme.palette.error.main, 0.7), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }} disabled={savedWorkout_isRemovingExercise === `${workout._id}_${exercise.exerciseDefinitionId.toString()}`}>
                                                                            {savedWorkout_isRemovingExercise === `${workout._id}_${exercise.exerciseDefinitionId.toString()}` ? <RemoveCircleOutlineIcon fontSize="small" /> : <RemoveCircleOutlineIcon fontSize="small" />}
                                                                        </IconButton>
                                                                    )}>
                                                                    <ListItemIcon sx={{ minWidth: 48, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                                        {definition?.imageUrl ? <Avatar src={definition.imageUrl} variant="rounded" sx={{ width: 36, height: 36 }}><BrokenImageIcon /></Avatar> : <Avatar variant="rounded" sx={{ width: 36, height: 36 }}><FitnessCenterIcon /></Avatar>}
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={definition?.name || `Exercise ${index + 1}`} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                                                                </ListItem>
                                                            );
                                                        })}
                                                    </List>
                                                ) : (<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 2, fontStyle: 'italic' }}>No exercises in this workout.</Typography>)}
                                            </Box>
                                        </Collapse>
                                        <Box sx={{ borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`, mt: 'auto' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.70rem', ml: 1 }}>
                                                    Created: {new Date(workout.createdAt).toLocaleDateString()}
                                                </Typography>
                                                <Box>
                                                    <IconButton title="Add Exercise to Workout" sx={{ color: theme.palette.primary.main, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }} onClick={() => savedWorkout_handleOpenAddExerciseDialog(workout)}><AddCircleOutlineIcon /></IconButton>
                                                    <IconButton title="Rename Workout" sx={{ color: theme.palette.info.main, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }} onClick={() => savedWorkout_openRenameDialog(workout)}><EditIcon /></IconButton>
                                                    <IconButton title="Delete Workout" sx={{ color: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }} onClick={() => savedWorkout_openDeleteDialog(workout._id)}><DeleteIcon /></IconButton>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        </>
                    )}
                </Box>
            )}

            {planId && currentTab === 0 && (
                <>
                    <ExerciseFormDialog
                        open={isExerciseBrowserOpen}
                        onClose={handleBrowserDialogClose}
                        onExerciseSelect={handleExerciseSelectFromBrowser}
                        existingExerciseDefinitionIds={existingExerciseDefinitionIdsInPlan}
                    />
                    {(selectedDefinitionForDetails || exerciseBeingEdited) && planId && (
                        <ExerciseDetailsDialog
                            open={isExerciseDetailsDialogOpen}
                            onClose={handleDetailsDialogClose}
                            onSave={handleDetailsDialogSave}
                            planId={planId}
                            exerciseDefinition={selectedDefinitionForDetails}
                            exerciseToEdit={exerciseBeingEdited}
                        />
                    )}
                    {isConfirmDeleteExerciseDialogOpen && exercisePendingDeletion && (
                        <ConfirmDeleteDialog
                            open={isConfirmDeleteExerciseDialogOpen}
                            onClose={handleConfirmDeleteExerciseDialogClose}
                            onConfirm={executeDeleteExercise}
                            itemName={definitionsMapMPE[exercisePendingDeletion.exerciseDefinitionId.toString()]?.name || `ID: ${exercisePendingDeletion._id.toString()}`}
                            itemType="Exercise"
                        />
                    )}
                </>
            )}

            {currentTab === 1 && (
                <>
                    <SavedWorkoutDeleteDialog
                        open={savedWorkout_deleteDialogOpen}
                        onClose={() => savedWorkout_setDeleteDialogOpen(false)}
                        onConfirm={savedWorkout_handleDeleteWorkout}
                    />
                    <SavedWorkoutRenameDialog
                        open={savedWorkout_renameDialogOpen}
                        onClose={() => savedWorkout_setRenameDialogOpen(false)}
                        onConfirm={savedWorkout_handleRenameWorkout}
                        workoutToRename={savedWorkout_workoutToRename}
                        newWorkoutName={savedWorkout_newWorkoutName}
                        onNewWorkoutNameChange={savedWorkout_setNewWorkoutName}
                        isRenaming={!!savedWorkout_isRenamingWorkoutId}
                    />
                    <SavedWorkoutAddExerciseDialog
                        open={savedWorkout_addExerciseDialogOpen}
                        onClose={savedWorkout_handleCloseAddExerciseDialog}
                        workoutToAddExerciseTo={savedWorkout_workoutToAddExerciseTo}
                        searchTerm={savedWorkout_searchTerm}
                        onSearchTermChange={savedWorkout_setSearchTerm}
                        isLoadingDialogExercises={savedWorkout_isLoadingDialogExercises}
                        dialogPlanContextError={savedWorkout_dialogPlanContextError}
                        filteredDefinitionsForDialog={savedWorkout_filteredDefinitionsForDialog}
                        onConfirmAddExercise={savedWorkout_handleConfirmAddExercise}
                        isAddingSingleExercise={savedWorkout_isAddingSingleExercise}
                    />
                    <SavedWorkoutAddWorkoutDialog
                        open={savedWorkout_isAddWorkoutDialogOpen}
                        onClose={savedWorkout_handleCloseAddWorkoutDialog}
                        onConfirm={savedWorkout_handleConfirmAddNewWorkout}
                        planName={planDetails?.name}
                        newWorkoutName={savedWorkout_newWorkoutNameForAdd}
                        onNewWorkoutNameChange={savedWorkout_setNewWorkoutNameForAdd}
                        addWorkoutError={savedWorkout_addWorkoutError}
                        isProcessing={isPageLoading}
                    />
                </>
            )}
        </Box>
    );
}; 