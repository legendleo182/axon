import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  CircularProgress,
  Fade
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InventoryIcon from '@mui/icons-material/Inventory';
import { checkIpMapping } from '../utils/ipManager';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [checkingIp, setCheckingIp] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
    };
    checkAuth();

    // Get IP address when component mounts
    const getIpWithFallback = async () => {
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://api64.ipify.org?format=json'
      ];

      for (const service of ipServices) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          // Different APIs return IP in different formats
          const ip = data.ip || data.clientIP;
          if (ip) {
            console.log('Current IP:', ip);
            setIpAddress(ip);
            setCheckingIp(false);
            return;
          }
        } catch (err) {
          console.error(`Error fetching IP from ${service}:`, err);
        }
      }
      
      // If all services fail, try local request to get IP
      try {
        const response = await fetch('/api/getip');
        const data = await response.json();
        if (data.ip) {
          console.log('Current IP:', data.ip);
          setIpAddress(data.ip);
        } else {
          throw new Error('No IP found');
        }
      } catch (err) {
        console.error('Error fetching IP from all services:', err);
        setError('Unable to detect your IP address. Please check your internet connection and try again.');
      }
      setCheckingIp(false);
    };

    getIpWithFallback();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!ipAddress) {
      setError(`IP not mapped (${ipAddress})`);
      return;
    }

    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Append @gmail.com to username
      const email = username.includes('@') ? username : `${username}@gmail.com`;

      // First check if IP is mapped
      console.log('Checking IP mapping for:', ipAddress);
      const { data: mappingData, error: mappingError } = await supabase
        .from('ip_mappings')
        .select('email')
        .eq('ip_address', ipAddress);
      
      console.log('IP mapping result:', { mappingData, mappingError });

      // Handle no rows or multiple rows
      if (mappingError || !mappingData || mappingData.length === 0) {
        setError(`IP not mapped (${ipAddress})`);
        setLoading(false);
        return;
      }

      if (mappingData.length > 1) {
        console.error('Multiple IP mappings found:', mappingData);
        setError(`IP not mapped (${ipAddress})`);
        setLoading(false);
        return;
      }

      const mapping = mappingData[0];
      if (!mapping || !mapping.email) {
        setError(`IP not mapped (${ipAddress})`);
        setLoading(false);
        return;
      }

      // Verify that the IP is mapped to this email
      if (mapping.email !== email) {
        setError(`IP not mapped (${ipAddress})`);
        setLoading(false);
        return;
      }

      // Attempt login
      console.log('Attempting login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful:', data);

      // Set success and store user info
      setSuccess(true);
      localStorage.setItem('userName', email.split('@')[0]);
      localStorage.setItem('userIP', ipAddress);
      localStorage.setItem('loginTime', new Date().toLocaleString());

      // Navigate after a brief delay to show success message
      setTimeout(() => {
        console.log('Navigating to home...');
        navigate('/', { replace: true });
      }, 1500);

    } catch (error) {
      console.error('Login process error:', error);
      if (error.message.includes('auth')) {
        setError(error.message); // Show original error for auth issues
      } else {
        setError(`IP not mapped (${ipAddress})`); // Show IP mapping error for other issues
      }
      setLoading(false);
      
      // Clear any existing session on error
      await supabase.auth.signOut();
      localStorage.clear();
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', session);
      if (session) {
        console.log('Active session found, navigating to home...');
        navigate('/', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: { xs: 1, sm: 2 }
      }}
    >
      <Fade in={true} timeout={800}>
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={8}
            sx={{
              p: { xs: 2, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: { xs: 2, sm: 3 },
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-4px)' },
                boxShadow: { xs: 8, sm: 12 }
              }
            }}
          >
            <Box
              sx={{
                width: { xs: 55, sm: 65 },
                height: { xs: 55, sm: 65 },
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: { xs: 1.5, sm: 2 },
                boxShadow: 3,
                animation: 'pulse 2s infinite'
              }}
            >
              <InventoryIcon sx={{ fontSize: { xs: 30, sm: 35 }, color: 'white' }} />
            </Box>

            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mb: { xs: 3, sm: 4 },
                fontWeight: 600,
                color: 'primary.main',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                fontSize: { xs: '1.75rem', sm: '2.125rem' }
              }}
            >
              Welcome
            </Typography>

            {error && (
              <Fade in={true}>
                <Alert 
                  severity="error" 
                  sx={{ 
                    width: '100%', 
                    mb: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    boxShadow: 2,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {success && (
              <Fade in={true}>
                <Alert 
                  severity="success"
                  sx={{ 
                    width: '100%', 
                    mb: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    boxShadow: 2,
                    position: 'relative',
                    zIndex: 1000,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  <strong>Login successful!</strong> Redirecting to dashboard...
                </Alert>
              </Fade>
            )}

            <Box 
              component="form" 
              onSubmit={handleLogin} 
              sx={{ 
                width: '100%',
                '& .MuiTextField-root': {
                  mb: { xs: 2, sm: 2.5 }
                }
              }}
            >
              <TextField
                required
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ fontSize: { xs: 20, sm: 24 } }} color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: username && (
                    <InputAdornment position="end">
                      <Typography color="textSecondary">@gmail.com</Typography>
                    </InputAdornment>
                  )
                }}
                placeholder="Enter username"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1.5, sm: 2 },
                    height: { xs: 48, sm: 56 },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1.5, sm: 2 },
                    height: { xs: 48, sm: 56 },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: { xs: 2, sm: 3 },
                  mb: { xs: 1, sm: 2 },
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.9rem', sm: '1.1rem' },
                  textTransform: 'none',
                  boxShadow: 3,
                  height: { xs: 42, sm: 48 },
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-2px)' },
                    boxShadow: { xs: 3, sm: 5 }
                  }
                }}
              >
                {loading ? <CircularProgress size={20} /> : 'Login'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Fade>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
            }
            70% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default LoginPage;
