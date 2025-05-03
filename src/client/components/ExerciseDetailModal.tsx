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
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Stack
} from '@mui/material';
import Image from 'next/image';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import type { WeeklyNote } from '@/apis/weeklyProgress/types';
import type { ExerciseActivityEntry } from '@/apis/exerciseHistory/types';
import { getExerciseDefinitionById } from '@/apis/exerciseDefinitions/client';
import { getExerciseHistory } from '@/apis/exerciseHistory/client';
import { addWeeklyNote, editWeeklyNote, deleteWeeklyNote } from '@/apis/weeklyProgress/client';
import { WorkoutExercise } from '@/client/types/workout';

interface ExerciseDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercise: WorkoutExercise | null;
    planId?: string;
    weekNumber?: number;
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
    const [historyData, setHistoryData] = useState<ExerciseActivityEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    // Weekly notes state
    const [weeklyNotes, setWeeklyNotes] = useState<WeeklyNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editedNoteText, setEditedNoteText] = useState('');
    const [notesError, setNotesError] = useState<string | null>(null);
    const [isProcessingNote, setIsProcessingNote] = useState(false);

    useEffect(() => {
        if (isOpen && exercise?.exerciseDefinitionId) {
            const fetchDefinition = async () => {
                setIsLoading(true);
                setError(null);
                setDefinition(null);
                try {
                    const response = await getExerciseDefinitionById({ definitionId: exercise.exerciseDefinitionId.toString() });
                    if (response.data) {
                        setDefinition(response.data);
                    } else {
                        throw new Error('Failed to fetch exercise definition');
                    }
                } catch (err) {
                    const error = err as Error;
                    console.error("Error fetching definition:", err);
                    setError(error.message || 'Could not load exercise details.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDefinition();
        } else {
            setDefinition(null);
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, exercise]);

    useEffect(() => {
        if (isOpen && exercise?._id) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                setHistoryError(null);
                setHistoryData([]);
                try {
                    const response = await getExerciseHistory({
                        exerciseId: exercise._id.toString(),
                        limit: 10
                    });
                    if (response.data) {
                        setHistoryData(response.data.activityEntries);
                    } else {
                        throw new Error('Failed to fetch exercise history');
                    }
                } catch (err) {
                    const error = err as Error;
                    console.error("Error fetching history:", err);
                    setHistoryError(error.message || 'Could not load exercise history.');
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        } else {
            setHistoryData([]);
            setHistoryError(null);
            setIsLoadingHistory(false);
        }
    }, [isOpen, exercise]);

    // Update weekly notes when exercise changes
    useEffect(() => {
        if (exercise?.progress?.weeklyNotes) {
            setWeeklyNotes(exercise.progress.weeklyNotes);
        } else {
            setWeeklyNotes([]);
        }
    }, [exercise]);

    const handleAddNote = async () => {
        if (!exercise || !exercise._id || !planId || !weekNumber || !newNote.trim()) {
            setNotesError('Cannot add empty note');
            return;
        }

        setIsProcessingNote(true);
        setNotesError(null);

        try {
            const response = await addWeeklyNote({
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                note: newNote.trim()
            });

            if (response.data) {
                // Add the new note to the local state
                setWeeklyNotes(prev => [...prev, response.data]);
                setNewNote('');
                setIsAddingNote(false);
            } else {
                throw new Error('Failed to add note');
            }
        } catch (err) {
            const error = err as Error;
            console.error('Error adding note:', err);
            setNotesError(error.message || 'Failed to add note');
        } finally {
            setIsProcessingNote(false);
        }
    };

    const handleEditNote = async (noteId: string) => {
        if (!exercise || !exercise._id || !planId || !weekNumber || !editedNoteText.trim()) {
            setNotesError('Cannot save empty note');
            return;
        }

        setIsProcessingNote(true);
        setNotesError(null);

        try {
            const response = await editWeeklyNote({
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                noteId,
                updatedNote: editedNoteText.trim()
            });

            if (response.data) {
                // Update the note in the local state
                setWeeklyNotes(prev =>
                    prev.map(note =>
                        note.noteId.toString() === noteId
                            ? { ...note, note: editedNoteText.trim() }
                            : note
                    )
                );
                setEditingNoteId(null);
                setEditedNoteText('');
            } else {
                throw new Error('Failed to update note');
            }
        } catch (err) {
            const error = err as Error;
            console.error('Error updating note:', err);
            setNotesError(error.message || 'Failed to update note');
        } finally {
            setIsProcessingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!exercise || !exercise._id || !planId || !weekNumber) {
            return;
        }

        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        setIsProcessingNote(true);
        setNotesError(null);

        try {
            const response = await deleteWeeklyNote({
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                noteId
            });

            if (response.data?.success) {
                // Remove the note from the local state
                setWeeklyNotes(prev => prev.filter(note => note.noteId.toString() !== noteId));
            } else {
                throw new Error('Failed to delete note');
            }
        } catch (err) {
            const error = err as Error;
            console.error('Error deleting note:', err);
            setNotesError(error.message || 'Failed to delete note');
        } finally {
            setIsProcessingNote(false);
        }
    };

    const startEditingNote = (note: WeeklyNote) => {
        setEditingNoteId(note.noteId.toString());
        setEditedNoteText(note.note);
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditedNoteText('');
    };

    const toggleAddNote = () => {
        setIsAddingNote(!isAddingNote);
        setNewNote('');
    };

    if (!isOpen || !exercise) {
        return null;
    }

    const exerciseName = definition?.name || exercise.name || `Exercise ID: ${exercise._id.toString()}`;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Typography variant="h5">{exerciseName}</Typography>
                {definition?.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {definition.description}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent>
                {isLoading && (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

                {!isLoading && !error && definition && (
                    <>
                        {definition.imageUrl && (
                            <Box sx={{ position: 'relative', width: '100%', height: 300, my: 2 }}>
                                <Image
                                    src={definition.imageUrl}
                                    alt={definition.name}
                                    layout="fill"
                                    objectFit="contain"
                                />
                            </Box>
                        )}

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6">Exercise Details</Typography>
                            <Typography variant="body1">
                                <strong>Sets:</strong> {exercise.sets}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Reps:</strong> {exercise.reps}
                            </Typography>
                            {exercise.weight !== undefined && (
                                <Typography variant="body1">
                                    <strong>Weight:</strong> {exercise.weight}kg
                                </Typography>
                            )}
                        </Box>

                        {exercise.comments && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6">Instructions/Comments</Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {exercise.comments}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="h6">Weekly Notes</Typography>
                                <Button
                                    startIcon={isAddingNote ? <CancelIcon /> : <AddIcon />}
                                    onClick={toggleAddNote}
                                    size="small"
                                    variant="outlined"
                                    disabled={isProcessingNote}
                                >
                                    {isAddingNote ? 'Cancel' : 'Add Note'}
                                </Button>
                            </Stack>

                            {notesError && (
                                <Alert severity="error" sx={{ mb: 2 }}>{notesError}</Alert>
                            )}

                            {isAddingNote && (
                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="Enter your note..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        disabled={isProcessingNote}
                                        sx={{ mb: 1 }}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleAddNote}
                                        disabled={isProcessingNote || !newNote.trim()}
                                    >
                                        Save Note
                                    </Button>
                                </Box>
                            )}

                            {isProcessingNote && (
                                <Box display="flex" justifyContent="center" my={1}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}

                            {weeklyNotes.length > 0 ? (
                                weeklyNotes.map((note: WeeklyNote) => (
                                    <Paper
                                        key={note.noteId.toString()}
                                        variant="outlined"
                                        sx={{ p: 2, mb: 1 }}
                                    >
                                        {editingNoteId === note.noteId.toString() ? (
                                            <>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    value={editedNoteText}
                                                    onChange={(e) => setEditedNoteText(e.target.value)}
                                                    disabled={isProcessingNote}
                                                    sx={{ mb: 1 }}
                                                />
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<SaveIcon />}
                                                        onClick={() => handleEditNote(note.noteId.toString())}
                                                        disabled={isProcessingNote || !editedNoteText.trim()}
                                                        size="small"
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<CancelIcon />}
                                                        onClick={cancelEditing}
                                                        disabled={isProcessingNote}
                                                        size="small"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </Stack>
                                            </>
                                        ) : (
                                            <>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                    {note.note}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                    {new Date(note.date).toLocaleString()}
                                                </Typography>
                                                <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => startEditingNote(note)}
                                                        disabled={isProcessingNote || !!editingNoteId}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteNote(note.noteId.toString())}
                                                        disabled={isProcessingNote || !!editingNoteId}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </>
                                        )}
                                    </Paper>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No notes for this week.
                                </Typography>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6">History</Typography>

                            {isLoadingHistory && (
                                <Box display="flex" justifyContent="center" my={2}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}

                            {historyError && (
                                <Alert severity="error" sx={{ my: 1 }}>{historyError}</Alert>
                            )}

                            {!isLoadingHistory && !historyError && (
                                historyData.length > 0 ? (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Date</strong></TableCell>
                                                    <TableCell><strong>Sets Completed</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {historyData.map((entry, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{entry.date}</TableCell>
                                                        <TableCell>{entry.setsCompleted}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No history data available.
                                    </Typography>
                                )
                            )}
                        </Box>
                    </>
                )}

                {!isLoading && !error && !definition && (
                    <Alert severity="info">Could not load exercise definition details.</Alert>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
}; 