import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Stack,
  CircularProgress,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  Fade,
  Badge,
  Tooltip,
  Fab,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  DoneAll as ApproveAllIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
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
  onConfirmMultipleActions: (actionIds: string[]) => void;
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
  onConfirmMultipleActions,
  onRejectAction,
  onUndoAction,
  actionHistory = [],
}) => {
  const theme = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme.palette.mode === 'dark';

  // Count pending actions for badge
  const pendingCount = messages
    .flatMap(msg => msg.actions || [])
    .filter(action => action.status === 'pending').length;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
    const pendingActions = messages
      .flatMap(msg => msg.actions || [])
      .filter(action => action.status === 'pending');
    
    if (pendingActions.length > 0) {
      onConfirmMultipleActions(pendingActions.map(action => action._id));
    }
  }, [messages, onConfirmMultipleActions]);

  return (
    <>
      {/* Floating Chat Button */}
      <Tooltip title="AI Assistant" placement="left">
        <Badge
          badgeContent={pendingCount}
          color="error"
          overlap="circular"
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1300,
          }}
        >
          <Fab
            color="primary"
            onClick={() => setIsOpen(!isOpen)}
            sx={{
              width: 60,
              height: 60,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 24px rgba(102, 126, 234, 0.6)',
              },
            }}
          >
            <AIIcon sx={{ fontSize: 32 }} />
          </Fab>
        </Badge>
      </Tooltip>

      {/* Floating Chat Widget */}
      <Fade in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 150, sm: 100 },
            right: { xs: 16, sm: 24 },
            width: { xs: 'calc(100vw - 32px)', sm: 400, md: 450 },
            maxHeight: { xs: 'calc(100vh - 220px)', sm: 600 },
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            zIndex: 1300,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0,0,0,0.6)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
            bgcolor: isDark ? 'grey.900' : 'background.paper',
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <AIIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                  {planId ? 'Training Plan Helper' : 'Create Plans from Scratch'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5}>
              <Tooltip title={showHistory ? 'Show Chat' : 'Show History'}>
                <IconButton
                  size="small"
                  onClick={() => setShowHistory(!showHistory)}
                  sx={{ color: 'white' }}
                >
                  {showHistory ? <ChatIcon fontSize="small" /> : <HistoryIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={() => setIsOpen(false)}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Chat Content */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            bgcolor: isDark ? 'grey.900' : 'grey.50', 
            p: 2 
          }}>
            {!showHistory ? (
              <>
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <AIIcon sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" color="text.primary" gutterBottom>
                      AI Training Assistant
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {planId 
                        ? 'Ask me to help manage your training plan!'
                        : 'Let me help you create a training plan!'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {planId 
                        ? 'Try: "Add bench press 3x10" or "Create a push day workout"'
                        : 'Try: "Create a 4-week beginner plan"'}
                    </Typography>
                  </Box>
                )}

                {messages.map((message) => (
                  <Box key={message.id} sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
                      {message.role === 'user' ? (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 20, color: 'white' }} />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <AIIcon sx={{ fontSize: 20, color: 'white' }} />
                        </Box>
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            bgcolor: message.role === 'user' 
                              ? 'primary.main' 
                              : isDark ? 'grey.800' : 'white',
                            color: message.role === 'user' 
                              ? 'white' 
                              : 'text.primary',
                            p: 1.5,
                            borderRadius: 2,
                            boxShadow: isDark ? 2 : 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.content}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>

                    {message.actions && message.actions.length > 0 && (
                      <Box sx={{ ml: 5, mt: 1 }}>
                        {message.actions.filter(a => a.status === 'pending').length > 1 && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<ApproveAllIcon />}
                            onClick={handleApproveAll}
                            disabled={isProcessing}
                            sx={{ mb: 1 }}
                          >
                            Approve All ({message.actions.filter(a => a.status === 'pending').length})
                          </Button>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
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
          <Box sx={{ p: 2, bgcolor: isDark ? 'grey.900' : 'white' }}>
            {/* Model Selector */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Model:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 180, flexGrow: 1 }}>
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
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!inputMessage.trim() || isProcessing}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                  '&:disabled': {
                    background: isDark ? 'grey.800' : 'grey.300',
                    color: isDark ? 'grey.600' : 'grey.500',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};
