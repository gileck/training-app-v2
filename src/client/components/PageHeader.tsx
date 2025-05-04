import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionComponent?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actionComponent }: PageHeaderProps) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: {xs: 'column', sm: 'row'}, 
        justifyContent: 'space-between',
        alignItems: {xs: 'flex-start', sm: 'center'},
        mb: 4,
        gap: 2
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {actionComponent && (
        <Box sx={{ mt: { xs: 1, sm: 0 } }}>
          {actionComponent}
        </Box>
      )}
    </Box>
  );
}; 