import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const res1 = await api.get('/api/analytics/summary');
      const res2 = await api.get('/api/analytics/monthly');
      setSummary(res1.data);
      setMonthly(Object.entries(res2.data).map(([month, data]) => ({ month, ...data })));
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  return (
    <Layout>
      <Typography variant="h5" mb={2} sx={{ fontSize: { xs: 18, sm: 22 } }}>Analytics</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh"><CircularProgress /></Box>
      ) : (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 18 } }}>Total Bills</Typography>
                <Typography variant="h3" sx={{ fontSize: { xs: 28, sm: 36 } }}>{summary?.totalBills}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 18 } }}>Total Amount</Typography>
                <Typography variant="h3" sx={{ fontSize: { xs: 28, sm: 36 } }}>{summary?.totalAmount?.toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 18 } }}>Total Tax</Typography>
                <Typography variant="h3" sx={{ fontSize: { xs: 28, sm: 36 } }}>{summary?.totalTax?.toFixed(2)}</Typography>
              </Paper>
            </Grid>
          </Grid>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" mb={2} sx={{ fontSize: { xs: 16, sm: 18 } }}>Monthly Report</Typography>
            <Box sx={{ width: '100%', height: { xs: 220, sm: 300 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1976d2" name="Total Amount" />
                  <Bar dataKey="count" fill="#90caf9" name="Bill Count" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </>
      )}
    </Layout>
  );
};

export default Analytics; 