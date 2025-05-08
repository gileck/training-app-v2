import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  LinearProgress,
  alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface PlanWeekHeaderProps {
  currentWeek: number;
  maxWeeks: number;
  onNavigate: (week: number) => void;
  isWeekLoading?: boolean;
  progressPercentage: number;
  completedExercisesCount: number;
  totalExercises: number;
}

const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';
const LIGHT_PAPER = '#F5F5F7';

export const PlanWeekHeader: React.FC<PlanWeekHeaderProps> = ({
  currentWeek,
  maxWeeks,
  onNavigate,
  isWeekLoading = false,
  progressPercentage,
  completedExercisesCount,
  totalExercises
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        mb: 3,
        bgcolor: LIGHT_PAPER,
        borderRadius: 4,
        overflow: 'hidden',
        border: `1px solid ${alpha(NEON_PURPLE, 0.2)}`,
        boxShadow: `0 4px 12px ${alpha(NEON_PURPLE, 0.15)}`,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      {/* Week Navigator */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <IconButton
          onClick={() => onNavigate(currentWeek - 1)}
          disabled={currentWeek <= 1 || isWeekLoading}
          sx={{
            color: NEON_PURPLE,
            '&.Mui-disabled': { color: alpha(NEON_PURPLE, 0.3) }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {isWeekLoading && (
            <CircularProgress size={24} sx={{ color: NEON_BLUE, position: 'absolute', left: -36, mx: 'auto' }} />
          )}
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#333', textShadow: `0 0 1px ${alpha(NEON_PURPLE, 0.3)}` }}
          >
            WEEK {currentWeek} / {maxWeeks}
          </Typography>
        </Box>
        <IconButton
          onClick={() => onNavigate(currentWeek + 1)}
          disabled={currentWeek >= maxWeeks || isWeekLoading}
          sx={{
            color: NEON_PURPLE,
            '&.Mui-disabled': { color: alpha(NEON_PURPLE, 0.3) }
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Stack>

      {/* Weekly Progress */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#222' }}>
            Weekly Progress
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: NEON_BLUE }}>
            {progressPercentage}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(NEON_BLUE, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: NEON_BLUE,
              borderRadius: 4,
            }
          }}
        />
        <Typography
          variant="body2"
          sx={{ color: alpha('#000', 0.7), mt: 1, textAlign: 'center', fontWeight: 400 }}
        >
          {completedExercisesCount} of {totalExercises} exercises completed
        </Typography>
      </Box>
    </Paper>
  );
}; 