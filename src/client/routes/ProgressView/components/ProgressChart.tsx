import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { format, eachDayOfInterval } from 'date-fns';
import { DailyActivitySummary } from '@/apis/progressView/types';
import { alpha as muiAlpha } from '@mui/material/styles';

// Constants
const NEON_PURPLE = '#9c27b0';
const NEON_BLUE = '#2196f3';
const NEON_GREEN = '#4caf50';

// Chart colors for muscle groups
const MUSCLE_GROUP_COLORS = [
    '#4caf50', // Green
    '#2196f3', // Blue
    '#9c27b0', // Purple
    '#ff9800', // Orange
    '#f44336', // Red
    '#009688', // Teal
    '#673ab7', // Deep Purple
    '#3f51b5', // Indigo
    '#8bc34a', // Light Green
    '#cddc39', // Lime
    '#ffeb3b', // Yellow
];

interface ChartDataItem {
    date: string;
    totalSets: number;
    exerciseCount: number;
    [key: string]: number | string; // For muscle groups
}

interface ProgressChartProps {
    activityData: DailyActivitySummary[];
    startDate: Date;
    endDate: Date;
}

// Type definition for payload item
interface PayloadItem {
    name: string;
    value: number;
    color: string;
    fill: string;
    payload: {
        date: string;
        [key: string]: string | number; // Replaced any with more specific types
    };
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ activityData, startDate, endDate }) => {
    const [chartType, setChartType] = useState<'area' | 'bar' | 'pie'>('area');

    // Format date to a more readable format
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '';
        return format(new Date(dateString), 'MMM dd');
    };

    // Fill in missing days in the date range
    const fillMissingDays = () => {
        const dateMap = new Map<string, DailyActivitySummary>();
        
        // Create a map of existing data
        activityData.forEach(item => {
            dateMap.set(item.date, item);
        });

        // Generate all dates in the range
        const allDates = eachDayOfInterval({ start: startDate, end: endDate });
        
        // Create complete dataset with zero values for missing dates
        return allDates.map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            if (dateMap.has(dateString)) {
                return dateMap.get(dateString);
            }
            return {
                date: dateString,
                totalSetsCompleted: 0,
                totalExercisesCompleted: 0,
                exerciseTypes: {}
            };
        });
    };

    // Process data for charts
    const chartData: ChartDataItem[] = useMemo(() => {
        const completeData = fillMissingDays();
        
        return completeData.map(day => {
            const item: ChartDataItem = {
                date: day?.date || '',
                totalSets: day?.totalSetsCompleted || 0,
                exerciseCount: day?.totalExercisesCompleted || 0,
            };
            
            // Add muscle groups as separate properties
            if (day?.exerciseTypes) {
                Object.entries(day.exerciseTypes).forEach(([muscle, count]) => {
                    item[muscle] = count as number;
                });
            }
            
            return item;
        });
    }, [activityData, startDate, endDate]);

    // Calculate totals for summary
    const totalSets = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.totalSets, 0);
    }, [chartData]);

    const totalExercises = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.exerciseCount, 0);
    }, [chartData]);

    const activeDays = useMemo(() => {
        return chartData.filter(item => item.totalSets > 0).length;
    }, [chartData]);

    // Create muscle group data for pie chart
    const muscleGroupData = useMemo(() => {
        const muscleGroups: { [key: string]: number } = {};
        
        // Aggregate sets by muscle group
        chartData.forEach(day => {
            Object.entries(day).forEach(([key, value]) => {
                // Skip non-muscle group properties
                if (['date', 'totalSets', 'exerciseCount'].includes(key)) {
                    return;
                }
                
                if (typeof value === 'number') {
                    muscleGroups[key] = (muscleGroups[key] || 0) + value;
                }
            });
        });
        
        // Convert to array format for pie chart
        return Object.entries(muscleGroups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort by descending value
    }, [chartData]);

    // Customize tooltip for area/bar charts
    const CustomTooltip = (props: { active?: boolean; payload?: PayloadItem[]; label?: string }) => {
        const { active, payload, label } = props;
        if (active && payload && payload.length) {
            return (
                <Paper
                    sx={{
                        p: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: 1.5
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {formatDate(label)}
                    </Typography>
                    
                    {payload.map((entry, index) => (
                        <Typography 
                            key={`item-${index}`} 
                            variant="body2" 
                            sx={{ color: entry.color, display: 'flex', alignItems: 'center' }}
                        >
                            <Box component="span" 
                                sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    bgcolor: entry.color, 
                                    display: 'inline-block',
                                    mr: 1
                                }} 
                            />
                            {entry.name}: {entry.value}
                        </Typography>
                    ))}
                </Paper>
            );
        }
        return null;
    };

    // Customize tooltip for pie chart
    const CustomPieTooltip = (props: { active?: boolean; payload?: PayloadItem[] }) => {
        const { active, payload } = props;
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <Paper
                    sx={{
                        p: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: 1.5
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {data.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: data.payload.fill }}>
                        Sets: {data.value} ({((data.value / totalSets) * 100).toFixed(1)}%)
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Progress Chart
                </Typography>
                
                <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={(_e, newValue) => newValue && setChartType(newValue)}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            textTransform: 'none',
                            px: 2
                        },
                        '& .Mui-selected': {
                            bgcolor: `${muiAlpha(NEON_PURPLE, 0.1)} !important`,
                            color: `${NEON_PURPLE} !important`,
                            fontWeight: 'bold'
                        }
                    }}
                >
                    <ToggleButton value="area">Area</ToggleButton>
                    <ToggleButton value="bar">Bar</ToggleButton>
                    <ToggleButton value="pie">Muscle Groups</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Stats summary cards */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '250px' }}>
                    <Card 
                        elevation={1}
                        sx={{ 
                            borderRadius: 2,
                            border: `1px solid ${muiAlpha(NEON_GREEN, 0.3)}`,
                            bgcolor: muiAlpha(NEON_GREEN, 0.05)
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: NEON_GREEN }}>
                                {totalSets}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Sets Completed
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '250px' }}>
                    <Card 
                        elevation={1}
                        sx={{ 
                            borderRadius: 2,
                            border: `1px solid ${muiAlpha(NEON_BLUE, 0.3)}`,
                            bgcolor: muiAlpha(NEON_BLUE, 0.05)
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: NEON_BLUE }}>
                                {totalExercises}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Exercises Performed
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '250px' }}>
                    <Card 
                        elevation={1}
                        sx={{ 
                            borderRadius: 2,
                            border: `1px solid ${muiAlpha(NEON_PURPLE, 0.3)}`,
                            bgcolor: muiAlpha(NEON_PURPLE, 0.05)
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: NEON_PURPLE }}>
                                {activeDays}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Active Days
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* No data message */}
            {totalSets === 0 && (
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        bgcolor: muiAlpha(NEON_BLUE, 0.05),
                        border: `1px dashed ${muiAlpha(NEON_BLUE, 0.3)}`,
                        borderRadius: 2,
                        mb: 3
                    }}
                >
                    <Typography variant="body1" color="text.secondary">
                        No activity data found for the selected date range.
                    </Typography>
                </Paper>
            )}

            {/* Chart container */}
            {totalSets > 0 && (
                <Paper 
                    elevation={2}
                    sx={{ 
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        height: 400
                    }}
                >
                    {chartType === 'area' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={muiAlpha('#000', 0.1)} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={formatDate}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    domain={[0, 'auto']}
                                    allowDecimals={false}
                                    width={40}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="totalSets"
                                    name="Sets"
                                    stroke={NEON_BLUE}
                                    fill={muiAlpha(NEON_BLUE, 0.2)}
                                    activeDot={{ r: 6 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="exerciseCount"
                                    name="Exercises"
                                    stroke={NEON_PURPLE}
                                    fill={muiAlpha(NEON_PURPLE, 0.2)}
                                    activeDot={{ r: 6 }}
                                />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}

                    {chartType === 'bar' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={muiAlpha('#000', 0.1)} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={formatDate}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    domain={[0, 'auto']}
                                    allowDecimals={false}
                                    width={40}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="totalSets"
                                    name="Sets"
                                    fill={NEON_BLUE}
                                    radius={[4, 4, 0, 0]}
                                />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {chartType === 'pie' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={muscleGroupData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                    label={(entry) => entry.name}
                                    labelLine={false}
                                >
                                    {muscleGroupData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={MUSCLE_GROUP_COLORS[index % MUSCLE_GROUP_COLORS.length]} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            )}
        </Box>
    );
}; 