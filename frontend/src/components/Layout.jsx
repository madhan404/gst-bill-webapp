import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import { removeToken, removeUser, getUser } from '../utils/auth';

const drawerWidth = 220;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Company Profile', icon: <BusinessIcon />, path: '/company' },
  { text: 'Receivers', icon: <PeopleIcon />, path: '/receivers' },
  { text: 'Bills', icon: <ReceiptIcon />, path: '/bills' },
  { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
];

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            GST Bill App
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>{user?.name}</Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.text}
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 