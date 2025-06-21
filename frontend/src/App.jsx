import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CompanyProfile from './pages/CompanyProfile.jsx';
import Receivers from './pages/Receivers.jsx';
import Bills from './pages/Bills.jsx';
import Analytics from './pages/Analytics.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Layout from './components/Layout.jsx';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/company" element={<PrivateRoute><CompanyProfile /></PrivateRoute>} />
          <Route path="/receivers" element={<PrivateRoute><Receivers /></PrivateRoute>} />
          <Route path="/bills" element={<PrivateRoute><Bills /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 