import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Box,
    Typography,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    alpha,
    Chip,
    Tooltip,
    TablePagination,
    DialogContentText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

import { ExerciseActivityLogWithDetails } from '@/apis/exerciseActivityLog/types';
import { deleteActivityLog, updateActivityLog } from '@/apis/exerciseActivityLog/client';

interface ActivityTableProps {
    activities: ExerciseActivityLogWithDetails[];
    onActivityDeleted: () => void;
}

// Color constants
const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';
const NEON_RED = '#F44336';

export const ActivityTable: React.FC<ActivityTableProps> = ({ activities, onActivityDeleted }) => {
    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<ExerciseActivityLogWithDetails | null>(null);
    const [editSetsCompleted, setEditSetsCompleted] = useState<number>(0);
    const [editDate, setEditDate] = useState<Date | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Handle opening edit dialog
    const handleOpenEditDialog = (activity: ExerciseActivityLogWithDetails) => {
        setCurrentActivity(activity);
        setEditSetsCompleted(activity.setsCompleted);
        setEditDate(new Date(activity.date));
        setUpdateError(null);
        setEditDialogOpen(true);
    };

    // Handle closing edit dialog
    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setCurrentActivity(null);
    };

    // Handle saving edited activity
    const handleSaveEdit = async () => {
        if (!currentActivity) return;
        
        setIsUpdating(true);
        setUpdateError(null);
        
        try {
            const response = await updateActivityLog({
                activityId: currentActivity._id,
                setsCompleted: editSetsCompleted,
                date: editDate ? format(editDate, 'yyyy-MM-dd') : undefined
            });

            if (response.data?.success) {
                handleCloseEditDialog();
                onActivityDeleted(); // Refresh the data
            } else {
                setUpdateError(response.data?.error || 'Failed to update activity');
            }
        } catch (err) {
            console.error('Error updating activity:', err);
            setUpdateError('An error occurred while updating the activity');
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle opening delete dialog
    const handleOpenDeleteDialog = (activityId: string) => {
        setActivityToDelete(activityId);
        setDeleteError(null);
        setDeleteDialogOpen(true);
    };

    // Handle closing delete dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setActivityToDelete(null);
    };

    // Handle deleting activity
    const handleDeleteActivity = async () => {
        if (!activityToDelete) return;
        
        setIsDeleting(true);
        setDeleteError(null);
        
        try {
            const response = await deleteActivityLog({
                activityId: activityToDelete
            });

            if (response.data?.success) {
                handleCloseDeleteDialog();
                onActivityDeleted(); // Refresh the data
            } else {
                setDeleteError(response.data?.error || 'Failed to delete activity');
            }
        } catch (err) {
            console.error('Error deleting activity:', err);
            setDeleteError('An error occurred while deleting the activity');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle pagination change
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Get visible rows for current page
    const visibleRows = activities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Handle input validation for sets completed
    const handleSetsCompletedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && value >= 0) {
            setEditSetsCompleted(value);
        }
    };

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Activity Log
                </Typography>
                
                {activities.length === 0 ? (
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 4, 
                            textAlign: 'center',
                            bgcolor: alpha(NEON_BLUE, 0.05),
                            border: `1px dashed ${alpha(NEON_BLUE, 0.3)}`,
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="body1" color="text.secondary">
                            No activity data found for the selected date range.
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer 
                        component={Paper} 
                        sx={{ 
                            boxShadow: `0 2px 10px ${alpha('#000', 0.1)}`,
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <Table size="medium">
                            <TableHead sx={{ bgcolor: alpha(NEON_PURPLE, 0.05) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Exercise</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Plan</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Week</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Sets Completed</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Muscle Group</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {visibleRows.map((activity) => (
                                    <TableRow key={activity._id}>
                                        <TableCell>
                                            {format(new Date(activity.date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>{activity.exerciseName}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                {activity.planName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>Week {activity.weekNumber}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={activity.setsCompleted} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: alpha(NEON_GREEN, 0.1),
                                                    color: NEON_GREEN,
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {activity.primaryMuscle ? (
                                                <Chip 
                                                    label={activity.primaryMuscle} 
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: alpha(NEON_BLUE, 0.1),
                                                        color: NEON_BLUE 
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    -
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleOpenEditDialog(activity)}
                                                    sx={{ color: NEON_BLUE }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleOpenDeleteDialog(activity._id)}
                                                    sx={{ color: NEON_RED }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={activities.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </TableContainer>
                )}
            </Box>

            {/* Edit Activity Dialog */}
            <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="xs" fullWidth>
                <DialogTitle>Edit Activity</DialogTitle>
                <DialogContent>
                    {updateError && (
                        <DialogContentText color="error" sx={{ mb: 2 }}>
                            {updateError}
                        </DialogContentText>
                    )}
                    
                    {currentActivity && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                {currentActivity.exerciseName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {currentActivity.planName}, Week {currentActivity.weekNumber}
                            </Typography>
                            
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <DatePicker
                                    label="Date"
                                    value={editDate}
                                    onChange={(newDate: Date | null) => setEditDate(newDate)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            margin: "normal"
                                        }
                                    }}
                                />
                                
                                <TextField
                                    label="Sets Completed"
                                    type="number"
                                    fullWidth
                                    margin="normal"
                                    value={editSetsCompleted}
                                    onChange={handleSetsCompletedChange}
                                    InputProps={{ inputProps: { min: 0 } }}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog} disabled={isUpdating}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveEdit} 
                        disabled={isUpdating}
                        variant="contained"
                        color="primary"
                    >
                        {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    {deleteError && (
                        <DialogContentText color="error" sx={{ mb: 2 }}>
                            {deleteError}
                        </DialogContentText>
                    )}
                    <DialogContentText>
                        Are you sure you want to delete this activity log entry? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteActivity} 
                        disabled={isDeleting}
                        color="error"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 