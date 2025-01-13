import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Stack,
  Tooltip
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

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const getGoogleDriveImageUrl = (url) => {
  if (!url) return '';
  
  try {
    // Extract file ID from various URL formats
    let fileId = '';
    
    if (url.includes('lh3.googleusercontent.com/d/')) {
      fileId = url.split('/d/')[1]?.split('?')[0];
    } else if (url.includes('drive.usercontent.google.com')) {
      fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    } else if (url.includes('drive.google.com/file/d/')) {
      fileId = url.match(/\/file\/d\/([^/]+)/)?.[1];
    } else if (url.includes('drive.google.com')) {
      fileId = url.match(/id=([^&]+)/)?.[1];
    }

    if (fileId) {
      // Clean up the file ID
      fileId = fileId.split('&')[0].split('?')[0].split('/')[0];
      // Try the export=view format first as it's more reliable
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return url;
  } catch (error) {
    console.error('Error processing URL:', error);
    return url;
  }
};

const getImageFallbackUrls = (url) => {
  try {
    let fileId = '';
    
    if (url.includes('lh3.googleusercontent.com/d/')) {
      fileId = url.split('/d/')[1]?.split('?')[0];
    } else if (url.includes('drive.usercontent.google.com')) {
      fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    } else if (url.includes('drive.google.com/file/d/')) {
      fileId = url.match(/\/file\/d\/([^/]+)/)?.[1];
    } else if (url.includes('drive.google.com')) {
      fileId = url.match(/id=([^&]+)/)?.[1];
    }

    if (!fileId) return [];

    // Clean up the file ID
    fileId = fileId.split('&')[0].split('?')[0].split('/')[0];

    // Return array of possible URLs to try
    return [
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
      `https://lh3.googleusercontent.com/d/${fileId}?sz=w2000`,
      `https://drive.usercontent.google.com/download?id=${fileId}`,
      `https://lh3.googleusercontent.com/d/${fileId}`
    ];
  } catch (error) {
    console.error('Error generating fallback URLs:', error);
    return [];
  }
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const formatValueUnit = (value) => {
  if (!value) return ''; // Handle undefined, null, or empty values
  
  // Remove extra spaces and clean up
  const cleanValue = value.toString().trim();
  
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
  return cleanValue; // Return cleaned value if no match
};

const getStatusDot = (quantity, unit) => {
  // Add safety checks
  if (!quantity || !unit) return null;
  
  const threshold = (unit || '').toLowerCase() === 'mtr' ? 50 : 15;
  const isAboveThreshold = parseFloat(quantity) >= threshold;
  const statusText = isAboveThreshold 
    ? `Good Stock Level (${quantity} ${unit})` 
    : `Low Stock Alert (${quantity} ${unit})`;
  
  return (
    <Tooltip 
      title={
        <Typography 
          sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 500 
          }}
        >
          {statusText}
        </Typography>
      } 
      arrow 
      placement="right"
    >
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          width: { xs: 8, sm: 10 },
          height: { xs: 8, sm: 10 },
          borderRadius: '50%',
          bgcolor: isAboveThreshold ? 'success.main' : 'error.main',
          ml: 1.5,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          boxShadow: '0 0 4px rgba(0,0,0,0.2)',
          '&:hover': {
            transform: 'scale(1.2)',
            boxShadow: theme => `0 0 8px ${isAboveThreshold ? theme.palette.success.main : theme.palette.error.main}`,
          }
        }}
      />
    </Tooltip>
  );
};

const calculateTotal = (values) => {
  console.log('Calculating total for values:', values);
  if (!values) return '0';
  
  // Split by pipe and clean up each value
  const items = values.split('|').map(v => v.trim());
  console.log('Split items:', items);
  let mtrTotal = 0;
  let pcsTotal = 0;
  
  items.forEach(item => {
    console.log('Processing item:', item);
    // Match numbers followed by unit (mtr or pcs)
    const match = item.match(/(\d+\.?\d*)\s*-\s*(mtr|pcs|MTR|PCS)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      console.log('Matched:', { value, unit });
      
      if (unit === 'mtr') {
        mtrTotal += value;
      } else if (unit === 'pcs') {
        pcsTotal += value;
      }
    }
  });
  
  console.log('Totals:', { mtrTotal, pcsTotal });
  const totals = [];
  if (mtrTotal > 0) totals.push(`${mtrTotal.toFixed(mtrTotal % 1 === 0 ? 0 : 1)}-mtr`);
  if (pcsTotal > 0) totals.push(`${pcsTotal.toFixed(pcsTotal % 1 === 0 ? 0 : 1)}-pcs`);
  
  const result = totals.join(' | ') || '0';
  console.log('Final result:', result);
  return result;
};

const formatName = (name, values) => {
  if (!name) return '-';
  return name;
};

const formatValues = (values) => {
  if (!values) return '-';
  // Split by | and trim each value
  return values.split('|').map(v => v.trim()).join(' | ');
};

const extractNameAndValues = (fullName) => {
  if (!fullName) return { name: '', values: '' };
  
  const match = fullName.match(/^(.*?)\s*\[VALUES:\s*([^\]]+)\]/);
  if (!match) return { name: fullName, values: '' };
  
  const [, name, values] = match;
  console.log('Extracted:', { name, values });
  return { name: name.trim(), values: values.trim() };
};

const StatusDotMemo = React.memo(({ quantity, unit }) => {
  if (!quantity || !unit) return null;
  
  const threshold = (unit || '').toLowerCase() === 'mtr' ? 50 : 15;
  const numericQuantity = parseFloat(quantity);
  
  let color = '#4CAF50'; // Green for good stock
  let boxShadow = '0 0 8px #4CAF50';
  let title = 'Good Stock Level';
  
  if (isNaN(numericQuantity)) {
    color = '#9E9E9E';
    boxShadow = '0 0 8px #9E9E9E';
    title = 'Invalid Quantity';
  } else if (numericQuantity < threshold) {
    color = '#F44336';
    boxShadow = '0 0 8px #F44336';
    title = `Low Stock Level (Need ${threshold} ${unit} for good status)`;
  }
  
  return (
    <Box
      component="span"
      title={title}
      sx={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: color,
        marginLeft: '8px',
        boxShadow: 'none',
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'scale(1.3)',
          boxShadow: boxShadow,
        },
        '&:active': {
          transform: 'scale(0.9)',
        }
      }}
    />
  );
});

const TableRowMemo = React.memo(function TableRowMemo({ 
  entry, 
  editMode, 
  editData, 
  handleEdit, 
  handleSave, 
  handleCancel, 
  setEditData,
  validateValues,
  setSelectedImage,
  setSelectedDeleteEntry,
  setOpenDeleteDialog,
  setEditMode,
  calculateTotal,
  isValidUrl
}) {
  // Get initial values when entering edit mode
  React.useEffect(() => {
    if (editMode === entry.id) {
      // Convert pipe-separated to comma-separated
      const commaValues = entry.values.split('|').map(v => v.trim()).join(', ');
      setEditData(prev => ({
        ...prev,
        meters: commaValues
      }));
    }
  }, [editMode, entry.id, entry.values, setEditData]);

  const handleImageClick = (imageUrl) => {
    if (!imageUrl) return;
    console.log('Original image URL:', imageUrl);
    const processedUrl = getGoogleDriveImageUrl(imageUrl);
    console.log('Processed image URL:', processedUrl);
    setSelectedImage(processedUrl);
  };

  return (
    <TableRow
      hover
      sx={{
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <TableCell>{entry.index}</TableCell>
      <TableCell>
        {editMode === entry.id ? (
          <TextField
            fullWidth
            size="small"
            value={editData.name || ''}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
        ) : (
          entry.name
        )}
      </TableCell>
      <TableCell>
        {editMode === entry.id ? (
          <TextField
            fullWidth
            size="small"
            placeholder="e.g., 5-mtr, 3-pcs"
            value={editData.meters}
            onChange={(e) => {
              const newValue = e.target.value;
              setEditData(prev => ({ ...prev, meters: newValue }));
            }}
            error={editData.meters && !validateValues(editData.meters)}
          />
        ) : (
          entry.values
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {calculateTotal(editMode === entry.id ? editData.meters : entry.values).split(' | ').map((total, index) => {
            const [value, unit] = (total || '').split('-');
            return (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  '&:hover': {
                    '& .MuiTypography-root': {
                      color: 'primary.main',
                      transform: 'translateX(2px)',
                    }
                  }
                }}
              >
                <Typography 
                  variant="body2"
                  sx={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    letterSpacing: '0.01em',
                    transition: 'all 0.2s ease-in-out',
                    color: 'text.primary',
                    cursor: 'default',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                >
                  {total}
                </Typography>
                <StatusDotMemo quantity={value} unit={unit} />
              </Box>
            );
          })}
        </Box>
      </TableCell>
      <TableCell>
        {editMode === entry.id ? (
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
            {entry.image_url && isValidUrl(entry.image_url) && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(entry.image_url);
                }}
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
                    width: '24px', 
                    height: '24px',
                    objectFit: 'contain'
                  }} 
                />
              </IconButton>
            )}
          </Box>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {editMode === entry.id ? (
            <>
              <IconButton
                size="small"
                onClick={() => handleSave(entry.id)}
                color="primary"
                sx={{ 
                  p: { xs: 0.5, sm: 1 },
                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                }}
              >
                <SaveIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setEditMode(null);
                  setEditData({ meters: '', name: '', image_url: '' });
                }}
                color="secondary"
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
                size="small"
                onClick={() => handleEdit(entry)}
                color="primary"
                sx={{ 
                  p: { xs: 0.5, sm: 1 },
                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                }}
              >
                <EditIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedDeleteEntry(entry);
                  setOpenDeleteDialog(true);
                }}
                color="secondary"
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
      </TableCell>
    </TableRow>
  );
});

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

  const validateValues = (value) => {
    if (!value) return true; // Allow empty value

    // Split by commas and trim whitespace
    const values = value.split(',').map(v => v.trim());
    
    // Allow partial input while typing
    const isValid = values.every(val => {
      if (!val) return true; // Skip empty values
      // Allow number followed by optional -mtr or -pcs
      // This allows typing in progress like "78.5-" or "78.5-m"
      return /^\d+\.?\d*(-?(mtr|pcs)?)?$/i.test(val);
    });

    return isValid;
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
    console.log('handleEditClick - Before:', { entry, editMode, editData });
    const { name, values } = extractNameAndValues(entry.name);
    console.log('handleEditClick - After extract:', { name, values });
    setEditMode(entry.id);
    setEditData({
      name: name,
      meters: values,
      image_url: entry.image_url || ''
    });
    console.log('handleEditClick - After setEditData:', { name, values, editMode: entry.id });
  };

  const handleSaveEdit = async (id) => {
    try {
      // Validate format only when saving
      const values = editData.meters.split(',').map(v => v.trim());
      const isValidFormat = values.every(val => {
        if (!val) return true;
        return /^\d+\.?\d*-(mtr|pcs)$/i.test(val);
      });

      if (!isValidFormat) {
        showSnackbar('Invalid value format. Use format like "78.5-mtr" or "30-pcs"', 'error');
        return;
      }

      // Convert comma-separated to pipe-separated for storage
      const formattedValues = values
        .filter(v => v)
        .join(' | ');

      const formattedName = `${editData.name}[VALUES:${formattedValues}]`;
      
      const { error } = await supabase
        .from('stock')
        .update({
          name: formattedName,
          image_url: editData.image_url
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setStockHistory(stockHistory.map(entry =>
        entry.id === id
          ? { ...entry, name: formattedName, image_url: editData.image_url }
          : entry
      ));

      setEditMode(null);
      setEditData({ name: '', meters: '', image_url: '' });
      showSnackbar('Entry updated successfully', 'success');
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
                    onChange={(e) => {
                      // Allow any input while typing
                      setEditData({ ...editData, meters: e.target.value });
                    }}
                    error={editData.meters && !validateValues(editData.meters)}
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {Object.entries(totalsByUnit).map(([unit, total], index) => (
                    <Typography 
                      key={unit} 
                      variant="body1"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mr: 2 
                      }}
                    >
                      {total.toFixed(total % 1 === 0 ? 0 : 1)}-{unit}
                      <StatusDotMemo quantity={total} unit={unit} />
                    </Typography>
                  ))}
                </Box>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Image URL"
                      value={editData.image_url || ''}
                      onChange={(e) => setEditData({ ...editData, image_url: e.target.value })}
                    />
                    {editData.image_url && (
                      <Box
                        component="img"
                        src={isValidUrl(editData.image_url) ? editData.image_url : getGoogleDriveImageUrl(editData.image_url)}
                        alt="Preview"
                        sx={{
                          width: 50,
                          height: 50,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  entry.image_url && (
                    <Box
                      component="img"
                      src={isValidUrl(entry.image_url) ? entry.image_url : getGoogleDriveImageUrl(entry.image_url)}
                      alt="Stock Entry"
                      sx={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedImage(entry.image_url)}
                    />
                  )
                )}
              </Box>

              {/* Actions Section */}
              <Box sx={{ 
                display: 'flex',
                gap: 1,
                ml: 'auto'
              }}>
                {editMode === entry.id ? (
                  <>
                    <IconButton
                      onClick={() => handleSaveEdit(entry.id)}
                      color="primary"
                      size="small"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.main' },
                        display: { xs: 'none', sm: 'inline-flex' }  // Hide on mobile
                      }}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => setEditMode(null)}
                      color="error"
                      size="small"
                      sx={{
                        bgcolor: 'error.light',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.main' },
                        display: { xs: 'none', sm: 'inline-flex' }  // Hide on mobile
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      onClick={() => handleEditClick(entry)}
                      color="primary"
                      size="small"
                      sx={{
                        '&:hover': { bgcolor: 'primary.light', color: 'white' },
                        display: { xs: 'none', sm: 'inline-flex' }  // Hide on mobile
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedDeleteEntry(entry);
                        setOpenDeleteDialog(true);
                      }}
                      color="error"
                      size="small"
                      sx={{
                        '&:hover': { bgcolor: 'error.light', color: 'white' },
                        display: { xs: 'none', sm: 'inline-flex' }  // Hide on mobile
                      }}
                    >
                      <DeleteIcon fontSize="small" />
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
      <Box component="form" onSubmit={handleTotalQuantitySubmit}>
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
              Continue
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
              Enter Details for Entry {totalQuantity - remainingEntries + 1} of {totalQuantity}
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
          </>
        )}
      </Box>
    </Paper>
  );

  const renderTableBody = () => {
    return stockHistory.map((entry, index) => {
      const { name, values } = extractNameAndValues(entry.name);
      console.log('renderTableBody - Processing entry:', { 
        originalName: entry.name,
        extractedName: name, 
        extractedValues: values 
      });

      const processedEntry = {
        ...entry,
        index: index + 1,
        name,
        values
      };

      console.log('renderTableBody - Final entry:', processedEntry);

      return (
        <TableRowMemo
          key={entry.id}
          entry={processedEntry}
          editMode={editMode}
          editData={editData}
          handleEdit={handleEditClick}
          handleSave={handleSaveEdit}
          handleCancel={() => setEditMode(null)}
          setEditData={setEditData}
          validateValues={validateValues}
          setSelectedImage={setSelectedImage}
          setSelectedDeleteEntry={setSelectedDeleteEntry}
          setOpenDeleteDialog={setOpenDeleteDialog}
          setEditMode={setEditMode}
          calculateTotal={calculateTotal}
          isValidUrl={isValidUrl}
        />
      );
    });
  };

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
    console.log('Closing image dialog');
    setSelectedImage(null);
  };

  const handleDialogClick = (e) => {
    // Close dialog when clicking outside the image
    if (e.target === e.currentTarget) {
      handleCloseImage();
    }
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
            {`${item?.name || 'Item Details'} (${stockHistory.length})`}
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
            height: '100%',
            display: { xs: 'none', sm: 'block' }  // Hide on mobile, show on web
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
                  inputProps={{ min: 1, max: 6 }}
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
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Index</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Values</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Images</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderTableBody()}
                {stockHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
          <IconButton
            onClick={handleCloseImage}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              },
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2
            }}
          >
            {selectedImage && (
              <img
                key={selectedImage}
                src={getGoogleDriveImageUrl(selectedImage)}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  padding: '12px'
                }}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (!selectedImage) return;
                  e.target.onerror = null;
                  console.error('Failed to load image:', selectedImage);

                  // Get array of fallback URLs
                  const fallbackUrls = getImageFallbackUrls(selectedImage);
                  const currentUrl = e.target.src;
                  
                  // Find next URL to try
                  const nextUrlIndex = fallbackUrls.findIndex(url => url === currentUrl) + 1;
                  if (nextUrlIndex < fallbackUrls.length) {
                    console.log('Trying next fallback URL:', fallbackUrls[nextUrlIndex]);
                    e.target.src = fallbackUrls[nextUrlIndex];
                    return;
                  }
                  
                  // If all fallbacks fail
                  e.target.src = '/placeholder-image.png';
                  showSnackbar('Error loading image. Please check if the image URL is correct and accessible.', 'error');
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

export default React.memo(ItemDetailsPage);
