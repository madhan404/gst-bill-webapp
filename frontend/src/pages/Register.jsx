import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { setToken, setUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', phone: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Required'),
      phone: Yup.string(),
    }),
    onSubmit: async (values) => {
      setError('');
      try {
        const res = await api.post('/auth/register', values);
        setToken(res.data.token);
        setUser(res.data.user);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
      }
    },
  });

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" mb={2}>Register</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Phone"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Register
          </Button>
        </form>
        <Button onClick={() => navigate('/login')} sx={{ mt: 2 }} fullWidth>
          Already have an account? Login
        </Button>
      </Paper>
    </Box>
  );
};

export default Register; 