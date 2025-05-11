import React, { useState, useEffect, useMemo } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    TextField,
    CircularProgress,
    Alert,
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Typography,
    Box,
    IconButton,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    AppBar,
    Toolbar,
    Pagination,
    useMediaQuery,
    Theme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import type { ExerciseDefinition, GetAllExerciseDefinitionsResponse } from '@/apis/exerciseDefinitions/types';
import { GENERIC_IMAGE_PLACEHOLDER } from '../utils/constants';

interface ExerciseBrowserDialogProps {
    open: boolean;
    onClose: () => void;
    onExerciseSelect: (definition: ExerciseDefinition) => void;
    existingExerciseDefinitionIds?: string[];
}

const CARD_MIN_WIDTH = 280; // For responsive card sizing with Flexbox
const CARD_GAP = 2; // Gap between cards in theme units (spacing)

export const ExerciseFormDialog: React.FC<ExerciseBrowserDialogProps> = ({
    open,
    onClose,
    onExerciseSelect,
    existingExerciseDefinitionIds = [],
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [allDefinitions, setAllDefinitions] = useState<GetAllExerciseDefinitionsResponse>([]);
    const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const isSmallScreenForPagination = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    const muscleGroups = useMemo(() => {
        // Dynamically generate from allDefinitions if they are loaded
        if (allDefinitions.length > 0) {
            const primary = new Set(allDefinitions.map(def => def.primaryMuscle).filter(Boolean));
            const secondary = new Set(allDefinitions.flatMap(def => def.secondaryMuscles).filter(Boolean));
            const combined = Array.from(new Set(['All', ...primary, ...secondary])).sort();
            return combined;
        }
        return ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Biceps', 'Triceps', 'Core', 'Full Body']; // Fallback
    }, [allDefinitions]);

    useEffect(() => {
        if (open) {
            setIsLoadingDefinitions(true);
            setFetchError(null);
            getAllExerciseDefinitionOptions()
                .then(response => {
                    if (response.data && Array.isArray(response.data)) {
                        setAllDefinitions(response.data);
                    } else {
                        console.error("Fetched data for definitions is not an array:", response.data);
                        throw new Error('Invalid data format for definitions');
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch exercise definitions:", err);
                    setFetchError(err instanceof Error ? err.message : 'Failed to load definitions');
                    setAllDefinitions([]);
                })
                .finally(() => {
                    setIsLoadingDefinitions(false);
                });
            setSearchTerm('');
            setSelectedMuscleGroup('All');
            setCurrentPage(1);
            setItemsPerPage(10);
        }
    }, [open]);

    const filteredDefinitions = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const lowerSelectedGroup = selectedMuscleGroup.toLowerCase();

        return allDefinitions
            .filter(def => def.name.toLowerCase().includes(lowerSearchTerm))
            .filter(def => {
                if (selectedMuscleGroup === 'All') return true;
                return (
                    (def.primaryMuscle && def.primaryMuscle.toLowerCase().includes(lowerSelectedGroup)) ||
                    (def.secondaryMuscles && def.secondaryMuscles.some(sm => sm.toLowerCase().includes(lowerSelectedGroup)))
                );
            });
    }, [allDefinitions, searchTerm, selectedMuscleGroup]);

    const currentItemsToDisplay = useMemo(() => {
        return itemsPerPage === 'all' || typeof itemsPerPage !== 'number' ? filteredDefinitions.length : itemsPerPage;
    }, [itemsPerPage, filteredDefinitions.length]);

    const paginatedDefinitions = useMemo(() => {
        if (itemsPerPage === 'all' || typeof itemsPerPage !== 'number') return filteredDefinitions;
        const startIndex = (currentPage - 1) * currentItemsToDisplay;
        return filteredDefinitions.slice(startIndex, startIndex + currentItemsToDisplay);
    }, [filteredDefinitions, currentPage, currentItemsToDisplay, itemsPerPage]);

    const totalPages = useMemo(() => {
        if (itemsPerPage === 'all' || typeof itemsPerPage !== 'number' || filteredDefinitions.length === 0 || currentItemsToDisplay === 0) return 1;
        return Math.ceil(filteredDefinitions.length / currentItemsToDisplay);
    }, [filteredDefinitions.length, currentItemsToDisplay, itemsPerPage]);

    const handleExerciseCardClick = (definition: ExerciseDefinition) => {
        onExerciseSelect(definition);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
        >
            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <Button
                        color="inherit"
                        onClick={onClose}
                        startIcon={<ArrowBackIcon />}
                        sx={{ textTransform: 'none', fontSize: '1rem' }}
                    >
                        Cancel
                    </Button>
                    <Typography sx={{ ml: 2, flex: 1, textAlign: 'center' }} variant="h6" component="div">
                        Add Exercise
                    </Typography>
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={onClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', pt: 2 }}>
                {fetchError && <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>{fetchError}</Alert>}

                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexShrink: 0, px: { xs: 0, sm: 1 } }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search Exercise"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                    <FormControl variant="outlined" sx={{ minWidth: { xs: 150, sm: 200 } }}>
                        <InputLabel>Muscle Group</InputLabel>
                        <Select
                            value={selectedMuscleGroup}
                            onChange={(e) => { setSelectedMuscleGroup(e.target.value); setCurrentPage(1); }}
                            label="Muscle Group"
                        >
                            {muscleGroups.map(group => (
                                <MenuItem key={group} value={group}>{group}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0, px: { xs: 0, sm: 1 } }}>
                    <Typography variant="body2">
                        Showing {paginatedDefinitions.length > 0 ? paginatedDefinitions.length : 0} of {filteredDefinitions.length} exercises
                    </Typography>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="items-per-page-label">Show</InputLabel>
                        <Select
                            labelId="items-per-page-label"
                            value={itemsPerPage === 'all' ? 'all' : itemsPerPage.toString()}
                            onChange={(e) => {
                                const val = e.target.value as string | number;
                                setItemsPerPage(val === 'all' ? 'all' : Number(val));
                                setCurrentPage(1);
                            }}
                            label="Show"
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={'all'}>
                                All ({filteredDefinitions.length})
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {isLoadingDefinitions && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, flexShrink: 0 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!isLoadingDefinitions && !fetchError && (
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', px: { xs: 0, sm: 1 } }}>
                        {paginatedDefinitions.length > 0 ? (
                            <Box
                                display="flex"
                                flexWrap="wrap"
                                gap={CARD_GAP} // Use theme spacing unit for gap
                                justifyContent="center" // Center cards if they don't fill the row
                            >
                                {paginatedDefinitions.map(definition => {
                                    const defIdStr = definition._id.toString();
                                    const isInPlan = existingExerciseDefinitionIds.includes(defIdStr);
                                    const tags = [definition.primaryMuscle, ...definition.secondaryMuscles].filter(Boolean).slice(0, 3);
                                    const imageUrl = definition.imageUrl;

                                    return (
                                        <Box
                                            key={defIdStr}
                                            sx={{
                                                flexGrow: 1, // Allow cards to grow
                                                flexBasis: `${CARD_MIN_WIDTH}px`, // Minimum width before wrapping
                                                maxWidth: 'calc(50% - 8px)', // Max 2 cards on smaller screens (50% - half gap)
                                                '@media (min-width:900px)': { // md breakpoint approx
                                                    maxWidth: `calc(33.333% - ${8 * 2 / 3}px)` // Max 3 cards (33% - 2/3 gap)
                                                },
                                                '@media (min-width:1200px)': { // lg breakpoint approx
                                                    maxWidth: `calc(25% - ${8 * 3 / 4}px)` // Max 4 cards (25% - 3/4 gap)
                                                }
                                            }}
                                        >
                                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                                {isInPlan && (
                                                    <CheckCircleIcon
                                                        color="success"
                                                        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'white', borderRadius: '50%' }}
                                                    />
                                                )}
                                                <CardActionArea onClick={() => handleExerciseCardClick(definition)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <CardMedia
                                                        component="img"
                                                        image={imageUrl || GENERIC_IMAGE_PLACEHOLDER}
                                                        alt={definition.name}
                                                        sx={{ height: 140, objectFit: 'contain', p: 1, mt: 1 }}
                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                            (e.target as HTMLImageElement).src = GENERIC_IMAGE_PLACEHOLDER;
                                                        }}
                                                    />
                                                    <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                                                        <Typography gutterBottom variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                                                            {definition.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                                                            {tags.slice(0, 2).map((tag: string) => (
                                                                <Chip key={tag} label={tag} size="small" />
                                                            ))}
                                                            {tags.length > 2 && <Chip label={`+${tags.length - 2}`} size="small" />}
                                                        </Box>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Box>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Typography sx={{ textAlign: 'center', mt: 3 }}>
                                {searchTerm || selectedMuscleGroup !== 'All' ? 'No exercises found matching your criteria.' : 'No exercises available.'}
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* Pagination Footer Area */}
            <Box
                sx={{
                    p: 1.5,
                    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                    flexShrink: 0,
                    backgroundColor: 'background.paper',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {totalPages > 1 && paginatedDefinitions.length > 0 && (
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size={isSmallScreenForPagination ? 'small' : 'medium'}
                    />
                )}
                {paginatedDefinitions.length === 0 && !isLoadingDefinitions && totalPages <= 1 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>No results to paginate</Typography>
                )}
            </Box>
        </Dialog>
    );
}; 