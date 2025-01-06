import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      light: '#5c6bc0',
      main: '#3f51b5',
      dark: '#2c387e',
      contrastText: '#fff'
    },
    secondary: {
      light: '#ff4081',
      main: '#f50057',
      dark: '#c51162',
      contrastText: '#fff'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: 0.5,
      color: '#2c3e50',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#2c3e50',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#2c3e50',
    },
    body1: {
      fontSize: '1rem',
      color: '#2c3e50',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#546e7a',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease-in-out'
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        },
        elevation2: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)'
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)'
        }
      }
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px rgba(63, 81, 181, 0.15)'
            }
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: '1px solid rgba(224, 224, 224, 1)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5',
          color: '#2c3e50',
        },
      },
    },
  },
});

export default theme;
