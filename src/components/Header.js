import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouterIcon from '@mui/icons-material/Router';

const Header = ({ handleLogout }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');
  const userIP = localStorage.getItem('userIP');
  const loginTime = localStorage.getItem('loginTime');

  return (
    <Paper elevation={3} sx={{ mb: 3 }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper'
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 700,
              letterSpacing: 1,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Axon Inventory
          </Typography>
        </Toolbar>
      </AppBar>

      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center',
            gap: { xs: 1, sm: 3 },
            flexWrap: 'wrap'
          }}>
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 1,
                bgcolor: 'primary.light',
                borderRadius: 2
              }}
            >
              <PersonIcon sx={{ color: 'white' }} />
              <Typography sx={{ color: 'white', fontWeight: 600 }}>
                {userName}
              </Typography>
            </Paper>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'text.secondary'
            }}>
              <RouterIcon />
              <Typography>
                IP: {userIP}
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'text.secondary'
            }}>
              <AccessTimeIcon />
              <Typography>
                Login: {loginTime}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Removed Stock Management text */}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              color="inherit"
              onClick={() => navigate('/ip-management')}
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              IP Management
            </Button>
          </Box>

          <Button 
            variant="contained"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 2
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
    </Paper>
  );
};

export default Header;
