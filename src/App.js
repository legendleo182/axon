import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, useMediaQuery, Snackbar, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
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
  const [isMobile] = useState(!!window.matchMedia('(max-width: 600px)').matches);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [currentAppVersion, setCurrentAppVersion] = useState("1.0.0");
  const [serverVersion, setServerVersion] = useState(null);

  const checkIpAndSession = async () => {
    if (!session) return;
    
    try {
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
        await handleLogout(); 
        return;
      }
      
      const { data, error } = await checkIpMapping(ip);
      
      if (error || !data || !data.email) {
        console.log('IP not mapped or error:', { error, data });
        await handleLogout(); 
        return;
      }

      localStorage.setItem('userIP', ip);

    } catch (error) {
      console.error('Error in IP check:', error);
      await handleLogout(); 
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearLocalStorage();
      setSession(null);
      window.location.href = '/login'; 
    } catch (error) {
      console.error('Error during logout:', error);
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
      const vercelUrl = 'https://axon-olive.vercel.app/version.json';
      const result = await fetch(`${vercelUrl}?t=${new Date().getTime()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const versionInfo = await result.json();
      console.log('Server version from Vercel:', versionInfo.version);
      setServerVersion(versionInfo.version);
      
      let appVersion = "1.0.0";
      try {
        const appInfo = await CapApp.getInfo();
        if (appInfo && appInfo.version) {
          appVersion = appInfo.version;
        }
      } catch (e) {
        console.log('Using default version:', appVersion);
      }
      
      setCurrentAppVersion(appVersion);
      console.log('Current app version:', appVersion);
      
      const serverParts = versionInfo.version.split('.').map(Number);
      const currentParts = appVersion.split('.').map(Number);
      
      let needsUpdate = false;
      for (let i = 0; i < 3; i++) {
        if (serverParts[i] > currentParts[i]) {
          needsUpdate = true;
          break;
        } else if (serverParts[i] < currentParts[i]) {
          break;
        }
      }
      
      if (needsUpdate) {
        console.log('Update available');
        setUpdateAvailable(true);
        setShowUpdateDialog(true);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const applyUpdate = async () => {
    try {
      console.log('Applying update...');
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
      
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            console.log('Unregistering service worker');
            return registration.unregister();
          })
        );
      }
      
      const essentialItems = ['session', 'userIP'];
      Object.keys(localStorage).forEach(key => {
        if (!essentialItems.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Cache cleared, reloading...');
      
      if (window.Capacitor?.isNative) {
        window.location.href = 'https://axon-olive.vercel.app?t=' + new Date().getTime();
      } else {
        window.location.reload(true);
      }
    } catch (error) {
      console.error('Error applying update:', error);
      window.location.reload(true);
    }
  };

  const skipUpdate = () => {
    setShowUpdateDialog(false);
  };

  useEffect(() => {
    let interval;
    
    const setupSession = async () => {
      if (session) {
        await checkIpAndSession();
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
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('Found existing session:', currentSession);
        setSession(currentSession);
      }

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
    if (isMobile) {
      const persistedSession = localStorage.getItem('session');
      if (persistedSession) {
        setSession(JSON.parse(persistedSession));
      }
    }

    if (isMobile) {
      if (session) {
        localStorage.setItem('session', JSON.stringify(session));
      } else {
        localStorage.removeItem('session');
      }
    }
  }, [isMobile, session]);

  useEffect(() => {
    checkForUpdates();
    const updateInterval = setInterval(checkForUpdates, 15000);

    return () => clearInterval(updateInterval);
  }, []);

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

          <Dialog 
            open={showUpdateDialog} 
            onClose={skipUpdate}
            sx={{
              '& .MuiDialog-paper': {
                borderRadius: 2,
                minWidth: { xs: '80%', sm: 400 }
              }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              New Update Available
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
              <Typography>
                A new version of the app is available.
                {currentAppVersion && serverVersion && (
                  <Box sx={{ mt: 1, color: 'text.secondary' }}>
                    Current version: {currentAppVersion}
                    <br />
                    New version: {serverVersion}
                  </Box>
                )}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
                onClick={skipUpdate} 
                color="inherit"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Later
              </Button>
              <Button 
                onClick={applyUpdate} 
                variant="contained" 
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Update Now
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={updateAvailable && !showUpdateDialog}
            message="New update available!"
            action={
              <Button color="primary" size="small" onClick={() => setShowUpdateDialog(true)}>
                Update Now
              </Button>
            }
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
