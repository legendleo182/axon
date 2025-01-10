import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, useMediaQuery, Dialog, DialogContent, DialogTitle, CircularProgress, Typography, Snackbar, Button } from '@mui/material';
import { App as CapApp } from '@capacitor/app';
import theme from './theme';
import MainPage from './pages/MainPage';
import StockPage from './pages/StockPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import { supabase } from './supabaseClient';
import IpManagementPage from './pages/IpManagementPage';
import { checkIpMapping } from './utils/ipManager';

function App() {
  const [session, setSession] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkIpAndSession = async () => {
    if (!session) return;
    
    try {
      // Get current IP using multiple services
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://api64.ipify.org?format=json'
      ];

      let ip = null;
      for (const service of ipServices) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          ip = data.ip || data.clientIP;
          if (ip) break;
        } catch (err) {
          console.error(`Error fetching IP from ${service}:`, err);
          continue;
        }
      }

      if (!ip) {
        console.error('Could not fetch IP from any service');
        await handleLogout(); // Logout if IP fetch fails
        return;
      }
      
      // Check if IP is mapped
      const { data, error } = await checkIpMapping(ip);
      
      if (error || !data || !data.email) {
        console.log('IP not mapped or error:', { error, data });
        await handleLogout(); // Logout if IP is not mapped
        return;
      }

      // Store the current IP for reference
      localStorage.setItem('userIP', ip);

    } catch (error) {
      console.error('Error in IP check:', error);
      await handleLogout(); // Logout on any error
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearLocalStorage();
      setSession(null);
      window.location.href = '/login'; // Force redirect to login
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear everything even if signOut fails
      clearLocalStorage();
      setSession(null);
      window.location.href = '/login';
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('session');
    localStorage.removeItem('userName');
    localStorage.removeItem('userIP');
    localStorage.removeItem('loginTime');
  };

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      const result = await fetch('/version.json?' + new Date().getTime());
      const versionInfo = await result.json();
      
      const currentVersion = await CapApp.getInfo();
      
      if (versionInfo.version !== currentVersion.version) {
        setUpdateAvailable(true);
        // Force reload the app to get the latest version
        window.location.reload(true);
      }
      setIsChecking(false);
    } catch (error) {
      console.error('Error checking for updates:', error);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let interval;
    
    const setupSession = async () => {
      if (session) {
        // Initial check
        await checkIpAndSession();
        
        // Check IP mapping every minute
        interval = setInterval(checkIpAndSession, 60000);
      }
    };

    setupSession();
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [session]);

  useEffect(() => {
    const setupAuth = async () => {
      // Check current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('Found existing session:', currentSession);
        setSession(currentSession);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log('Auth state changed:', _event, newSession);
        setSession(newSession);
      });

      return () => {
        subscription?.unsubscribe();
      };
    };

    setupAuth();
  }, []);

  useEffect(() => {
    // On mobile, check localStorage first
    if (isMobile) {
      const persistedSession = localStorage.getItem('session');
      if (persistedSession) {
        setSession(JSON.parse(persistedSession));
      }
    }

    // On mobile, update persisted session
    if (isMobile) {
      if (session) {
        localStorage.setItem('session', JSON.stringify(session));
      } else {
        localStorage.removeItem('session');
      }
    }
  }, [isMobile, session]);

  useEffect(() => {
    // Check for updates immediately and then every minute
    checkForUpdates();
    const updateInterval = setInterval(checkForUpdates, 60 * 1000);

    return () => clearInterval(updateInterval);
  }, []);

  if (isChecking) {
    return (
      <Dialog open={true}>
        <DialogTitle>Checking for Updates</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
            <CircularProgress />
            <Typography>Please wait while we check for updates...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (updateAvailable) {
    return (
      <Dialog open={true}>
        <DialogTitle>Update Available</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
            <CircularProgress />
            <Typography>Updating to the latest version...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {session && <Header handleLogout={handleLogout} />}
          <Container 
            maxWidth={false} 
            sx={{ 
              flexGrow: 1, 
              p: 0,
              bgcolor: 'background.default'
            }}
          >
            <Routes>
              <Route 
                path="/login" 
                element={
                  session ? (
                    <Navigate to="/" replace />
                  ) : (
                    <LoginPage />
                  )
                } 
              />
              <Route
                path="/"
                element={
                  session ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Container maxWidth={false} sx={{ flex: 1, py: 3 }}>
                        <MainPage />
                      </Container>
                    </Box>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/stock/:type"
                element={
                  session ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Container maxWidth={false} sx={{ flex: 1, py: 3 }}>
                        <StockPage />
                      </Container>
                    </Box>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/item/:type/:id"
                element={
                  session ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Container maxWidth={false} sx={{ flex: 1, py: 3 }}>
                        <ItemDetailsPage />
                      </Container>
                    </Box>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/ip-management"
                element={
                  session ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Container maxWidth={false} sx={{ flex: 1, py: 3 }}>
                        <IpManagementPage />
                      </Container>
                    </Box>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
