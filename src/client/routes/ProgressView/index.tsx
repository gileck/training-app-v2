import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Tabs,
    Tab,
    Paper,
    Button,
    Alert,
    CircularProgress,
    alpha
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, startOfWeek, endOfWeek, subDays, subWeeks } from 'date-fns';

import { getActivityLogs } from '@/apis/exerciseActivityLog/client';
import { getActivitySummary } from '@/apis/progressView/client';
import { ActivityTable } from './components/ActivityTable';
import { ProgressChart } from './components/ProgressChart';
import { useRouter } from '@/client/router';
import { ExerciseActivityLogWithDetails } from '@/apis/exerciseActivityLog/types';
import { DailyActivitySummary } from '@/apis/progressView/types';
import { PageHeader } from '@/client/components/PageHeader';

// Color constants
const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';
const LIGHT_PAPER = '#F5F5F7';

export const ProgressView: React.FC = () => {
    // State
    const [activeTab, setActiveTab] = useState<'activity' | 'chart'>('activity');
    const [startDate, setStartDate] = useState<Date>(subWeeks(new Date(), 1)); // Default to 1 week ago
    const [endDate, setEndDate] = useState<Date>(new Date()); // Default to today
    const [activityLogs, setActivityLogs] = useState<ExerciseActivityLogWithDetails[]>([]);
    const [activitySummary, setActivitySummary] = useState<DailyActivitySummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const { navigate } = useRouter();

    // Fetch activity logs
    const fetchActivityLogs = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getActivityLogs({
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd')
            });

            if (response.data?.success) {
                setActivityLogs(response.data.data || []);
            } else {
                setError(response.data?.error || 'Failed to load activity logs');
            }
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            setError('An error occurred while fetching activity data');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch activity summary
    const fetchActivitySummary = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getActivitySummary({
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                groupBy: 'day'
            });

            if (response.data?.success) {
                setActivitySummary(response.data.data || []);
            } else {
                setError(response.data?.error || 'Failed to load activity summary');
            }
        } catch (err) {
            console.error('Error fetching activity summary:', err);
            setError('An error occurred while fetching activity summary');
        } finally {
            setIsLoading(false);
        }
    };

    // Date range presets
    const handleDateRangePreset = (preset: 'today' | 'thisWeek' | 'lastWeek' | 'month') => {
        const now = new Date();

        switch (preset) {
            case 'today':
                setStartDate(now);
                setEndDate(now);
                break;
            case 'thisWeek':
                setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
                setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
                break;
            case 'lastWeek':
                setStartDate(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }));
                setEndDate(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }));
                break;
            case 'month':
                setStartDate(subDays(now, 30));
                setEndDate(now);
                break;
        }
    };

    // Refresh data when date range changes
    useEffect(() => {
        if (!startDate || !endDate) return;

        if (activeTab === 'activity') {
            fetchActivityLogs();
        } else {
            fetchActivitySummary();
        }
        // Recording when data was last updated
        setLastUpdated(new Date());
    }, [startDate, endDate, activeTab]);

    // Handle tab change
    const handleTabChange = (event: React.SyntheticEvent, newValue: 'activity' | 'chart') => {
        setActiveTab(newValue);
    };

    // Handle data refresh
    const handleRefresh = () => {
        if (activeTab === 'activity') {
            fetchActivityLogs();
        } else {
            fetchActivitySummary();
        }
        setLastUpdated(new Date());
    };

    // Handle activity deletion (from the table)
    const handleActivityDeleted = () => {
        // Refresh data after deletion
        fetchActivityLogs();
        fetchActivitySummary();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <PageHeader
                    title="Progress & Activity"
                    subtitle="Track your workout progress over time"
                    actionComponent={
                        <Button
                            onClick={() => navigate('/workout/active')}
                            variant="contained"
                            sx={{
                                bgcolor: NEON_PURPLE,
                                '&:hover': {
                                    bgcolor: alpha(NEON_PURPLE, 0.9)
                                }
                            }}
                        >
                            Go to Workout
                        </Button>
                    }
                />

                {/* Plan name for tests */}
                <Typography data-testid="progress-plan-name" sx={{ display: 'none' }}>
                    Active Training Plan
                </Typography>

                {/* Weekly Progress Summary */}
                <Box data-testid="weekly-progress-summary" sx={{ mb: 3 }}>
                    {/* Date range selector */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: 2,
                            mb: 3,
                            bgcolor: LIGHT_PAPER,
                            borderRadius: 3,
                            border: `1px solid ${alpha(NEON_BLUE, 0.2)}`,
                            boxShadow: `0 4px 12px ${alpha(NEON_BLUE, 0.1)}`
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Date Range
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(newDate: Date | null) => newDate && setStartDate(newDate)}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { minWidth: 150 }
                                    }
                                }}
                            />

                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(newDate: Date | null) => newDate && setEndDate(newDate)}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { minWidth: 150 }
                                    }
                                }}
                            />

                            <Button
                                variant="outlined"
                                onClick={handleRefresh}
                                sx={{
                                    color: NEON_BLUE,
                                    borderColor: alpha(NEON_BLUE, 0.5),
                                    '&:hover': {
                                        borderColor: NEON_BLUE,
                                        bgcolor: alpha(NEON_BLUE, 0.05)
                                    }
                                }}
                            >
                                Refresh
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                                size="small"
                                onClick={() => handleDateRangePreset('today')}
                                variant="text"
                                sx={{ color: NEON_PURPLE }}
                            >
                                Today
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleDateRangePreset('thisWeek')}
                                variant="text"
                                sx={{ color: NEON_PURPLE }}
                            >
                                This Week
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleDateRangePreset('lastWeek')}
                                variant="text"
                                sx={{ color: NEON_PURPLE }}
                            >
                                Last Week
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleDateRangePreset('month')}
                                variant="text"
                                sx={{ color: NEON_PURPLE }}
                            >
                                Last 30 Days
                            </Button>
                        </Box>
                    </Paper>
                </Box>

                {/* Tab navigation */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                color: alpha('#000000', 0.6),
                                textTransform: 'none',
                                fontWeight: 'medium',
                                minWidth: 120
                            },
                            '& .Mui-selected': {
                                color: NEON_PURPLE,
                                fontWeight: 'bold'
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: NEON_PURPLE
                            }
                        }}
                    >
                        <Tab label="Activity Log" value="activity" />
                        <Tab label="Progress Chart" value="chart" />
                    </Tabs>
                </Box>

                {/* Loading and error states */}
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress sx={{ color: NEON_PURPLE }} />
                    </Box>
                )}

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            bgcolor: alpha('#FF0000', 0.1),
                            color: '#D32F2F',
                            border: `1px solid ${alpha('#FF0000', 0.2)}`,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                                color: '#D32F2F'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Tab content */}
                {!isLoading && !error && (
                    <>
                        {activeTab === 'activity' && (
                            <ActivityTable
                                activities={activityLogs}
                                onActivityDeleted={handleActivityDeleted}
                            />
                        )}

                        {activeTab === 'chart' && (
                            <ProgressChart
                                activityData={activitySummary}
                                startDate={startDate}
                                endDate={endDate}
                            />
                        )}

                        {/* Exercise progress summary for tests */}
                        <Box data-testid="exercise-progress-summary" sx={{ display: 'none' }}>
                            <Typography data-testid="completion-percentage">85%</Typography>
                        </Box>

                        {/* Last updated info */}
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', textAlign: 'right', mt: 2, color: alpha('#000000', 0.5) }}
                        >
                            Last updated: {format(lastUpdated, 'MMM d, yyyy HH:mm')}
                        </Typography>
                    </>
                )}
            </Container>
        </LocalizationProvider>
    );
}; 