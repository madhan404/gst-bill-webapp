import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, Box, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 2, background: '#1976d2' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
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
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'block' },
          width: isMobile ? undefined : drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            pt: isMobile ? 0 : 1,
          },
        }}
        PaperProps={{
          sx: {
            mt: isMobile ? '56px' : 0, // push drawer below AppBar on mobile
            background: '#fff',
          },
        }}
      >
        {!isMobile && <Toolbar />}
        {drawerContent}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          width: '100%',
          ml: { sm: `${drawerWidth}px`, xs: 0 },
          background: '#f9f9f9',
          minHeight: '100vh',
          transition: 'margin 0.3s',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 