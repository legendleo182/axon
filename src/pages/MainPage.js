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
    { label: 'Novelty Stock', path: 'novelty' }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f0f2f5 0%, #e3e8ef 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            p: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(0)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              mb: 4,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            Stock Management System
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
