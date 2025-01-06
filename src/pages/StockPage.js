import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Grid,
  Paper,
  Alert,
  Snackbar,
  Checkbox,
  AppBar,
  Toolbar,
  InputAdornment,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { supabase } from '../supabase';

const StockPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '' });
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
      console.log('Loading items for type:', type);
      // Test database connection first
      const { error: connectionError } = await supabase.from('items').select('count');
      if (connectionError) {
        console.error('Database connection error:', connectionError);
        throw new Error('Unable to connect to the database. Please check your internet connection.');
      }

      const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', type)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading items:', error);
        throw new Error(`Failed to load items: ${error.message}`);
      }

      if (!items) {
        console.warn('No items found for type:', type);
        setItems([]);
        return;
      }

      console.log('Successfully loaded items:', items);
      setItems(items);
    } catch (error) {
      console.error('Error in loadItems:', error);
      showSnackbar(error.message || 'Error loading items. Please try again.', 'error');
      setItems([]);
    }
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.category) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('items')
        .insert([
          {
            name: newItem.name,
            category: newItem.category,
            type: type
          }
        ])
        .select();

      if (error) throw error;

      // Add new item to the end of the list
      setItems(prevItems => [...prevItems, data[0]]);
      setOpenAddDialog(false);
      setNewItem({ name: '', category: '' });
      showSnackbar('Item added successfully', 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      showSnackbar('Error adding item', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getPageTitle = () => {
    switch (type) {
      case 'head-office':
        return 'Head Office Stock';
      case 'katra-ghee':
        return 'Katra Ghee Stock';
      case 'novelty':
        return 'Novelty Stock';
      default:
        return 'Stock Management';
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;

      showSnackbar('Item deleted successfully!', 'success');
      await loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      showSnackbar('Error deleting item', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setSelectedItem(null);
    }
  };

  const handleEditClick = (item) => {
    setEditMode(item.id);
    setEditData({
      name: item.name,
      category: item.category,
      image_url: item.image_url || ''
    });
  };

  const handleSaveEdit = async (itemId) => {
    try {
      // Validate the data
      if (!editData.name || !editData.category) {
        showSnackbar('Name and category are required', 'error');
        return;
      }

      const updateData = {
        name: editData.name.trim(),
        category: editData.category.trim()
      };

      // Only include image_url if it's not empty
      if (editData.image_url && editData.image_url.trim()) {
        updateData.image_url = editData.image_url.trim();
      }

      console.log('Updating item with data:', updateData);

      const { data, error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      setEditMode(null);
      await loadItems();
      showSnackbar('Item updated successfully', 'success');
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      showSnackbar(error.message || 'Error updating item', 'error');
    }
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      position: 'relative'
    }}>
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary" sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            {getPageTitle()}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 },
            '& .MuiButton-root': {
              minWidth: { xs: 'auto', sm: '120px' }
            }
          }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{ 
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              Add Item
            </Button>
            <IconButton 
              color="primary"
              onClick={() => setOpenAddDialog(true)}
              sx={{ 
                display: { xs: 'flex', sm: 'none' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
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
                Add Item
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
                Items List
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
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
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
                        minWidth: 0 // Add this to prevent text overflow
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
                            '&:hover': { bgcolor: 'primary.light', color: 'white' }
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
                            '&:hover': { bgcolor: 'secondary.light', color: 'white' }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>

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
                  onClick={handleDelete}
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

          {/* Add Item Dialog */}
          <Dialog 
            open={openAddDialog} 
            onClose={() => {
              setOpenAddDialog(false);
              setNewItem({ name: '', category: '' });
            }}
          >
            <DialogTitle>Add New Item</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Item Name"
                fullWidth
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                sx={{ mb: 2, mt: 2 }}
              />
              <TextField
                margin="dense"
                label="Category"
                fullWidth
                required
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setOpenAddDialog(false);
                  setNewItem({ name: '', category: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddItem}
                variant="contained"
                disabled={!newItem.name || !newItem.category}
              >
                Add
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
      </Container>
    </Box>
  );
};

export default StockPage;
