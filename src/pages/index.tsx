import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Layout from '../client/components/Layout';
import dynamic from 'next/dynamic';
import { SettingsProvider } from '../client/context/SettingsContext';
import { routes } from '../client/routes';
import { AuthProvider } from '@/client/context/AuthContext';
import AuthWrapper from '@/client/context/AuthWrapper';

const RouterProvider = dynamic(() => import('../client/router/index').then(module => module.RouterProvider), { ssr: false });

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SettingsProvider>
          <AuthWrapper>
            <RouterProvider routes={routes}>
              {Component => <Layout><Component /></Layout>}
            </RouterProvider>
          </AuthWrapper>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
