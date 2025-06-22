import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { setToken, setUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import lionLogo from '../assets/lion.png';

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
    <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #191970 60%, #223366 100%)' }}>
      <Box sx={{ width: 370, bgcolor: 'white', p: 4, borderRadius: 3, boxShadow: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 'auto' }}>
        <img src={lionLogo} alt="Government Logo" style={{ width: 70, marginBottom: 12 }} />
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 22, color: '#191970', letterSpacing: 1 }}>GST Bill Web App</span>
          <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Government of India</div>
        </Box>
        <Typography variant="h5" mb={2} sx={{ color: '#191970', fontWeight: 600 }}>Register</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={formik.handleSubmit} style={{ width: '100%' }}>
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
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, bgcolor: '#191970', fontWeight: 600, fontSize: 16 }}>
            Register
          </Button>
        </form>
        <Button onClick={() => navigate('/login')} sx={{ mt: 2 }} fullWidth>
          Already have an account? Login
        </Button>
      </Box>
    </Box>
  );
};

export default Register; 