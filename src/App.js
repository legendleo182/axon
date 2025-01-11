import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, useMediaQuery } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import StockPage from './pages/StockPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import IpManagementPage from './pages/IpManagementPage';
import Header from './components/Header';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('session');
      setSession(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('session');
      setSession(null);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
      }
    };

    setupAuth();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {session && <Header session={session} handleLogout={handleLogout} />}
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
                    <LoginPage setSession={setSession} />
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
