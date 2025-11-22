import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Collapse,
  Stack,
  CircularProgress,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore,
  ExpandLess,
  SmartToy as AIIcon,
  Person as PersonIcon,
  DoneAll as ApproveAllIcon,
} from '@mui/icons-material';
import { AIActionCard } from './AIActionCard';
import { AIActionHistory } from './AIActionHistory';
import { getAllModels } from '@/server/ai/models';
import type { ChatMessage } from '@/apis/trainingPlanAI/types';

const AVAILABLE_MODELS = getAllModels();

interface AIChatPanelProps {
  planId?: string;
  messages: ChatMessage[];
  isProcessing: boolean;
  error: string | null;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onSendMessage: (message: string) => void;
  onConfirmAction: (actionId: string) => void;
  onRejectAction: (actionId: string) => void;
  onUndoAction: (actionId: string) => void;
  actionHistory: ChatMessage['actions'];
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  planId,
  messages,
  isProcessing,
  error,
  selectedModel,
  onModelChange,
  onSendMessage,
  onConfirmAction,
  onRejectAction,
  onUndoAction,
  actionHistory = [],
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSend = useCallback(() => {
    if (inputMessage.trim() && !isProcessing) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  }, [inputMessage, isProcessing, onSendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handler for "Approve All" button
  const handleApproveAll = useCallback(() => {
    // Get all pending actions from current messages
    const pendingActions = messages
      .flatMap(msg => msg.actions || [])
      .filter(action => action.status === 'pending');
    
    // Confirm all pending actions sequentially
    pendingActions.forEach(action => {
      onConfirmAction(action._id);
    });
  }, [messages, onConfirmAction]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: { xs: 56, sm: 0 }, // Add space for bottom navbar on mobile
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: '16px 16px 0 0',
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          cursor: 'pointer',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AIIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              AI Training Plan Assistant
            </Typography>
            {!planId && (
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                Create plans from scratch
              </Typography>
            )}
          </Box>
        </Stack>

        <IconButton color="inherit" size="small">
          {isExpanded ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>

      {/* Chat Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
          {/* Tabs for Chat and History */}
          <Stack direction="row" spacing={1} sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              variant={!showHistory ? 'contained' : 'text'}
              size="small"
              onClick={() => setShowHistory(false)}
            >
              Chat
            </Button>
            <Button
              variant={showHistory ? 'contained' : 'text'}
              size="small"
              onClick={() => setShowHistory(true)}
            >
              History ({actionHistory.length})
            </Button>
          </Stack>

          {/* Messages or History */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {!showHistory ? (
              <>
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AIIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Ask me to help manage your training plan!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {planId 
                        ? 'For example: "Add bench press 3 sets of 10 reps" or "Create a new workout called Push Day"'
                        : 'For example: "Create a new training plan called Summer Workout for 8 weeks" or "Add a plan for strength training"'
                      }
                    </Typography>
                  </Box>
                )}

                {messages.map((message) => (
                  <Box key={message.id} sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
                      {message.role === 'user' ? (
                        <PersonIcon color="action" />
                      ) : (
                        <AIIcon color="primary" />
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {message.role === 'user' ? 'You' : 'AI Assistant'} •{' '}
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {message.content}
                        </Typography>
                      </Box>
                    </Stack>

                    {message.actions && message.actions.length > 0 && (
                      <Box sx={{ ml: 4, mt: 1 }}>
                        {/* Show "Approve All" button if there are multiple pending actions */}
                        {message.actions.filter(a => a.status === 'pending').length > 1 && (
                          <Box sx={{ mb: 2 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<ApproveAllIcon />}
                              onClick={handleApproveAll}
                              disabled={isProcessing}
                            >
                              Approve All ({message.actions.filter(a => a.status === 'pending').length})
                            </Button>
                          </Box>
                        )}
                        
                        {message.actions.map((action) => (
                          <AIActionCard
                            key={action._id}
                            action={action}
                            onConfirm={onConfirmAction}
                            onReject={onRejectAction}
                            onUndo={onUndoAction}
                            isProcessing={isProcessing}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}

                {isProcessing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      AI is thinking...
                    </Typography>
                  </Box>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                <div ref={messagesEndRef} />
              </>
            ) : (
              <AIActionHistory
                actions={actionHistory}
                onUndo={onUndoAction}
                isProcessing={isProcessing}
              />
            )}
          </Box>

          <Divider />

          {/* Input Area */}
          <Box sx={{ p: 2 }}>
            {/* Model Selector */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Model:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1, maxWidth: 400 }}>
                <Select
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                      <Typography component="span" sx={{ ml: 1, opacity: 0.6, fontSize: '0.75rem' }}>
                        ({model.provider})
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Message Input */}
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder={
                  planId
                    ? 'Ask the AI to modify your plan...'
                    : 'Ask the AI to create a training plan...'
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isProcessing}
                multiline
                maxRows={3}
              />
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={!inputMessage.trim() || isProcessing}
                endIcon={<SendIcon />}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

