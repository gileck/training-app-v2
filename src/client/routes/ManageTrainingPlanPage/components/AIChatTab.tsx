import React from 'react';
import { Box, Stack, TextField, Button, Typography } from '@mui/material';

interface AIChatTabProps {
    planId?: string;
}

export const AIChatTab: React.FC<AIChatTabProps> = ({ planId }) => {
    const [message, setMessage] = React.useState('');

    const handleSend = React.useCallback(() => {
        // Placeholder for future integration with AI assistant hooks
        setMessage('');
    }, []);

    return (
        <Box>
            {!planId && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select or create a training plan to use the AI assistant.
                </Typography>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask the assistant to modify your plan..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!planId}
                    inputProps={{ 'data-testid': 'ai-chat-input' }}
                />
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={!planId || message.trim().length === 0}
                    data-testid="ai-chat-send"
                >
                    Send
                </Button>
            </Stack>
        </Box>
    );
};




