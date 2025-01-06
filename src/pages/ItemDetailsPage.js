import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  Box,
  Button,
  Container,
  Checkbox,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  Grid,
  Alert,
  AppBar,
  Toolbar,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const randomColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'
];

const boxColors = [
  '#4ECDC4',  // teal
  '#FF6B6B',  // coral
  '#45B7D1',  // blue
  '#96CEB4',  // sage
  '#9B59B6',  // purple
  '#3498DB',  // sky blue
  '#E74C3C',  // red
  '#2ECC71'   // green
];

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
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

const formatValueUnit = (value) => {
  // Remove extra spaces and clean up
  const cleanValue = value.trim();
  
  // Try to match number and unit with different formats
  let match = cleanValue.match(/^(\d+\.?\d*)-?(mtr|pcs|MTR|PCS)$/i);
  if (!match) {
    match = cleanValue.match(/^(\d+\.?\d*)\s*(mtr|pcs|MTR|PCS)$/i);
  }
  
  if (match) {
    const [_, number, unit] = match;
    // Convert unit to lowercase for consistency
    return `${number}-${unit.toLowerCase()}`;
  }
  return value; // Return original if no match
};

const ItemDetailsPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [item, setItem] = useState(null);
  const [totalQuantity, setTotalQuantity] = useState('');
  const [remainingEntries, setRemainingEntries] = useState(0);
  const [stockData, setStockData] = useState({
    meters: '',
    name: '',
    unit: 'mtr' // Default unit
  });
  const [stockHistory, setStockHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entries, setEntries] = useState([]);
  const [editMode, setEditMode] = useState(null); // null when not editing, entry ID when editing
  const [editData, setEditData] = useState({
    meters: '',
    name: '',
    image_url: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDeleteEntry, setSelectedDeleteEntry] = useState(null);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const validateValues = (values) => {
    // Split values and check each one
    const valuesList = values.split(',').map(v => v.trim()).filter(v => v);
    const invalidValues = [];

    for (const value of valuesList) {
      // First try with the dash
      let match = value.match(/^\d+\.?\d*-?(mtr|pcs|MTR|PCS)$/i);
      if (!match) {
        // Then try with space
        match = value.match(/^\d+\.?\d*\s*(mtr|pcs|MTR|PCS)$/i);
      }
      if (!match) {
        invalidValues.push(value);
      }
    }

    if (invalidValues.length > 0) {
      showSnackbar(`Please add units (mtr or pcs) to these values: ${invalidValues.join(', ')}`, 'error');
      return false;
    }
    return true;
  };

  useEffect(() => {
    loadItemDetails();
  }, [id]);

  const loadItemDetails = async () => {
    try {
      console.log('Loading item details for ID:', id);
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching item:', error);
        throw error;
      }
      
      if (item) {
        console.log('Loaded item:', item);
        setItem(item);
        // Load stock history only after item is successfully loaded
        await loadStockHistory(item.id);
      } else {
        showSnackbar('Item not found', 'error');
      }
    } catch (error) {
      console.error('Error loading item details:', error);
      showSnackbar('Error loading item details', 'error');
    }
  };

  const loadStockHistory = async (itemId) => {
    try {
      console.log('Loading stock history for item:', itemId);
      const { data, error } = await supabase
        .from('stock')
        .select('id, item_id, quantity, date, name, type, created_at, image_url')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });  // Changed to ascending to show oldest first

      if (error) {
        console.error('Detailed error loading stock history:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        console.log('No data returned from query');
        setStockHistory([]);
        return;
      }

      console.log('Raw data from database:', data);

      // Add temporary SKU codes for display
      const updatedData = data.map(entry => ({
        ...entry,
        name: entry.name || '',
        tempSku: `SKU${entry.id.split('-')[0]}`
      }));

      console.log('Processed stock history:', updatedData);
      setStockHistory(updatedData);
    } catch (error) {
      console.error('Detailed error in loadStockHistory:', {
        error,
        message: error.message,
        stack: error.stack
      });
      showSnackbar('Failed to load stock history: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const handleTotalQuantitySubmit = (e) => {
    e.preventDefault();
    const quantity = parseInt(totalQuantity);
    if (isNaN(quantity) || quantity < 1 || quantity > 6) {
      showSnackbar('Please enter a quantity between 1 and 6', 'error');
      return;
    }
    setRemainingEntries(quantity);
    setShowEntryForm(true);
    setEntries([]);
    showSnackbar(`Please enter ${quantity} individual entries`, 'info');
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    try {
      if (!stockData.meters || !stockData.name) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      if (!item?.id) {
        console.error('No valid item ID found');
        showSnackbar('Error: Invalid item reference', 'error');
        return;
      }

      const value = parseFloat(stockData.meters);
      if (isNaN(value) || value < 0) {
        showSnackbar('Please enter a valid number', 'error');
        return;
      }

      // Add entry to local array
      const newEntries = [...entries, {
        value: value,
        unit: stockData.unit
      }];
      setEntries(newEntries);

      // Update remaining entries
      const newRemainingEntries = remainingEntries - 1;
      setRemainingEntries(newRemainingEntries);

      // Clear form
      setStockData({
        ...stockData,
        meters: '',
      });

      if (newRemainingEntries === 0) {
        try {
          const totalValue = newEntries.reduce((sum, entry) => sum + entry.value, 0);
          const entriesInfo = newEntries.map((entry) => 
            `${entry.value.toFixed(entry.value % 1 === 0 ? 0 : 1)}-${entry.unit}`
          ).join(' | ');

          const finalEntry = {
            item_id: item.id,
            quantity: totalValue,
            date: new Date().toISOString(),
            name: `${stockData.name || 'No name'} [VALUES:${entriesInfo}]`,
            type: 'manual_entry'
          };

          const { data, error } = await supabase
            .from('stock')
            .insert(finalEntry);

          if (error) throw error;

          showSnackbar('All entries combined and saved successfully!', 'success');
          setShowEntryForm(false);
          setTotalQuantity('');
          setEntries([]);
          await loadStockHistory(item.id);
        } catch (error) {
          console.error('Error saving combined entries:', error);
          throw error;
        }
      } else {
        showSnackbar(`Entry ${totalQuantity - newRemainingEntries} of ${totalQuantity} added. ${newRemainingEntries} more entries remaining.`, 'success');
      }
    } catch (error) {
      console.error('Error details:', error);
      showSnackbar(error.message || 'Error adding stock entry', 'error');
    }
  };

  const handleExcelUpload = async (event) => {
    try {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // Validate and process Excel data
          for (const row of jsonData) {
            if (!row.quantity || !row.date) {
              showSnackbar('Excel sheet must have quantity and date columns', 'error');
              return;
            }
          }

          // Add stock entries
          for (const row of jsonData) {
            const { error } = await supabase
              .from('stock')
              .insert([{
                item_id: id,
                sku_code: `SKU${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                quantity: parseInt(row.quantity),
                date: new Date(row.date).toISOString(),
                name: row.name || '',
                type: 'excel_upload'
              }]);

            if (error) throw error;
          }

          await loadStockHistory(item.id);
          showSnackbar('Stock data imported successfully', 'success');
        } catch (error) {
          console.error('Error processing Excel file:', error);
          showSnackbar('Error processing Excel file', 'error');
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      showSnackbar('Error uploading Excel file', 'error');
    }
  };

  const handleEditClick = (entry) => {
    // Extract just the name part without the VALUES
    const namePart = entry.name.split('[VALUES:')[0].trim();
    // Get values part and replace | with commas
    const valuesPart = entry.name.match(/\[VALUES:([^\]]+)\]/)?.[1].split('|').map(v => v.trim()).join(', ') || '';
    
    setEditData({
      name: namePart,
      meters: valuesPart,
      image_url: entry.image_url
    });
    setEditMode(entry.id);
  };

  const handleSaveEdit = async (entryId) => {
    try {
      // Get the original entry
      const entry = stockHistory.find(e => e.id === entryId);
      let updatedName = editData.name;
      let quantity = 0;
      
      // If editing values, use the new values
      if (editData.meters) {
        // Validate values before saving
        if (!validateValues(editData.meters)) {
          return; // Stop if validation fails
        }

        // Clean up and format each value
        const cleanedValues = editData.meters
          .split(',')
          .map(v => formatValueUnit(v.trim()))
          .filter(v => v) // Remove empty values
          .join(' | ');
        
        updatedName = `${editData.name.split('[VALUES:')[0].trim()} [VALUES:${cleanedValues}]`;
        
        // Calculate total quantity from all values
        quantity = editData.meters
          .split(',')
          .map(v => v.trim())
          .reduce((total, value) => {
            const match = value.match(/(\d+\.?\d*)\s*(mtr|pcs|MTR|PCS)/i);
            return total + (match ? parseFloat(match[1]) : 0);
          }, 0);
      } else {
        // If only editing name, preserve the existing VALUES part
        const existingValues = entry.name.match(/\[VALUES:([^\]]+)\]/);
        if (existingValues) {
          updatedName = `${editData.name.split('[VALUES:')[0].trim()} [VALUES:${existingValues[1]}]`;
          quantity = entry.quantity;
        }
      }

      const { error } = await supabase
        .from('stock')
        .update({
          name: updatedName,
          quantity: quantity,
          image_url: editData.image_url !== undefined ? editData.image_url : entry.image_url
        })
        .eq('id', entryId);

      if (error) {
        console.error('Error updating entry:', error);
        showSnackbar('Error updating entry: ' + error.message, 'error');
        return;
      }

      showSnackbar('Entry updated successfully!', 'success');
      setEditMode(null);
      setEditData({ meters: '', name: '', image_url: '' });
      await loadStockHistory(item.id);
    } catch (error) {
      console.error('Error updating entry:', error);
      showSnackbar('Error updating entry', 'error');
    }
  };

  const handleDelete = async (entryId) => {
    try {
      const { error } = await supabase
        .from('stock')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      showSnackbar('Entry deleted successfully!', 'success');
      await loadStockHistory(item.id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      showSnackbar('Error deleting entry', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setSelectedDeleteEntry(null);
    }
  };

  const renderStockHistory = () => (
    <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
      {stockHistory.map((entry, index) => {
        // Parse values using the VALUES format
        const valuesMatch = entry.name.match(/\[VALUES:([^\]]+)\]/);
        const valuesInfo = valuesMatch ? valuesMatch[1].split('|').map(value => {
          const [val, unit] = value.trim().split('-');
          return { value: parseFloat(val), unit };
        }) : [];

        // Calculate totals by unit
        const totalsByUnit = valuesInfo.reduce((acc, info) => {
          acc[info.unit] = (acc[info.unit] || 0) + info.value;
          return acc;
        }, {});

        return (
          <Paper
            key={entry.id}
            elevation={1}
            sx={{
              mb: 2,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ 
              p: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {/* Name Section */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    minWidth: { xs: '80px', sm: '100px' },
                    color: 'text.secondary'
                  }}
                >
                  Name
                </Typography>
                {editMode === entry.id ? (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : (
                  <Typography variant="body1">
                    {entry.name.split('[VALUES:')[0].trim()}
                  </Typography>
                )}
              </Box>

              {/* Values Section */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    minWidth: { xs: '80px', sm: '100px' },
                    color: 'text.secondary'
                  }}
                >
                  Values
                </Typography>
                {editMode === entry.id ? (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter values (e.g., 10-mtr, 20-pcs)"
                    value={editData.meters}
                    onChange={(e) => setEditData({ ...editData, meters: e.target.value })}
                    helperText="Separate multiple values with commas (e.g., 10-mtr, 20-pcs)"
                  />
                ) : (
                  <Typography variant="body1">
                    {valuesMatch ? valuesMatch[1] : ''}
                  </Typography>
                )}
              </Box>

              {/* Total Section */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    minWidth: { xs: '80px', sm: '100px' },
                    color: 'text.secondary'
                  }}
                >
                  Total
                </Typography>
                <Typography variant="body1">
                  {Object.entries(totalsByUnit).map(([unit, total], i) => (
                    <span key={unit}>
                      {i > 0 && ', '}
                      <Box 
                        component="span" 
                        sx={{ 
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        {`${total} ${unit}`}
                      </Box>
                    </span>
                  ))}
                </Typography>
              </Box>

              {/* Images Section */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    minWidth: { xs: '80px', sm: '100px' },
                    color: 'text.secondary'
                  }}
                >
                  Images
                </Typography>
                {editMode === entry.id ? (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter image URL"
                    value={editData.image_url || ''}
                    onChange={(e) => setEditData({ ...editData, image_url: e.target.value })}
                  />
                ) : (
                  entry.image_url && isValidUrl(entry.image_url) && (
                    <IconButton
                      onClick={() => setSelectedImage(entry.image_url)}
                      sx={{ 
                        p: 0,
                        '&:hover': {
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s'
                        }
                      }}
                    >
                      <img 
                        src="/circle.png" 
                        alt="View" 
                        style={{ 
                          width: '32px', 
                          height: '32px',
                          objectFit: 'contain'
                        }} 
                      />
                    </IconButton>
                  )
                )}
              </Box>

              {/* Actions Section */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 1,
                pt: 1
              }}>
                {editMode === entry.id ? (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveEdit(entry.id)}
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setEditMode(null);
                        setEditData({ meters: '', name: '', image_url: '' });
                      }}
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <IconButton 
                      onClick={() => handleEditClick(entry)}
                      color="primary"
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          bgcolor: 'primary.light',
                          color: 'white'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        setSelectedDeleteEntry(entry);
                        setOpenDeleteDialog(true);
                      }}
                      color="error"
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          bgcolor: 'error.light',
                          color: 'white'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );

  const renderManualEntryForm = () => (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Box component="form" onSubmit={showEntryForm ? handleManualEntry : handleTotalQuantitySubmit}>
        {!showEntryForm ? (
          <>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
              Select Total Number of Entries (1-6)
            </Typography>
            <TextField
              fullWidth
              label="Total Quantity"
              type="number"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(e.target.value)}
              inputProps={{ min: 1, max: 6 }}
              required
              sx={{ mb: 2 }}
              size="small"
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={!totalQuantity || totalQuantity < 1 || totalQuantity > 6}
              sx={{ 
                py: 1.5,
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'action.disabledBackground' }
              }}
            >
              Continue
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
              Enter Details for Entry {totalQuantity - remainingEntries + 1} of {totalQuantity}
            </Typography>
            {entries.length > 0 && (
              <Paper elevation={0} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Previous Entries:
                </Typography>
                {entries.map((entry, index) => (
                  <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                    Entry {index + 1}: {entry.value.toFixed(entry.value % 1 === 0 ? 0 : 1)}-{entry.unit}
                  </Typography>
                ))}
              </Paper>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meters"
                  type="number"
                  value={stockData.meters}
                  onChange={(e) => setStockData({ ...stockData, meters: e.target.value })}
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  multiline
                  rows={2}
                  value={stockData.name}
                  onChange={(e) => setStockData({ ...stockData, name: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Unit"
                  value={stockData.unit}
                  onChange={(e) => setStockData({ ...stockData, unit: e.target.value })}
                  size="small"
                >
                  <MenuItem value="mtr">Meters</MenuItem>
                  <MenuItem value="pcs">Pieces</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{ 
                  py: 1.5,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                Add Entry ({remainingEntries} remaining)
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setShowEntryForm(false);
                  setTotalQuantity('');
                  setEntries([]);
                  setRemainingEntries(0);
                }}
                sx={{ 
                  py: 1.5,
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: 'secondary.dark',
                    bgcolor: 'secondary.light',
                    color: 'white'
                  }
                }}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );

  if (!item) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

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
        <Toolbar>
          <IconButton 
            edge="start" 
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ 
            flex: 1,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            {item?.name || 'Item Details'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        {/* Manual Entry Form */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            height: '100%'
          }}
        >
          <Box component="form" onSubmit={handleTotalQuantitySubmit}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              mb: 3
            }}>
              Add New Stock Entry
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Total Number of Entries"
                  type="number"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  required
                  inputProps={{ min: "1", max: "6" }}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ 
                    py: 1,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)',
                    },
                    '&:disabled': {
                      transform: 'translateY(0)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Start Entry
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Entry Form */}
        {showEntryForm && (
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              mb: 3
            }}>
              Entry {totalQuantity - remainingEntries + 1} of {totalQuantity}
            </Typography>
            
            {entries.length > 0 && (
              <Paper elevation={0} sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="subtitle2" gutterBottom sx={{ 
                  color: 'primary.main',
                  fontWeight: 600 
                }}>
                  Previous Entries:
                </Typography>
                {entries.map((entry, index) => (
                  <Typography 
                    key={index} 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      color: 'primary.main'
                    }}
                  >
                    Entry {index + 1}: {entry.value.toFixed(entry.value % 1 === 0 ? 0 : 1)}-{entry.unit}
                  </Typography>
                ))}
              </Paper>
            )}

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meters"
                  type="number"
                  value={stockData.meters}
                  onChange={(e) => setStockData({ ...stockData, meters: e.target.value })}
                  size="small"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  multiline
                  rows={2}
                  value={stockData.name}
                  onChange={(e) => setStockData({ ...stockData, name: e.target.value })}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Unit"
                  value={stockData.unit}
                  onChange={(e) => setStockData({ ...stockData, unit: e.target.value })}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                >
                  <MenuItem value="mtr">Meters</MenuItem>
                  <MenuItem value="pcs">Pieces</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleManualEntry}
                sx={{ 
                  flex: 1,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Add Entry ({remainingEntries} remaining)
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowEntryForm(false);
                  setTotalQuantity('');
                  setEntries([]);
                  setRemainingEntries(0);
                }}
                sx={{ 
                  flex: 1,
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.lighter',
                    borderColor: 'error.dark',
                  }
                }}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        )}

        {/* Stock History */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'white',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            mb: 3
          }}
        >
          {renderStockHistory()}
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => {
            setOpenDeleteDialog(false);
            setSelectedDeleteEntry(null);
          }}
          PaperProps={{
            sx: { 
              borderRadius: 3,
              p: 2,
              minWidth: { xs: '90%', sm: '400px' }
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'error.main', fontWeight: 600 }}>
              Delete Entry
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Are you sure you want to delete this entry? This action cannot be undone.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setOpenDeleteDialog(false);
                  setSelectedDeleteEntry(null);
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
                onClick={() => handleDelete(selectedDeleteEntry?.id)}
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

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              boxShadow: 4,
              borderRadius: 2
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ItemDetailsPage;
