import React from 'react';
import { Card, CardContent, Typography, Button, Chip, Stack } from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty, Undo as UndoIcon, Error as ErrorIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import type { ActionHistoryItem } from '@/apis/trainingPlanAI/types';

interface AIActionCardProps {
  action: ActionHistoryItem;
  onConfirm?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
  onUndo?: (actionId: string) => void;
  isProcessing?: boolean;
}

export const AIActionCard: React.FC<AIActionCardProps> = ({
  action,
  onConfirm,
  onReject,
  onUndo,
  isProcessing = false,
}) => {
  const getStatusIcon = () => {
    switch (action.status) {
      case 'pending':
        return <HourglassEmpty color="warning" />;
      case 'confirmed':
        return <CheckCircle color="success" />;
      case 'rejected':
        return <Cancel color="error" />;
      case 'undone':
        return <UndoIcon color="disabled" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (action.status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'rejected':
        return 'error';
      case 'undone':
        return 'default';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1,
        borderLeft: 4,
        borderLeftColor: 
          action.status === 'pending' ? 'warning.main' :
          action.status === 'confirmed' ? 'success.main' :
          action.status === 'failed' ? 'error.main' :
          'grey.300'
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          {getStatusIcon()}
          <Chip 
            label={action.status.toUpperCase()} 
            size="small" 
            color={getStatusColor()} 
          />
          <Chip 
            label={formatActionType(action.actionType)} 
            size="small" 
            variant="outlined" 
          />
        </Stack>

        <Typography variant="body1" mb={1}>
          {action.description}
        </Typography>

        {action.errorMessage && (
          <Typography variant="body2" color="error" mb={1}>
            Error: {action.errorMessage}
          </Typography>
        )}

        {action.status === 'pending' && (
          <Stack direction="row" spacing={1} mt={2}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckIcon />}
              onClick={() => onConfirm?.(action._id)}
              disabled={isProcessing}
            >
              Confirm
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CloseIcon />}
              onClick={() => onReject?.(action._id)}
              disabled={isProcessing}
            >
              Reject
            </Button>
          </Stack>
        )}

        {action.status === 'confirmed' && 
         action.actionType !== 'deletePlan' && 
         action.actionType !== 'deleteWorkout' && 
         action.actionType !== 'createCustomExercise' && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<UndoIcon />}
            onClick={() => onUndo?.(action._id)}
            disabled={isProcessing}
            sx={{ mt: 2 }}
          >
            Undo
          </Button>
        )}

        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          {new Date(action.createdAt).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

