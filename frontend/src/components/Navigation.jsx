import React from 'react';
import { Link } from 'react-router-dom';
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';

const Navigation = ({ isOpen, toggleNav }) => {
  return (
    <Drawer anchor="left" open={isOpen} onClose={toggleNav}>
      <Box
        sx={{
          width: 340,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            
            p: 2,
            borderBottom: '1px solid #ddd',
          }}
        >
          <IconButton onClick={toggleNav} edge="start" sx={{ marginRight: 2 }}>
            <CloseIcon />
          </IconButton>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <img
              src="src/assets/logo.svg"
              alt="Messe München"
              style={{ marginRight: 16 }}
            />
            <Typography variant="h6">
              Parking Area<br />Management
            </Typography>
          </Link>
        </Box>
        <List>
          <ListItem button component={Link} to="/">
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button component={Link} to="/mapview">
            <ListItemIcon>
              <MapIcon />
            </ListItemIcon>
            <ListItemText primary="Kartenansicht" />
          </ListItem>
          <ListItem button component={Link} to="/tableview">
            <ListItemIcon>
              <CalendarTodayIcon />
            </ListItemIcon>
            <ListItemText primary="Tabellenansicht" />
          </ListItem>
          <ListItem button component={Link} to="/addEvent">
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Neues Event" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Navigation;
