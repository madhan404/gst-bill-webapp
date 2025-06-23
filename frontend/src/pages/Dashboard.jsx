import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/analytics/summary');
        setSummary(res.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      }
      setLoading(false);
    };
    fetchSummary();
  }, []);

  return (
  <Layout>
    <Typography variant="h4" mb={3} sx={{ fontSize: { xs: 22, sm: 28 } }}>Welcome to GST Bill App</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh"><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 18 } }}>Total Bills</Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: 28, sm: 36 } }}>{summary?.totalBills ?? '-'}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 18 } }}>Total Amount</Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: 28, sm: 36 } }}>{summary?.totalAmount?.toFixed(2) ?? '-'}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 18 } }}>Total Tax</Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: 28, sm: 36 } }}>{summary?.totalTax?.toFixed(2) ?? '-'}</Typography>
        </Paper>
      </Grid>
    </Grid>
      )}
  </Layout>
);
};

export default Dashboard; 