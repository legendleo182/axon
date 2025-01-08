import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { supabase } from '../supabase';

const StockPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newItem, setNewItem] = useState(type === 'job-card' ? { name: '' } : { name: '', category: '' });
  const [items, setItems] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    category: '',
    image_url: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // New states for cash register
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getGoogleDriveImageUrl = (url) => {
    console.log('Original URL:', url);
    try {
      // Check if it's a Google Drive URL
      if (url.includes('drive.google.com')) {
        let fileId = '';
        
        // Extract file ID
        if (url.includes('/file/d/')) {
          fileId = url.match(/\/file\/d\/([^/]+)/)?.[1];
        }
        
        if (fileId) {
          // Using an alternative format that works better
          const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
          console.log('Converted URL:', directUrl);
          return directUrl;
        }
      }
      return url;
    } catch (error) {
      console.error('Error processing Google Drive URL:', error);
      return url;
    }
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    loadItems();
  }, [type]);

  const loadItems = async () => {
    try {
      // Test database connection first
      const { error: connectionError } = await supabase.from('items').select('count');
      if (connectionError) {
        console.error('Database connection error:', connectionError);
        throw new Error('Unable to connect to the database. Please check your internet connection.');
      }

      if (type === 'job-card') {
        // Load series for job card
        const { data: series, error } = await supabase
          .from('series')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!series) {
          console.warn('No series found');
          setItems([]);
          return;
        }

        setItems(series);
      } else {
        // Load items for other types
        const { data: items, error } = await supabase
          .from('items')
          .select('*')
          .eq('type', type)
          .order('name', { ascending: true });

        if (error) throw error;

        if (!items) {
          console.warn('No items found for type:', type);
          setItems([]);
          return;
        }

        setItems(items);
      }
    } catch (error) {
      console.error('Error in loadItems:', error);
      showSnackbar(error.message || 'Error loading ' + (type === 'job-card' ? 'series' : 'items'), 'error');
      setItems([]);
    }
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.name || (type !== 'job-card' && !newItem.category)) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      if (type === 'job-card') {
        // Insert into series table for job card
        const { data, error } = await supabase
          .from('series')
          .insert([{
            name: newItem.name,
            created_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;

        // Add new series to the list
        setItems(prevItems => [...prevItems, data[0]]);
      } else {
        // Insert into items table for other types
        const { data, error } = await supabase
          .from('items')
          .insert([{
            name: newItem.name,
            category: newItem.category,
            type: type
          }])
          .select();

        if (error) throw error;

        // Add new item to the list
        setItems(prevItems => [...prevItems, data[0]]);
      }

      setOpenAddDialog(false);
      setNewItem(type === 'job-card' ? { name: '' } : { name: '', category: '' });
      showSnackbar(type === 'job-card' ? 'Series added successfully' : 'Item added successfully', 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      showSnackbar('Error adding ' + (type === 'job-card' ? 'series' : 'item'), 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getPageTitle = () => {
    switch (type) {
      case 'head-office':
        return 'Head Office Stock';
      case 'cash-register':
        return 'Cash Register - 4696 (Unit-3)';
      case 'katra-ghee':
        return 'Katra Ghee Stock';
      case 'novelty':
        return 'Novelty Stock';
      default:
        return 'Stock Management';
    }
  };

  const handleDelete = async (item) => {
    try {
      const { error } = await supabase
        .from(type === 'job-card' ? 'series' : 'items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setItems(prevItems => prevItems.filter(i => i.id !== item.id));
      setOpenDeleteDialog(false);
      setSelectedItem(null);
      showSnackbar(type === 'job-card' ? 'Series deleted successfully' : 'Item deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showSnackbar('Error deleting ' + (type === 'job-card' ? 'series' : 'item'), 'error');
    }
  };

  const handleEditClick = (item) => {
    setEditMode(item.id);
    setEditData({
      name: item.name,
      category: type === 'job-card' ? '' : item.category,
      image_url: type === 'job-card' ? '' : item.image_url
    });
  };

  const handleSaveEdit = async (itemId) => {
    try {
      const updateData = {
        name: editData.name,
      };
      
      if (type !== 'job-card') {
        updateData.category = editData.category;
        updateData.image_url = editData.image_url;
      }

      const { error } = await supabase
        .from(type === 'job-card' ? 'series' : 'items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, ...updateData }
            : item
        )
      );

      setEditMode(null);
      setEditData({ name: '', category: '', image_url: '' });
      showSnackbar(type === 'job-card' ? 'Series updated successfully' : 'Item updated successfully', 'success');
    } catch (error) {
      console.error('Error updating item:', error);
      showSnackbar('Error updating ' + (type === 'job-card' ? 'series' : 'item'), 'error');
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const { error } = await supabase
        .from('series')
        .update({ status: newStatus })
        .eq('id', itemId);

      if (error) throw error;

      // Update the local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
      showSnackbar(`Status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('Error updating status', 'error');
    }
  };

  // Load last update on component mount for cash register
  useEffect(() => {
    if (type === 'cash-register') {
      loadLastUpdate();
    }
  }, [type]);

  const loadLastUpdate = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_register_status')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setLastUpdate(data[0].updated_at);
      } else {
        setLastUpdate(null);
      }
    } catch (error) {
      console.error('Error loading update:', error);
      showSnackbar('Error loading update: ' + error.message, 'error');
    }
  };

  const handleDateSubmit = async () => {
    try {
      if (!selectedDate) {
        showSnackbar('Please select a date and time', 'error');
        return;
      }

      const { error } = await supabase
        .from('cash_register_status')
        .insert([
          {
            updated_at: selectedDate
          }
        ]);

      if (error) throw error;

      setLastUpdate(selectedDate);
      showSnackbar('Date updated successfully', 'success');
      setSelectedDate('');
    } catch (error) {
      console.error('Error updating date:', error);
      showSnackbar('Error updating date: ' + error.message, 'error');
    }
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Box sx={{ 
        width: '100%',
        maxWidth: '800px', 
        px: { xs: 2, sm: 3 }, 
        py: { xs: 2, sm: 3 },
        mx: 'auto' 
      }}>
        <Box sx={{ py: { xs: 2, sm: 4 } }}>
          <Box sx={{ 
            mb: 4, 
            display: 'flex', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <IconButton 
              onClick={() => navigate('/')} 
              sx={{ 
                mr: { xs: 0, sm: 2 }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>

          {type !== 'cash-register' && (
            <>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => setOpenAddDialog(true)}
                    sx={{ 
                      py: 1.5,
                      px: { xs: 2, sm: 4 },
                      float: { xs: 'none', sm: 'left' },
                      width: { xs: '100%', sm: 'auto' },
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      boxShadow: 2,
                      borderRadius: 2
                    }}
                  >
                    {type === 'job-card' ? 'Add Series' : 'Add Item'}
                  </Button>
                </Grid>
              </Grid>

              <Paper elevation={2} sx={{ 
                p: { xs: 1, sm: 2 },
                overflowX: 'auto' 
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 }
                }}>
                  <Typography variant="h6">
                    {type === 'job-card' ? 'Series List' : 'Items List'}
                  </Typography>
                </Box>

                <List sx={{ 
                  '& .MuiListItem-root': {
                    flexDirection: { xs: 'row', sm: 'row' },
                    alignItems: { xs: 'center', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 },
                    p: { xs: 1, sm: 2 }
                  }
                }}>
                  {filteredItems.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{ 
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': { bgcolor: type === 'job-card' ? 'transparent' : 'action.hover' }
                      }}
                    >
                      {type === 'job-card' ? (
                        // Simple view for job-card series with status buttons and edit/delete
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          px: 2
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {editMode === item.id ? (
                              <TextField
                                size="small"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                sx={{ minWidth: 200 }}
                                InputProps={{
                                  endAdornment: (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleSaveEdit(item.id)}
                                        sx={{ color: 'success.main' }}
                                      >
                                        <SaveIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setEditMode(null);
                                          setEditData({ name: '', category: '', image_url: '' });
                                        }}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ),
                                }}
                              />
                            ) : (
                              <>
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        fontSize: '1rem'
                                      }}
                                    >
                                      {item.name}
                                    </Typography>
                                  }
                                />
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditClick(item)}
                                    sx={{
                                      color: 'primary.main',
                                      '&:hover': { bgcolor: 'primary.lighter' }
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setOpenDeleteDialog(true);
                                    }}
                                    sx={{
                                      color: 'error.main',
                                      '&:hover': { bgcolor: 'error.lighter' }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </>
                            )}
                          </Box>
                          {item.status && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: item.status === 'Complete' ? 'success.main' : 'warning.main',
                                fontWeight: 500,
                                display: { xs: 'block', sm: 'block' }
                              }}
                            >
                              Status: {item.status}
                            </Typography>
                          )}
                          <Box sx={{ 
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant={item.status === 'Working' ? 'contained' : 'outlined'}
                                color="warning"
                                onClick={() => handleStatusChange(item.id, 'Working')}
                                sx={{
                                  minWidth: 'auto',
                                  px: 2,
                                  py: 0.5
                                }}
                              >
                                Working
                              </Button>
                              <Button
                                size="small"
                                variant={item.status === 'Complete' ? 'contained' : 'outlined'}
                                color="success"
                                onClick={() => handleStatusChange(item.id, 'Complete')}
                                sx={{
                                  minWidth: 'auto',
                                  px: 2,
                                  py: 0.5
                                }}
                              >
                                Complete
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        // Full featured view for other pages
                        <>
                          <Box sx={{ 
                            display: 'flex', 
                            flex: 1,
                            flexDirection: { xs: 'row', sm: 'row' },
                            width: '100%',
                            gap: { xs: 0.5, sm: 0 },
                            alignItems: 'center'
                          }}>
                            <Box 
                              sx={{ 
                                flex: { xs: 1, sm: 2 },
                                cursor: 'pointer',
                                width: '100%',
                                minWidth: 0
                              }}
                              onClick={() => navigate(`/item/${type}/${item.id}`)}
                            >
                              {editMode === item.id ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Name"
                                  />
                                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      value={editData.category}
                                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                      placeholder="Category"
                                    />
                                  </Box>
                                </Box>
                              ) : (
                                <Box>
                                  <ListItemText 
                                    primary={item.name}
                                    sx={{
                                      m: 0,
                                      '& .MuiTypography-root': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }
                                    }}
                                  />
                                  <ListItemText 
                                    primary={item.category}
                                    sx={{
                                      m: 0,
                                      display: { xs: 'block', sm: 'none' },
                                      '& .MuiTypography-root': {
                                        fontSize: '0.75rem',
                                        color: 'text.secondary',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ 
                              flex: 1,
                              display: { xs: 'none', sm: 'block' }
                            }}>
                              {editMode === item.id ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={editData.category}
                                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                />
                              ) : (
                                <ListItemText primary={item.category} />
                              )}
                            </Box>
                            <Box sx={{ 
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: { xs: 'flex-end', sm: 'flex-start' }
                            }}>
                              {editMode === item.id ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Enter image URL"
                                  value={editData.image_url || ''}
                                  onChange={(e) => setEditData({ ...editData, image_url: e.target.value })}
                                />
                              ) : (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1
                                }}>
                                  {item.image_url && isValidUrl(item.image_url) && (
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(item.image_url);
                                      }}
                                      sx={{ 
                                        p: { xs: 0.5, sm: 1 }
                                      }}
                                    >
                                      <img 
                                        src="/circle.png" 
                                        alt="View" 
                                        style={{ 
                                          width: '20px', 
                                          height: '20px',
                                          objectFit: 'contain'
                                        }} 
                                      />
                                    </IconButton>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: { xs: 0.5, sm: 1 },
                            justifyContent: 'flex-end',
                            ml: { xs: 0.5, sm: 1 }
                          }}>
                            {editMode === item.id ? (
                              <>
                                <IconButton 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(item.id);
                                  }} 
                                  color="primary"
                                  size="small"
                                  sx={{ 
                                    p: { xs: 0.5, sm: 1 },
                                    bgcolor: 'primary.light', 
                                    color: 'white', 
                                    '&:hover': { bgcolor: 'primary.main' }
                                  }}
                                >
                                  <SaveIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                                </IconButton>
                                <IconButton 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditMode(null);
                                  }} 
                                  color="secondary"
                                  size="small"
                                  sx={{ 
                                    p: { xs: 0.5, sm: 1 },
                                    bgcolor: 'secondary.light', 
                                    color: 'white', 
                                    '&:hover': { bgcolor: 'secondary.main' }
                                  }}
                                >
                                  <CancelIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <IconButton 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(item);
                                  }} 
                                  color="primary"
                                  size="small"
                                  sx={{ 
                                    p: { xs: 0.5, sm: 1 },
                                    '&:hover': { bgcolor: 'primary.light', color: 'white' },
                                    display: { xs: 'none', sm: 'inline-flex' }  
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                                </IconButton>
                                <IconButton 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item);
                                    setOpenDeleteDialog(true);
                                  }} 
                                  color="secondary"
                                  size="small"
                                  sx={{ 
                                    p: { xs: 0.5, sm: 1 },
                                    '&:hover': { bgcolor: 'secondary.light', color: 'white' },
                                    display: { xs: 'none', sm: 'inline-flex' }  
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </>
                      )}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}

          {type === 'cash-register' && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 4,
              mt: 4
            }}>
              <Paper 
                elevation={3}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: 400,
                  background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3
                }}>
                  <Typography 
                    variant="h3" 
                    component="h1"
                    sx={{
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    Status
                  </Typography>
                  {lastUpdate && (
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                      width: '100%',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'text.secondary',
                          fontWeight: 500
                        }}
                      >
                        Last Updated
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'text.primary',
                          mt: 1,
                          fontFamily: 'monospace'
                        }}
                      >
                        {new Date(lastUpdate).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ 
                    display: { xs: 'none', sm: 'flex' }, 
                    gap: 2, 
                    alignItems: 'center',
                    width: '100%',
                    mt: 2
                  }}>
                    <TextField
                      type="datetime-local"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      size="small"
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.04)'
                          }
                        },
                        '& input': {
                          cursor: 'pointer',
                          padding: '10px 14px'
                        }
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleDateSubmit}
                      disabled={!selectedDate}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Dialogs and other components remain unchanged */}
          {/* Image Preview Dialog */}
          <Dialog
            open={Boolean(selectedImage)}
            onClose={handleCloseImage}
            maxWidth="lg"
            PaperProps={{
              sx: {
                width: '90vw',
                height: '90vh',
                maxWidth: '90vw',
                maxHeight: '90vh',
                m: 0,
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'black'
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'black'
              }}
            >
              <IconButton
                onClick={handleCloseImage}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  },
                  zIndex: 1
                }}
              >
                <CloseIcon />
              </IconButton>
              {selectedImage && (
                <img
                  src={getGoogleDriveImageUrl(selectedImage)}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    console.error('Error loading image:', e);
                    showSnackbar('Error loading image', 'error');
                  }}
                />
              )}
            </Box>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => {
              setOpenDeleteDialog(false);
              setSelectedItem(null);
            }}
            PaperProps={{
              sx: { 
                borderRadius: 3,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                p: 2
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'error.main', fontWeight: 600 }}>
                Delete Item
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                Are you sure you want to delete this item? This action cannot be undone.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setOpenDeleteDialog(false);
                    setSelectedItem(null);
                  }}
                  sx={{ 
                    borderColor: 'grey.300',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'grey.400',
                      bgcolor: 'grey.50'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDelete(selectedItem)}
                  sx={{ 
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'error.dark',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(211, 47, 47, 0.35)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          </Dialog>

          {/* Add Item/Series Dialog */}
          <Dialog 
            open={openAddDialog} 
            onClose={() => {
              setOpenAddDialog(false);
              setNewItem(type === 'job-card' ? { name: '' } : { name: '', category: '' });
            }}
          >
            <DialogTitle>{type === 'job-card' ? 'Add New Series' : 'Add New Item'}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label={type === 'job-card' ? 'Series Name' : 'Item Name'}
                fullWidth
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                sx={{ mb: 2, mt: 2 }}
              />
              {type !== 'job-card' && (
                <TextField
                  margin="dense"
                  label="Category"
                  fullWidth
                  required
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setOpenAddDialog(false);
                  setNewItem(type === 'job-card' ? { name: '' } : { name: '', category: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddItem}
                variant="contained"
                disabled={!newItem.name || (type !== 'job-card' && !newItem.category)}
              >
                {type === 'job-card' ? 'Add Series' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default StockPage;
