import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { setToken, setUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import lionLogo from '../assets/lion.png';

const Login = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      setError('');
      try {
        const res = await api.post('/api/auth/login', values);
        setToken(res.data.token);
        setUser(res.data.user);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
      }
    },
  });

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #191970 60%, #223366 100%)' }}>
      <Box sx={{ width: { xs: '95vw', sm: 370 }, maxWidth: 400, bgcolor: 'white', p: { xs: 2, sm: 4 }, borderRadius: 3, boxShadow: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 'auto' }}>
        <img src={lionLogo} alt="Government Logo" style={{ width: 60, maxWidth: '20vw', marginBottom: 12 }} />
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 20, color: '#191970', letterSpacing: 1 }}>GST Bill Web App</span>
          <div style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Government of India</div>
        </Box>
        <Typography variant="h5" mb={2} sx={{ color: '#191970', fontWeight: 600, fontSize: { xs: 20, sm: 24 } }}>Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={formik.handleSubmit} style={{ width: '100%' }}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            size="small"
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
            size="small"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, bgcolor: '#191970', fontWeight: 600, fontSize: 16 }}>
            Login
          </Button>
        </form>
        <Button onClick={() => navigate('/register')} sx={{ mt: 2, fontSize: { xs: 13, sm: 16 } }} fullWidth>
          Don't have an account? Register
        </Button>
      </Box>
    </Box>
  );
};

export default Login; 