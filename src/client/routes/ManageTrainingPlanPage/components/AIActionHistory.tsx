import React from 'react';
import { Box, Typography, Paper, Divider, Stack, Chip } from '@mui/material';
import { AIActionCard } from './AIActionCard';
import type { ActionHistoryItem } from '@/apis/trainingPlanAI/types';

interface AIActionHistoryProps {
  actions: ActionHistoryItem[];
  onUndo?: (actionId: string) => void;
  isProcessing?: boolean;
}

export const AIActionHistory: React.FC<AIActionHistoryProps> = ({
  actions,
  onUndo,
  isProcessing = false,
}) => {
  // Filter to show only confirmed, undone, or failed actions
  const historyActions = actions.filter(
    a => a.status === 'confirmed' || a.status === 'undone' || a.status === 'failed'
  );

  if (historyActions.length === 0) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No action history yet. Confirmed actions will appear here.
        </Typography>
      </Paper>
    );
  }

  // Group actions by status
  const confirmedActions = historyActions.filter(a => a.status === 'confirmed');
  const undoneActions = historyActions.filter(a => a.status === 'undone');
  const failedActions = historyActions.filter(a => a.status === 'failed');

  return (
    <Box>
      <Stack direction="row" spacing={1} mb={2}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Action History
        </Typography>
        {confirmedActions.length > 0 && (
          <Chip label={`${confirmedActions.length} confirmed`} color="success" size="small" />
        )}
        {undoneActions.length > 0 && (
          <Chip label={`${undoneActions.length} undone`} color="default" size="small" />
        )}
        {failedActions.length > 0 && (
          <Chip label={`${failedActions.length} failed`} color="error" size="small" />
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {historyActions.map((action) => (
          <AIActionCard
            key={action._id}
            action={action}
            onUndo={onUndo}
            isProcessing={isProcessing}
          />
        ))}
      </Box>
    </Box>
  );
};

