import { useEffect, useState, FC, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  LinearProgress,
  alpha,
  keyframes
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '@mui/material/styles';

interface PlanWeekHeaderProps {
  currentWeek: number;
  maxWeeks: number;
  onNavigate: (week: number) => void;
  isWeekLoading?: boolean;
  isSyncingFromServer?: boolean;
  progressPercentage: number;
  completedSetsCount: number;
  totalSetsCount: number;
}

// Colors derived from theme for light/dark support

// Define animations
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const shimmerAnimation = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// Keyframes that will be themed inside the component using useMemo

export const PlanWeekHeader: FC<PlanWeekHeaderProps> = ({
  currentWeek,
  maxWeeks,
  onNavigate,
  isWeekLoading = false,
  isSyncingFromServer = false,
  progressPercentage,
  completedSetsCount,
  totalSetsCount
}) => {
  const theme = useTheme();
  const isCompleted = progressPercentage >= 100;
  const [showAnimation, setShowAnimation] = useState(false);

  // Create a ref to store whether this component has already shown an animation
  // this ensures the animation won't play again during the current session
  const hasShownAnimationRef = useRef(false);

  // Check if we just completed the week (only once when the component mounts)
  useEffect(() => {
    // Create a unique key based on the week number
    const storageKey = `week_${currentWeek}_completed`;

    // Only show animation if:
    // 1. The week is completed
    // 2. We haven't shown the animation in this session (using the ref)
    // 3. We haven't shown the animation before (using localStorage)
    const hasAnimatedBefore = localStorage.getItem(storageKey) === 'true';

    // Only trigger animation if the week is complete, hasn't been animated this session,
    // and hasn't been animated before (stored in localStorage)
    if (isCompleted && !hasShownAnimationRef.current && !hasAnimatedBefore &&
      completedSetsCount > 0 && completedSetsCount === totalSetsCount) {

      // Mark as animated in this session
      hasShownAnimationRef.current = true;

      // Mark as animated in localStorage for future sessions
      localStorage.setItem(storageKey, 'true');

      // Show the animation
      setShowAnimation(true);

      // Set a timer to hide the animation
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 3000); // Animation lasts for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isCompleted, completedSetsCount, totalSetsCount, currentWeek]);

  // Themed values
  const accentColor = isCompleted ? theme.palette.success.main : theme.palette.primary.main;
  const paperBg = theme.palette.background.paper;
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;

  // Build keyframes that depend on theme colors
  const borderAnimation = useMemo(() => keyframes`
    0% { box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0.7)}; }
    70% { box-shadow: 0 0 0 8px ${alpha(theme.palette.success.main, 0)}; }
    100% { box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0)}; }
  `, [theme.palette.success.main]);

  const glowingBorderAnimation = useMemo(() => keyframes`
    0% { border-color: ${alpha(theme.palette.success.main, 0.3)}; box-shadow: 0 0 5px ${alpha(theme.palette.success.main, 0.3)}; }
    50% { border-color: ${alpha(theme.palette.success.main, 0.8)}; box-shadow: 0 0 20px ${alpha(theme.palette.success.main, 0.8)}; }
    100% { border-color: ${alpha(theme.palette.success.main, 0.3)}; box-shadow: 0 0 5px ${alpha(theme.palette.success.main, 0.3)}; }
  `, [theme.palette.success.main]);

  // Define styles based on completion state
  const paperStyles = {
    mb: 3,
    bgcolor: paperBg,
    borderRadius: 4,
    overflow: 'hidden',
    border: `${isCompleted ? 2 : 1}px solid ${alpha(accentColor, isCompleted ? 0.5 : 0.2)}`,
    boxShadow: `0 4px 12px ${alpha(accentColor, 0.15)}`,
    p: { xs: 2, sm: 2.5 },
    position: 'relative',
  };

  // Add animation styles only when needed
  if (showAnimation && isCompleted) {
    Object.assign(paperStyles, {
      animation: `${glowingBorderAnimation} 2s infinite ease-in-out`,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: '20px',
        padding: '2px',
        background: `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.5)} 0%, ${alpha(theme.palette.success.main, 1)} 50%, ${alpha(theme.palette.success.main, 0.5)} 100%)`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        animation: `${borderAnimation} 1s ease-in-out infinite`,
      }
    });
  } else if (showAnimation) {
    Object.assign(paperStyles, {
      animation: `${pulseAnimation} 1s ease-in-out`,
    });
  }

  return (
    <Paper
      elevation={2}
      sx={paperStyles}
    >
      {/* Week Navigator */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <IconButton
          onClick={() => onNavigate(currentWeek - 1)}
          disabled={currentWeek <= 1 || isWeekLoading}
          sx={{
            color: accentColor,
            '&.Mui-disabled': { color: alpha(accentColor, 0.3) }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: textPrimary,
              textShadow: `0 0 1px ${alpha(accentColor, 0.3)}`,
              display: 'flex',
              alignItems: 'center',
              ...(showAnimation && isCompleted && {
                color: theme.palette.success.main,
                transition: 'color 0.5s ease-in-out',
              }),
            }}
          >
            WEEK {currentWeek} / {maxWeeks}
            {isCompleted && (
              <CheckCircleIcon
                sx={{
                  ml: 1,
                  color: theme.palette.success.main,
                  ...(showAnimation && {
                    animation: `${pulseAnimation} 0.5s ease-in-out infinite`,
                  }),
                }}
              />
            )}
          </Typography>
        </Box>
        <IconButton
          onClick={() => onNavigate(currentWeek + 1)}
          disabled={currentWeek >= maxWeeks || isWeekLoading}
          sx={{
            color: accentColor,
            '&.Mui-disabled': { color: alpha(accentColor, 0.3) }
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Stack>

      {/* Weekly Progress */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: textPrimary }}>
            Weekly Progress
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: accentColor,
              ...(showAnimation && isCompleted && {
                fontWeight: 700,
                animation: `${pulseAnimation} 0.5s ease-in-out infinite`,
              }),
            }}
          >
            {progressPercentage}%
          </Typography>
        </Stack>
        <Box sx={{ position: 'relative' }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 10,
              borderRadius: 2,
              bgcolor: alpha(accentColor, 0.15),
              '& .MuiLinearProgress-bar': {
                bgcolor: accentColor,
                borderRadius: 2,
                transition: 'transform .4s linear',
                ...(showAnimation && isCompleted && {
                  animation: `${shimmerAnimation} 2s infinite`,
                  backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.main, 0.5)} 50%, ${alpha(theme.palette.success.main, 0.15)} 100%)`,
                  backgroundSize: '200% 100%',
                }),
              }
            }}
          />
          {isSyncingFromServer && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 10,
                borderRadius: 2,
                bgcolor: 'transparent',
                '& .MuiLinearProgress-bar': {
                  bgcolor: alpha(theme.palette.warning.main, 0.6),
                  borderRadius: 2,
                }
              }}
            />
          )}
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
          <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 500 }}>
            Sets: {completedSetsCount}/{totalSetsCount}
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 500 }}>
            {isCompleted ? 'Week Complete!' : 'Keep Going!'}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}; 