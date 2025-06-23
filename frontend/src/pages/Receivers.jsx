import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, InputAdornment, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '../components/Layout';
import api from '../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const initialForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  gstNumber: '',
};

const Receivers = () => {
  const [receivers, setReceivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchReceivers = async (searchTerm = '') => {
    const res = await api.get('/api/receiver', { params: { search: searchTerm } });
    setReceivers(res.data);
  };

  useEffect(() => { fetchReceivers(); }, []);

  const handleOpen = (receiver = null) => {
    if (receiver) {
      setEditId(receiver._id);
      formik.setValues(receiver);
    } else {
      setEditId(null);
      formik.resetForm();
    }
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleDelete = async (id) => {
    await api.delete(`/api/receiver/${id}`);
    setSnackbar({ open: true, message: 'Receiver deleted', severity: 'success' });
    fetchReceivers(search);
  };

  const formik = useFormik({
    initialValues: initialForm,
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      address: Yup.string().required('Required'),
      phone: Yup.string(),
      email: Yup.string().email('Invalid email'),
      gstNumber: Yup.string(),
    }),
    onSubmit: async (values) => {
      if (editId) {
        await api.put(`/api/receiver/${editId}`, values);
        setSnackbar({ open: true, message: 'Receiver updated', severity: 'success' });
      } else {
        await api.post('/api/receiver', values);
        setSnackbar({ open: true, message: 'Receiver added', severity: 'success' });
      }
      fetchReceivers(search);
      handleClose();
    },
    enableReinitialize: true,
  });

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchReceivers(e.target.value);
  };

  return (
    <Layout>
      <Box display="flex" alignItems={{ xs: 'stretch', sm: 'center' }} flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h5" sx={{ fontSize: { xs: 18, sm: 22 } }}>Receivers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ width: { xs: '100%', sm: 'auto' } }}>Add Receiver</Button>
      </Box>
      <TextField
        placeholder="Search by name"
        value={search}
        onChange={handleSearch}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        sx={{ mb: 2, width: { xs: '100%', sm: 300 } }}
        size="small"
      />
      <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>GST Number</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receivers.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.address}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.gstNumber}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(r)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(r._id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Receiver' : 'Add Receiver'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth margin="normal" label="Name" name="name" value={formik.values.name} onChange={formik.handleChange} error={formik.touched.name && Boolean(formik.errors.name)} helperText={formik.touched.name && formik.errors.name} size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth margin="normal" label="Address" name="address" value={formik.values.address} onChange={formik.handleChange} error={formik.touched.address && Boolean(formik.errors.address)} helperText={formik.touched.address && formik.errors.address} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth margin="normal" label="Phone" name="phone" value={formik.values.phone} onChange={formik.handleChange} error={formik.touched.phone && Boolean(formik.errors.phone)} helperText={formik.touched.phone && formik.errors.phone} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth margin="normal" label="Email" name="email" value={formik.values.email} onChange={formik.handleChange} error={formik.touched.email && Boolean(formik.errors.email)} helperText={formik.touched.email && formik.errors.email} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth margin="normal" label="GST Number" name="gstNumber" value={formik.values.gstNumber} onChange={formik.handleChange} error={formik.touched.gstNumber && Boolean(formik.errors.gstNumber)} helperText={formik.touched.gstNumber && formik.errors.gstNumber} size="small" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">{editId ? 'Update' : 'Add'}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Layout>
  );
};

export default Receivers; 