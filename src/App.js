import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { App as CapacitorApp } from '@capacitor/app';
import theme from './theme';
import MainPage from './pages/MainPage';
import StockPage from './pages/StockPage';
import ItemDetailsPage from './pages/ItemDetailsPage';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cleanup = () => {};

    const initializeBackButton = async () => {
      // Only add the listener if we're in a Capacitor environment (mobile app)
      if (typeof window !== 'undefined' && window.Capacitor) {
        try {
          const handleBackButton = () => {
            if (location.pathname === '/') {
              CapacitorApp.exitApp();
            } else {
              navigate(-1);
            }
          };

          const listener = await CapacitorApp.addListener('backButton', handleBackButton);
          cleanup = () => {
            try {
              listener?.remove?.();
            } catch (error) {
              console.log('Error removing listener:', error);
            }
          };
        } catch (error) {
          console.log('Error setting up back button:', error);
        }
      }
    };

    initializeBackButton();

    return () => {
      cleanup();
    };
  }, [navigate, location]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: 'text.primary', 
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            Axon Inventory
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/stock/:type" element={<StockPage />} />
          <Route path="/item/:type/:id" element={<ItemDetailsPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Router>
  );
}

export default App;
