import React, { useEffect, useState, Suspense } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, InputAdornment, MenuItem, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import QrCodeIcon from '@mui/icons-material/QrCode';
import Layout from '../components/Layout';
import api from '../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import QRCode from 'react-qr-code';

const initialProduct = { description: '', hsnCode: '', qty: 1, rate: 0, amount: 0 };
const initialForm = {
  billNumber: '',
  date: '',
  receiver: '',
  products: [initialProduct],
  tax: { cgst: 0, sgst: 0, igst: 0, roundOff: 0, totalBeforeTax: 0, totalAfterTax: 0, totalInWords: '', cgstRate: 2.5, sgstRate: 2.5 },
};

const backendBase = 'https://gst-bill-backend-7sp5.onrender.com';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [receivers, setReceivers] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [qrValue, setQrValue] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [qrDialog, setQrDialog] = useState({ open: false, bill: null });
  const [receiverSearch, setReceiverSearch] = useState('');

  const fetchBills = async () => {
    try {
      const res = await api.get('/api/bill');
      // Strict descending order: date, then bill number
      setBills(res.data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() === dateB.getTime()) {
          return (b.billNumber || 0) - (a.billNumber || 0);
        }
        return dateB - dateA;
      }));
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch bills', severity: 'error' });
    }
  };
  const fetchReceivers = async () => {
    const res = await api.get('/api/receiver');
    setReceivers(res.data);
  };
  const fetchProductSuggestions = async (search = '') => {
    const res = await api.get('/api/product', { params: { search } });
    setProductSuggestions(res.data);
  };
  const fetchCompany = async () => {
    const res = await api.get('/api/company');
    if (res.data && res.data._id) setCompanyId(res.data._id);
  };

  useEffect(() => { fetchBills(); fetchReceivers(); fetchCompany(); }, []);

  const handleOpen = (bill = null) => {
    if (bill) {
      setEditId(bill._id);
      formik.setValues({ ...bill, receiver: bill.receiver?._id || bill.receiver });
      // Generate a compact QR value with only essential info
      const qrData = JSON.stringify({
        billNumber: bill.billNumber,
        date: bill.date,
        receiver: bill.receiver?.name || '',
        products: bill.products?.map(p => p.description).join(', '),
        total: bill.tax?.totalAfterTax
      });
      setQrValue(qrData);
      recalcTax(bill.products, bill.tax);
    } else {
      setEditId(null);
      formik.resetForm();
      setQrValue('');
    }
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleDelete = async (id) => {
    await api.delete(`/bill/${id}`);
    setSnackbar({ open: true, message: 'Bill deleted', severity: 'success' });
    fetchBills();
  };

  const handleProductChange = (idx, field, value) => {
    const newProducts = formik.values.products.map((product, index) => {
      if (idx !== index) return product;
      
      const updatedProduct = { ...product, [field]: value };
      
      if (field === 'qty' || field === 'rate') {
        const qty = field === 'qty' ? Number(value) : Number(product.qty);
        const rate = field === 'rate' ? Number(value) : Number(product.rate);
        updatedProduct.amount = qty * rate;
      }
      return updatedProduct;
    });

    formik.setFieldValue('products', newProducts);
    recalcTax(newProducts, formik.values.tax);
  };

  const handleAddProduct = () => {
    formik.setFieldValue('products', [...formik.values.products, { ...initialProduct }]);
  };
  const handleRemoveProduct = (idx) => {
    const products = formik.values.products.filter((_, i) => i !== idx);
    formik.setFieldValue('products', products);
    recalcTax(products, formik.values.tax);
  };

  const recalcTax = (products, rates) => {
    const totalBeforeTax = products.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cgstRate = Number(rates.cgstRate) / 100 || 0;
    const sgstRate = Number(rates.sgstRate) / 100 || 0;
    
    const cgst = totalBeforeTax * cgstRate;
    const sgst = totalBeforeTax * sgstRate;
    const igst = 0;
    const totalWithTax = totalBeforeTax + cgst + sgst;
    const roundOff = Math.round(totalWithTax) - totalWithTax;
    const totalAfterTax = Math.round(totalWithTax);
    const totalInWords = numToWords(totalAfterTax);
    formik.setFieldValue('tax', { ...rates, cgst, sgst, igst, roundOff, totalBeforeTax, totalAfterTax, totalInWords });
  };

  function numToWords(num) {
    // Simple number to words (Indian style)
    const a = [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen' ];
    const b = [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{3})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' ' : '';
    return str.trim() + ' Only';
  }

  const formik = useFormik({
    initialValues: initialForm,
    validationSchema: Yup.object({
      billNumber: Yup.string().required('Required'),
      date: Yup.string().required('Required'),
      receiver: Yup.string().required('Required'),
      products: Yup.array().of(
        Yup.object({
          description: Yup.string().required('Required'),
          hsnCode: Yup.string(),
          qty: Yup.number().min(1).required('Required'),
          rate: Yup.number().min(0).required('Required'),
        })
      ),
    }),
    onSubmit: async (values) => {
      // Generate a compact QR value for backend as well
      const qrData = JSON.stringify({
        billNumber: values.billNumber,
        date: values.date,
        receiver: receivers.find(r => r._id === values.receiver)?.name || '',
        products: values.products?.map(p => p.description).join(', '),
        total: formik.values.tax.totalAfterTax
      });
      const data = { ...values, qrCode: qrData, pdfUrl: '', company: companyId };
      if (editId) {
        await api.put(`/bill/${editId}`, data);
        setSnackbar({ open: true, message: 'Bill updated', severity: 'success' });
      } else {
        await api.post('/bill', data);
        setSnackbar({ open: true, message: 'Bill added', severity: 'success' });
      }
      await fetchBills(); // Always refetch to get populated receiver/company
      handleClose();
    },
    enableReinitialize: true,
  });

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredBills = bills.filter(b => {
    const searchTerm = search.toLowerCase();
    return (
      b.billNumber.toString().toLowerCase().includes(searchTerm) ||
      (b.receiver?.name && b.receiver.name.toLowerCase().includes(searchTerm))
    );
  });

  // Filter receivers for dropdown
  const filteredReceivers = receivers.filter(r => r.name.toLowerCase().includes(receiverSearch.toLowerCase()));

  return (
    <Layout>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Bills</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Add Bill</Button>
      </Box>
      <TextField
        placeholder="Search by bill number"
        value={search}
        onChange={handleSearch}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        sx={{ mb: 2, width: 300 }}
      />
      {/* <TextField
        fullWidth
        margin="normal"
        label="Search Receiver"
        value={receiverSearch}
        onChange={e => setReceiverSearch(e.target.value)}
        placeholder="Type to search receiver names"
      /> */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill Number</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Receiver</TableCell>
              <TableCell>Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills.map((b) => (
              <TableRow key={b._id}>
                <TableCell>{b.billNumber}</TableCell>
                <TableCell>{b.date?.slice(0, 10)}</TableCell>
                <TableCell>{b.receiver?.name || ''}</TableCell>
                <TableCell>{b.tax?.totalAfterTax?.toFixed(2) || (b.products && b.products.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)) || ''}</TableCell>
                <TableCell align="right">
                  {b.pdfUrl && typeof b.pdfUrl === 'string' && b.pdfUrl.trim() !== '' && (
                    <>
                      <IconButton href={backendBase + b.pdfUrl} target="_blank" title="View PDF"><PictureAsPdfIcon /></IconButton>
                      <IconButton component="a" href={backendBase + b.pdfUrl} download title="Download PDF"><span role="img" aria-label="download">⬇️</span></IconButton>
                    </>
                  )}
                  <IconButton onClick={() => handleOpen(b)} title="Edit"><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(b._id)} title="Delete"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog.open} onClose={() => setQrDialog({ open: false, bill: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Bill QR Code & Details</DialogTitle>
        <DialogContent>
          {qrDialog.bill && (
            <>
              <Box mt={2} textAlign="center">
                <QRCode value={qrDialog.bill.qrCode} size={180} />
              </Box>
              <Box mt={2}>
                <Typography variant="subtitle1">Bill Number: {qrDialog.bill.billNumber}</Typography>
                <Typography>Date: {qrDialog.bill.date?.slice(0, 10)}</Typography>
                <Typography>Receiver: {qrDialog.bill.receiver?.name || ''}</Typography>
                <Typography>Products:</Typography>
                <ul>
                  {qrDialog.bill.products.map((p, i) => (
                    <li key={i}>{p.description} (HSN: {p.hsnCode}) - Qty: {p.qty}, Rate: {p.rate}, Amount: {p.amount}</li>
                  ))}
                </ul>
                <Typography>CGST: {qrDialog.bill.tax?.cgst?.toFixed(2)}</Typography>
                <Typography>SGST: {qrDialog.bill.tax?.sgst?.toFixed(2)}</Typography>
                <Typography>IGST: {qrDialog.bill.tax?.igst?.toFixed(2)}</Typography>
                <Typography>Round Off: {qrDialog.bill.tax?.roundOff?.toFixed(2)}</Typography>
                <Typography>Total Before Tax: {qrDialog.bill.tax?.totalBeforeTax?.toFixed(2)}</Typography>
                <Typography>Total After Tax: {qrDialog.bill.tax?.totalAfterTax?.toFixed(2)}</Typography>
                <Typography>Total in Words: {qrDialog.bill.tax?.totalInWords}</Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog({ open: false, bill: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Bill' : 'Add Bill'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid>
                <TextField fullWidth margin="normal" label="Bill Number" name="billNumber" value={formik.values.billNumber} onChange={formik.handleChange} error={formik.touched.billNumber && Boolean(formik.errors.billNumber)} helperText={formik.touched.billNumber && formik.errors.billNumber} />
              </Grid>
              <Grid>
                <TextField fullWidth margin="normal" label="Date" name="date" type="date" value={formik.values.date ? formik.values.date.slice(0, 10) : ''} onChange={formik.handleChange} error={formik.touched.date && Boolean(formik.errors.date)} helperText={formik.touched.date && formik.errors.date} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid>
                <TextField select fullWidth margin="normal" label="Receiver" name="receiver" value={formik.values.receiver} onChange={formik.handleChange} error={formik.touched.receiver && Boolean(formik.errors.receiver)} helperText={formik.touched.receiver && formik.errors.receiver} >
                  {filteredReceivers.map((r) => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <Typography variant="subtitle1" mt={2}>Products</Typography>
            {formik.values.products.map((p, idx) => (
              <Grid container spacing={1} key={idx} alignItems="center">
                <Grid>
                  <TextField
                    fullWidth
                    label="Description"
                    name={`products[${idx}].description`}
                    value={p.description}
                    onChange={e => handleProductChange(idx, 'description', e.target.value)}
                    onBlur={() => fetchProductSuggestions(p.description)}
                    error={formik.touched.products?.[idx]?.description && Boolean(formik.errors.products?.[idx]?.description)}
                    helperText={formik.touched.products?.[idx]?.description && formik.errors.products?.[idx]?.description}
                    autoComplete="off"
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label="HSN Code"
                    name={`products[${idx}].hsnCode`}
                    value={p.hsnCode}
                    onChange={e => handleProductChange(idx, 'hsnCode', e.target.value)}
                    autoComplete="off"
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label="Qty"
                    name={`products[${idx}].qty`}
                    type="number"
                    value={p.qty}
                    onChange={e => handleProductChange(idx, 'qty', e.target.value)}
                    error={formik.touched.products?.[idx]?.qty && Boolean(formik.errors.products?.[idx]?.qty)}
                    helperText={formik.touched.products?.[idx]?.qty && formik.errors.products?.[idx]?.qty}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label="Rate"
                    name={`products[${idx}].rate`}
                    type="number"
                    value={p.rate}
                    onChange={e => handleProductChange(idx, 'rate', e.target.value)}
                    error={formik.touched.products?.[idx]?.rate && Boolean(formik.errors.products?.[idx]?.rate)}
                    helperText={formik.touched.products?.[idx]?.rate && formik.errors.products?.[idx]?.rate}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label="Amount"
                    name={`products[${idx}].amount`}
                    value={p.amount}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid>
                  <Button color="error" onClick={() => handleRemoveProduct(idx)} disabled={formik.values.products.length === 1}>Remove</Button>
                </Grid>
              </Grid>
            ))}
            <Button onClick={handleAddProduct} sx={{ mt: 1 }}>Add Product</Button>
            <Box mt={2} sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
              <Typography variant="h6" mb={1}>Tax Calculation</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="CGST Rate (%)"
                    name="tax.cgstRate"
                    type="number"
                    value={formik.values.tax.cgstRate}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="SGST Rate (%)"
                    name="tax.sgstRate"
                    type="number"
                    value={formik.values.tax.sgstRate}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>CGST: {formik.values.tax.cgst.toFixed(2)}</Typography>
                  <Typography>SGST: {formik.values.tax.sgst.toFixed(2)}</Typography>
                  <Typography>Total Before Tax: {formik.values.tax.totalBeforeTax.toFixed(2)}</Typography>
                  <Typography variant="h6">Total After Tax: {formik.values.tax.totalAfterTax.toFixed(2)}</Typography>
                </Grid>
              </Grid>
              <Typography sx={{mt:1}}>Total in Words: {formik.values.tax.totalInWords}</Typography>
            </Box>
            {qrValue && (
              <Box mt={2} textAlign="center">
                <Typography variant="subtitle2">Bill QR Code</Typography>
                <Suspense fallback={<div>Loading QR...</div>}>
                  <QRCode value={qrValue} size={128} />
                </Suspense>
              </Box>
            )}
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

export default Bills; 