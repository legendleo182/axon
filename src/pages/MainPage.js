import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography,
  Stack
} from '@mui/material';

const MainPage = () => {
  const navigate = useNavigate();

  const stockButtons = [
    { label: 'Head Office Stock', path: 'head-office' },
    { label: 'Katra Ghee Stock', path: 'katra-ghee' },
    { label: 'Novelty Stock', path: 'novelty' },
    { label: 'Cash Register - 4696 (Unit-3)', path: 'cash-register' },
    { label: 'Job Card - 4696 (Unit-3)', path: 'job-card' }
  ];

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(145deg, #f0f2f5 0%, #e3e8ef 100%)',
        display: 'flex',
        alignItems: 'flex-start',
        pt: 0
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            mt: 0,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{
              fontWeight: 800,
              color: 'primary.dark',
              mb: 4,
              fontSize: { xs: '2rem', sm: '2.75rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Stock System
          </Typography>
          
          <Stack spacing={2.5} width="100%">
            {stockButtons.map((button, index) => (
              <Button
                key={button.path}
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  textTransform: 'none',
                  background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease-in-out',
                  animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                  '@keyframes fadeIn': {
                    from: {
                      opacity: 0,
                      transform: 'translateY(20px)'
                    },
                    to: {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }
                }}
                onClick={() => navigate(`/stock/${button.path}`)}
              >
                {button.label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default MainPage;
