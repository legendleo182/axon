import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { getAllIpMappings, addIpMapping, deleteIpMapping } from '../utils/ipManager';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const IpManagementPage = () => {
  const [ipMappings, setIpMappings] = useState([]);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    loadIpMappings();
  }, []);

  const loadIpMappings = async () => {
    const { data, error } = await getAllIpMappings();
    if (error) {
      showSnackbar(error, 'error');
    } else {
      setIpMappings(data || []);
    }
  };

  const handleAddMapping = async (e) => {
    e.preventDefault();
    const { error } = await addIpMapping(newIpAddress, newEmail);
    if (error) {
      showSnackbar(error, 'error');
    } else {
      showSnackbar('IP mapping added successfully', 'success');
      setNewIpAddress('');
      setNewEmail('');
      loadIpMappings();
    }
  };

  const handleDeleteMapping = async (ipAddress) => {
    if (window.confirm('Are you sure you want to delete this IP mapping?')) {
      const { error } = await deleteIpMapping(ipAddress);
      if (error) {
        showSnackbar(error, 'error');
      } else {
        // Get the current user's IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIp = data.ip;

        showSnackbar('IP mapping deleted successfully', 'success');
        loadIpMappings();

        // If the deleted IP matches the current user's IP, log them out
        if (ipAddress === currentIp) {
          await supabase.auth.signOut();
          navigate('/login');
        }
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Add New IP Mapping
        </Typography>
        <Box component="form" onSubmit={handleAddMapping} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="IP Address"
            value={newIpAddress}
            onChange={(e) => setNewIpAddress(e.target.value)}
            required
            size="small"
          />
          <TextField
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            size="small"
          />
          <Button type="submit" variant="contained">
            Add Mapping
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>IP Address</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ipMappings.map((mapping) => (
              <TableRow key={mapping.ip_address}>
                <TableCell>{mapping.ip_address}</TableCell>
                <TableCell>{mapping.email}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleDeleteMapping(mapping.ip_address)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default IpManagementPage;
