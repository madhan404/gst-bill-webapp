import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid, Avatar, Alert } from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const initialValues = {
  companyName: '',
  address: '',
  gstNumber: '',
  phone: '',
  proprietorName: '',
  email: '',
  logo: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  branch: '',
};

const CompanyProfile = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState('');

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      companyName: Yup.string().required('Required'),
      address: Yup.string().required('Required'),
      gstNumber: Yup.string().required('Required'),
      phone: Yup.string(),
      proprietorName: Yup.string(),
      email: Yup.string().email('Invalid email'),
      bankName: Yup.string(),
      accountNumber: Yup.string(),
      ifsc: Yup.string(),
      branch: Yup.string(),
    }),
    onSubmit: async (values) => {
      setError('');
      setSuccess('');
      try {
        await api.post('/api/company', values);
        setSuccess('Profile updated');
      } catch (err) {
        setError(err.response?.data?.message || 'Update failed');
      }
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/company');
        if (res.data) {
          formik.setValues(res.data);
          setLogoPreview(res.data.logo);
        }
      } catch {}
      setLoading(false);
    };
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        formik.setFieldValue('logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <Layout><Typography>Loading...</Typography></Layout>;

  return (
    <Layout>
      <Typography variant="h5" mb={2}>Company Profile</Typography>
      <Paper sx={{ p: 3, maxWidth: 700 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            <Grid>
              <TextField fullWidth label="Company Name" name="companyName" value={formik.values.companyName} onChange={formik.handleChange} error={formik.touched.companyName && Boolean(formik.errors.companyName)} helperText={formik.touched.companyName && formik.errors.companyName} />
            </Grid>
            <Grid>
              <TextField fullWidth label="GST Number" name="gstNumber" value={formik.values.gstNumber} onChange={formik.handleChange} error={formik.touched.gstNumber && Boolean(formik.errors.gstNumber)} helperText={formik.touched.gstNumber && formik.errors.gstNumber} />
            </Grid>
            <Grid>
              <TextField fullWidth label="Address" name="address" value={formik.values.address} onChange={formik.handleChange} error={formik.touched.address && Boolean(formik.errors.address)} helperText={formik.touched.address && formik.errors.address} />
            </Grid>
            <Grid>
              <TextField fullWidth label="Phone" name="phone" value={formik.values.phone} onChange={formik.handleChange} error={formik.touched.phone && Boolean(formik.errors.phone)} helperText={formik.touched.phone && formik.errors.phone} />
            </Grid>
            <Grid>
              <TextField fullWidth label="Proprietor Name" name="proprietorName" value={formik.values.proprietorName} onChange={formik.handleChange} error={formik.touched.proprietorName && Boolean(formik.errors.proprietorName)} helperText={formik.touched.proprietorName && formik.errors.proprietorName} />
            </Grid>
            <Grid>
              <TextField fullWidth label="Email" name="email" value={formik.values.email} onChange={formik.handleChange} error={formik.touched.email && Boolean(formik.errors.email)} helperText={formik.touched.email && formik.errors.email} />
            </Grid>
            <Grid>
              <Button variant="outlined" component="label" fullWidth sx={{ height: 56 }}>
                Upload Logo
                <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
              </Button>
              {logoPreview && <Avatar src={logoPreview} alt="Logo" sx={{ width: 56, height: 56, mt: 1 }} />}
            </Grid>
            <Grid>
              <TextField fullWidth label="Bank Name" name="bankName" value={formik.values.bankName} onChange={formik.handleChange} error={formik.touched.bankName && Boolean(formik.errors.bankName)} helperText={formik.touched.bankName && formik.errors.bankName} />
            </Grid>
            <Grid>
              <TextField fullWidth label="Account Number" name="accountNumber" value={formik.values.accountNumber} onChange={formik.handleChange} error={formik.touched.accountNumber && Boolean(formik.errors.accountNumber)} helperText={formik.touched.accountNumber && formik.errors.accountNumber} />
            </Grid>
            <Grid>
              <TextField fullWidth label="IFSC" name="ifsc" value={formik.values.ifsc} onChange={formik.handleChange} error={formik.touched.ifsc && Boolean(formik.errors.ifsc)} helperText={formik.touched.ifsc && formik.errors.ifsc} />
            </Grid>
            <Grid>
              <TextField fullWidth label="Branch" name="branch" value={formik.values.branch} onChange={formik.handleChange} error={formik.touched.branch && Boolean(formik.errors.branch)} helperText={formik.touched.branch && formik.errors.branch} />
            </Grid>
            <Grid>
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                Save
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default CompanyProfile; 