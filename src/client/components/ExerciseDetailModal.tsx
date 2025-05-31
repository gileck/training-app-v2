'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Stack,
    Chip,
    alpha
} from '@mui/material';
import Image from 'next/image';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HistoryIcon from '@mui/icons-material/History';
import CommentIcon from '@mui/icons-material/Comment';
import ListAltIcon from '@mui/icons-material/ListAlt';

import type { ExerciseDefinition, GetExerciseDefinitionByIdRequestParams } from '@/apis/exerciseDefinitions/types';
import { getExerciseDefinitionById } from '@/apis/exerciseDefinitions/client';
import { getExerciseHistory } from '@/apis/exerciseHistory/client';
import { GetExerciseHistoryRequest, ExerciseActivityEntry } from '@/apis/exerciseHistory/types';
import {
    AddWeeklyNoteRequest,
    EditWeeklyNoteRequest,
    DeleteWeeklyNoteRequest,
    WeeklyNote
} from '@/apis/weeklyProgress/types';
import { addWeeklyNote, editWeeklyNote, deleteWeeklyNote } from '@/apis/weeklyProgress/client';
import { WorkoutExercise } from '@/client/types/workout';

// Neon Light Theme colors
const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';
const NEON_PINK = '#D500F9';
const LIGHT_PAPER = '#F5F5F7';
const LIGHT_CARD = '#FFFFFF';

interface ExerciseDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercise: WorkoutExercise | null;
    planId?: string;
    weekNumber?: number;
}

// UI adaptation of the WeeklyNote type for use in the component
interface FormattedWeeklyNote {
    _id: string; // string representation of noteId
    text: string; // note content
    timestamp: string; // string representation of date
    date: string; // string representation of date
}

// UI adaptation of the ExerciseActivityEntry for use in the component
interface FormattedExerciseActivityEntry extends Partial<ExerciseActivityEntry> {
    _id: string;
    sets: number;
    reps: number;
    weight?: number;
    timestamp: string;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
    isOpen,
    onClose,
    exercise,
    planId,
    weekNumber
}) => {
    const [definition, setDefinition] = useState<ExerciseDefinition | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyData, setHistoryData] = useState<FormattedExerciseActivityEntry[]>([]);

    // Only initialize state variables without setters to suppress unused variable warnings
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    // Weekly notes state
    const [weeklyNotes, setWeeklyNotes] = useState<FormattedWeeklyNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editedNoteText, setEditedNoteText] = useState('');
    const [notesError, setNotesError] = useState<string | null>(null);
    const [isProcessingNote, setIsProcessingNote] = useState(false);

    useEffect(() => {
        const fetchExerciseDefinition = async () => {
            if (!exercise) return;

            // Use the exerciseDefinitionId from the ExerciseBase part of WorkoutExercise
            const definitionId = exercise.exerciseDefinitionId.toString();

            setIsLoading(true);
            setError(null);

            try {
                const params: GetExerciseDefinitionByIdRequestParams = {
                    definitionId: definitionId
                };

                const result = await getExerciseDefinitionById(params);

                const apiResult = result.data as ExerciseDefinition;

                if (!apiResult) {
                    setError('Failed to fetch exercise details');
                    return;
                }

                setDefinition(apiResult);
            } catch (err) {
                setError('An error occurred while fetching exercise details');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchExerciseDefinition();
        }
    }, [exercise, isOpen]);

    useEffect(() => {
        const fetchExerciseHistory = async () => {
            if (!exercise || !exercise.definition) return;

            // Use the exercise ID for the history lookup
            const exerciseId = exercise._id.toString();

            setIsLoadingHistory(true);
            setHistoryError(null);

            try {
                const params: GetExerciseHistoryRequest = {
                    exerciseId: exerciseId
                };

                const result = await getExerciseHistory(params);

                const apiResult = result.data;

                if (!apiResult) {
                    setHistoryError('Failed to fetch exercise history');
                    return;
                }

                // Transform API entries to the format needed by the UI
                const formattedEntries = apiResult.activityEntries.map(entry => {
                    // Ensure we have a valid date string - use ISO format if possible
                    let formattedDate = entry.date;
                    try {
                        // Try to format as a more standard ISO date if it's just a date string (YYYY-MM-DD)
                        if (entry.date.length === 10 && entry.date.includes('-')) {
                            formattedDate = new Date(entry.date).toISOString();
                        }
                    } catch (e) {
                        console.error('Error formatting activity date:', e);
                    }

                    return {
                        _id: entry.date, // Using date as ID
                        sets: entry.setsCompleted,
                        reps: 0, // Default value since API doesn't provide reps
                        timestamp: formattedDate,
                    };
                });

                setHistoryData(formattedEntries);
            } catch (err) {
                setHistoryError('An error occurred while fetching exercise history');
                console.error(err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        if (isOpen && exercise) {
            fetchExerciseHistory();
        }
    }, [exercise, isOpen]);

    useEffect(() => {
        // Based on the type definition, progress.weeklyNotes should be used instead of notes
        if (exercise?.progress?.weeklyNotes) {
            // Transform WeeklyNote[] from API to FormattedWeeklyNote[] for UI
            const formattedNotes = exercise.progress.weeklyNotes.map(note => ({
                _id: note.noteId.toString(),
                text: note.note,
                timestamp: note.date.toString(),
                date: note.date.toString()
            }));
            setWeeklyNotes(formattedNotes);
        } else {
            setWeeklyNotes([]);
        }
    }, [exercise]);

    const handleAddNote = async () => {
        if (!newNote.trim() || !planId || !weekNumber || !exercise) return;

        setIsProcessingNote(true);
        setNotesError(null);

        try {
            const params: AddWeeklyNoteRequest = {
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                note: newNote
            };

            const result = await addWeeklyNote(params);

            if (!result.data || 'error' in result.data) {
                setNotesError(`Failed to add note: ${('error' in result.data) ? result.data.error : 'Unknown error'}`);
                return;
            }

            // At this point, result.data is WeeklyNote
            const newNoteItem = {
                _id: result.data.noteId ? result.data.noteId.toString() : new Date().getTime().toString(),
                text: result.data.note || newNote,
                timestamp: result.data.date ? result.data.date.toString() : new Date().toISOString(),
                date: result.data.date ? result.data.date.toString() : new Date().toISOString()
            };

            setWeeklyNotes(prev => [...prev, newNoteItem]);
            setNewNote('');
            setIsAddingNote(false);
        } catch (err) {
            setNotesError('An error occurred while adding note');
            console.error(err);
        } finally {
            setIsProcessingNote(false);
        }
    };

    const handleEditNote = async (noteId: string) => {
        if (!editedNoteText.trim() || !planId || !weekNumber || !exercise) return;

        setIsProcessingNote(true);
        setNotesError(null);

        try {
            const params: EditWeeklyNoteRequest = {
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                noteId,
                updatedNote: editedNoteText
            };

            const result = await editWeeklyNote(params);

            const apiResult = result.data as WeeklyNote;

            if (!apiResult) {
                setNotesError('Failed to edit note');
                return;
            }

            // Update the local state with the edited note
            const updatedNotes = weeklyNotes.map(note =>
                note._id === noteId
                    ? { ...note, text: editedNoteText }
                    : note
            );
            setWeeklyNotes(updatedNotes);

            setEditingNoteId(null);
            setEditedNoteText('');
        } catch (err) {
            setNotesError('An error occurred while editing note');
            console.error(err);
        } finally {
            setIsProcessingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!planId || !weekNumber || !exercise) return;

        setIsProcessingNote(true);
        setNotesError(null);

        try {
            const params: DeleteWeeklyNoteRequest = {
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                noteId
            };

            const result = await deleteWeeklyNote(params);

            if (!result.data.success) {
                setNotesError('Failed to delete note');
                return;
            }

            // Remove the deleted note from the local state
            const filteredNotes = weeklyNotes.filter(note => note._id !== noteId);
            setWeeklyNotes(filteredNotes);
        } catch (err) {
            setNotesError('An error occurred while deleting note');
            console.error(err);
        } finally {
            setIsProcessingNote(false);
        }
    };

    const startEditingNote = (noteId: string, noteText: string) => {
        setEditingNoteId(noteId);
        setEditedNoteText(noteText);
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditedNoteText('');
    };

    const toggleAddNote = () => {
        setIsAddingNote(!isAddingNote);
        setNewNote('');
    };

    // Format the date
    const formatDate = (dateString: string) => {
        try {
            // Safely handle potentially invalid date strings
            const date = new Date(dateString);

            // Check if date is valid before formatting
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid date';
        }
    };

    const exerciseName = exercise?.name || definition?.name || 'Exercise Details';

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: LIGHT_PAPER,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: `0 8px 32px ${alpha(NEON_PURPLE, 0.2)}`,
                    border: `1px solid ${alpha(NEON_PURPLE, 0.15)}`
                }
            }}
        >
            <DialogTitle sx={{
                position: 'relative',
                borderBottom: `1px solid ${alpha(NEON_PURPLE, 0.1)}`,
                bgcolor: LIGHT_CARD,
                px: 3,
                py: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FitnessCenterIcon sx={{ mr: 1.5, color: NEON_PURPLE }} />
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            fontWeight: 'bold',
                            color: '#333',
                            textShadow: `0 0 1px ${alpha(NEON_PURPLE, 0.2)}`
                        }}
                    >
                        {exerciseName}
                    </Typography>
                </Box>

                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: alpha('#000000', 0.5),
                        '&:hover': {
                            color: NEON_PURPLE,
                            bgcolor: alpha(NEON_PURPLE, 0.05)
                        }
                    }}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ bgcolor: LIGHT_PAPER, p: 0 }}>
                {isLoading && (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress sx={{ color: NEON_PURPLE }} />
                    </Box>
                )}

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            m: 3,
                            bgcolor: alpha('#FF0000', 0.05),
                            color: '#D32F2F',
                            border: `1px solid ${alpha('#FF0000', 0.1)}`,
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {!isLoading && !error && definition && exercise && (
                    <Box>
                        {/* Image and details section */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            bgcolor: LIGHT_CARD,
                            p: 3
                        }}>
                            {/* Image */}
                            {definition.imageUrl && (
                                <Box sx={{
                                    position: 'relative',
                                    width: { xs: '100%', sm: 250 },
                                    height: 200,
                                    mb: { xs: 2, sm: 0 },
                                    mr: { xs: 0, sm: 3 },
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: `1px solid ${alpha(NEON_BLUE, 0.15)}`,
                                    boxShadow: `0 4px 12px ${alpha(NEON_BLUE, 0.1)}`,
                                    flexShrink: 0
                                }}>
                                    <Image
                                        src={definition.imageUrl}
                                        alt={definition.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </Box>
                            )}

                            {/* Details */}
                            <Box sx={{ flex: 1 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        bgcolor: alpha(NEON_BLUE, 0.05),
                                        border: `1px solid ${alpha(NEON_BLUE, 0.1)}`,
                                        borderRadius: 2
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 'bold',
                                            mb: 2,
                                            color: NEON_BLUE,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <ListAltIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                        Exercise Details
                                    </Typography>

                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: alpha('#000', 0.6) }}>Sets:</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{exercise.sets}</Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: alpha('#000', 0.6) }}>Reps:</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{exercise.reps}</Typography>
                                        </Box>

                                        {exercise.weight !== undefined && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: alpha('#000', 0.6) }}>Weight:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{exercise.weight}kg</Typography>
                                            </Box>
                                        )}

                                        {definition.bodyWeight && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: alpha('#000', 0.6) }}>Type:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Bodyweight</Typography>
                                            </Box>
                                        )}

                                        {definition.primaryMuscle && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: alpha('#000', 0.6) }}>Primary Muscle:</Typography>
                                                <Chip
                                                    label={definition.primaryMuscle}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        bgcolor: alpha(NEON_BLUE, 0.1),
                                                        color: NEON_BLUE,
                                                        border: `1px solid ${alpha(NEON_BLUE, 0.2)}`,
                                                        fontWeight: 'medium',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Stack>
                                </Paper>
                            </Box>
                        </Box>

                        {/* Comments/Instructions Section */}
                        {exercise.comments && (
                            <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(LIGHT_PAPER, 0.5) }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        bgcolor: alpha(NEON_GREEN, 0.05),
                                        border: `1px solid ${alpha(NEON_GREEN, 0.15)}`,
                                        borderRadius: 2
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 'bold',
                                            mb: 1.5,
                                            color: NEON_GREEN,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <CommentIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                        Instructions/Comments
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            whiteSpace: 'pre-wrap',
                                            color: alpha('#000', 0.75),
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {exercise.comments}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                        {/* History Section */}
                        {isLoadingHistory ? (
                            <Box sx={{ px: 3, py: 2.5, bgcolor: LIGHT_PAPER, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={24} sx={{ color: NEON_PURPLE }} />
                            </Box>
                        ) : historyError ? (
                            <Box sx={{ px: 3, py: 2.5, bgcolor: LIGHT_PAPER }}>
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 2,
                                        bgcolor: alpha('#FF0000', 0.05),
                                        color: '#D32F2F',
                                        border: `1px solid ${alpha('#FF0000', 0.1)}`,
                                    }}
                                >
                                    {historyError}
                                </Alert>
                            </Box>
                        ) : historyData.length > 0 && (
                            <Box sx={{ px: 3, py: 2.5, bgcolor: LIGHT_PAPER }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 0,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: `1px solid ${alpha('#000', 0.1)}`
                                    }}
                                >
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: alpha(NEON_PURPLE, 0.05),
                                        borderBottom: `1px solid ${alpha('#000', 0.05)}`,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <HistoryIcon sx={{ mr: 1, color: NEON_PURPLE, fontSize: '1.2rem' }} />
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: NEON_PURPLE
                                            }}
                                        >
                                            Exercise History
                                        </Typography>
                                    </Box>

                                    <TableContainer sx={{ maxHeight: 200 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            bgcolor: LIGHT_CARD
                                                        }}
                                                    >
                                                        Date
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            bgcolor: LIGHT_CARD
                                                        }}
                                                    >
                                                        Sets
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            bgcolor: LIGHT_CARD
                                                        }}
                                                    >
                                                        Reps
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            bgcolor: LIGHT_CARD
                                                        }}
                                                    >
                                                        Weight
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {historyData.map((entry) => (
                                                    <TableRow
                                                        key={entry._id.toString()}
                                                        sx={{
                                                            '&:nth-of-type(odd)': {
                                                                bgcolor: alpha('#f5f5f5', 0.5),
                                                            },
                                                            '&:hover': {
                                                                bgcolor: alpha(NEON_PURPLE, 0.05)
                                                            },
                                                        }}
                                                    >
                                                        <TableCell sx={{ fontSize: '0.825rem' }}>
                                                            {formatDate(entry.timestamp)}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.825rem' }}>
                                                            {entry.sets}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.825rem' }}>
                                                            {entry.reps}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.825rem' }}>
                                                            {entry.weight !== undefined ? `${entry.weight}kg` : 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Box>
                        )}

                        {/* Workout Notes Section */}
                        <Box sx={{ px: 3, py: 2.5, bgcolor: LIGHT_PAPER }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 0,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: `1px solid ${alpha('#000', 0.1)}`
                                }}
                            >
                                <Box sx={{
                                    p: 2,
                                    bgcolor: alpha(NEON_PINK, 0.05),
                                    borderBottom: `1px solid ${alpha('#000', 0.05)}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CommentIcon sx={{ mr: 1, color: NEON_PINK, fontSize: '1.2rem' }} />
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: NEON_PINK
                                            }}
                                        >
                                            Workout Notes
                                        </Typography>
                                    </Box>

                                    {!isAddingNote && (
                                        <Button
                                            startIcon={<AddIcon />}
                                            onClick={toggleAddNote}
                                            size="small"
                                            sx={{
                                                color: NEON_PINK,
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: alpha(NEON_PINK, 0.05)
                                                }
                                            }}
                                        >
                                            Add Note
                                        </Button>
                                    )}
                                </Box>

                                <Box sx={{ p: 2 }}>
                                    {notesError && (
                                        <Alert
                                            severity="error"
                                            sx={{
                                                mb: 2,
                                                bgcolor: alpha('#FF0000', 0.05),
                                                color: '#D32F2F',
                                                border: `1px solid ${alpha('#FF0000', 0.1)}`,
                                            }}
                                        >
                                            {notesError}
                                        </Alert>
                                    )}

                                    {isAddingNote && (
                                        <Box sx={{ mb: 2 }}>
                                            <TextField
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                label="New Note"
                                                multiline
                                                rows={2}
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                sx={{
                                                    mb: 1,
                                                    '& .MuiOutlinedInput-root': {
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: NEON_PINK
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root.Mui-focused': {
                                                        color: NEON_PINK
                                                    }
                                                }}
                                            />
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button
                                                    size="small"
                                                    startIcon={<CancelIcon />}
                                                    onClick={toggleAddNote}
                                                    sx={{
                                                        color: alpha('#000', 0.6),
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            bgcolor: alpha('#000', 0.05)
                                                        }
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<SaveIcon />}
                                                    onClick={handleAddNote}
                                                    disabled={!newNote.trim() || isProcessingNote}
                                                    sx={{
                                                        bgcolor: NEON_PINK,
                                                        color: 'white',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            bgcolor: alpha(NEON_PINK, 0.8)
                                                        },
                                                        '&.Mui-disabled': {
                                                            bgcolor: alpha(NEON_PINK, 0.4),
                                                            color: 'white'
                                                        }
                                                    }}
                                                >
                                                    {isProcessingNote ? 'Saving...' : 'Save Note'}
                                                </Button>
                                            </Stack>
                                        </Box>
                                    )}

                                    {weeklyNotes.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: alpha('#000', 0.5), textAlign: 'center', py: 2 }}>
                                            No notes yet. Add your first note to keep track of your progress.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            {weeklyNotes.map((note) => (
                                                <Paper
                                                    key={note._id}
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: alpha(NEON_PINK, 0.03),
                                                        border: `1px solid ${alpha(NEON_PINK, 0.1)}`,
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    {editingNoteId === note._id ? (
                                                        <>
                                                            <TextField
                                                                value={editedNoteText}
                                                                onChange={(e) => setEditedNoteText(e.target.value)}
                                                                multiline
                                                                rows={2}
                                                                fullWidth
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{
                                                                    mb: 1,
                                                                    '& .MuiOutlinedInput-root': {
                                                                        '&.Mui-focused fieldset': {
                                                                            borderColor: NEON_PINK
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Button
                                                                    size="small"
                                                                    startIcon={<CancelIcon />}
                                                                    onClick={cancelEditing}
                                                                    sx={{
                                                                        color: alpha('#000', 0.6),
                                                                        textTransform: 'none'
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    startIcon={<SaveIcon />}
                                                                    onClick={() => handleEditNote(note._id)}
                                                                    disabled={!editedNoteText.trim() || isProcessingNote}
                                                                    sx={{
                                                                        bgcolor: NEON_PINK,
                                                                        color: 'white',
                                                                        textTransform: 'none',
                                                                        '&:hover': {
                                                                            bgcolor: alpha(NEON_PINK, 0.8)
                                                                        },
                                                                        '&.Mui-disabled': {
                                                                            bgcolor: alpha(NEON_PINK, 0.4),
                                                                            color: 'white'
                                                                        }
                                                                    }}
                                                                >
                                                                    {isProcessingNote ? 'Saving...' : 'Save'}
                                                                </Button>
                                                            </Stack>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontWeight: 'medium',
                                                                        color: NEON_PINK
                                                                    }}
                                                                >
                                                                    {new Date(note.date).toLocaleDateString()}
                                                                </Typography>
                                                                <Box>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => startEditingNote(note._id, note.text)}
                                                                        disabled={isProcessingNote}
                                                                        sx={{
                                                                            color: alpha('#000', 0.5),
                                                                            '&:hover': {
                                                                                color: NEON_BLUE,
                                                                                bgcolor: alpha(NEON_BLUE, 0.05)
                                                                            },
                                                                            p: 0.5,
                                                                            mr: 0.5
                                                                        }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDeleteNote(note._id)}
                                                                        disabled={isProcessingNote}
                                                                        sx={{
                                                                            color: alpha('#000', 0.5),
                                                                            '&:hover': {
                                                                                color: '#f44336',
                                                                                bgcolor: alpha('#f44336', 0.05)
                                                                            },
                                                                            p: 0.5
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Box>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    color: alpha('#000', 0.75)
                                                                }}
                                                            >
                                                                {note.text}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{
                p: 2,
                bgcolor: LIGHT_CARD,
                borderTop: `1px solid ${alpha(NEON_PURPLE, 0.1)}`
            }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        bgcolor: NEON_PURPLE,
                        color: 'white',
                        borderRadius: 8,
                        textTransform: 'none',
                        px: 3,
                        '&:hover': {
                            bgcolor: alpha(NEON_PURPLE, 0.9)
                        }
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 