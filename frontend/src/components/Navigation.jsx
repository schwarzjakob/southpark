import { Link } from "react-router-dom";
import {
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MapIcon from "@mui/icons-material/Map";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit"; // Import the Edit icon
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FileUploadIcon from "@mui/icons-material/FileUpload";

const Navigation = ({ isOpen, toggleNav }) => {
  return (
    <Drawer anchor="left" open={isOpen} onClose={toggleNav}>
      <Box className="nav-bar">
        <Box
          className="nav-bar__header"
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid #ddd",
          }}
        >
          <IconButton onClick={toggleNav} edge="start" sx={{ marginRight: 2 }}>
            <CloseIcon />
          </IconButton>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src="src/assets/logo.svg"
              alt="Messe München"
              style={{ marginRight: 16 }}
            />
            <Typography variant="h6" className="nav__page-title">
              Parking Space
              <br />
              Management System
            </Typography>
          </Link>
        </Box>
        <List>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </Link>
          <Link
            to="/mapview"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <MapIcon />
              </ListItemIcon>
              <ListItemText primary="Map View" />
            </ListItemButton>
          </Link>
          <Link
            to="/tableview"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText primary="Table View" />
            </ListItemButton>
          </Link>
          <Link
            to="/addEvent"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="Add Event" />
            </ListItemButton>
          </Link>
          <Link
            to="/editEvent"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText primary="Edit Event" />
            </ListItemButton>
          </Link>
          <Link
            to="/import"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <FileUploadIcon />
              </ListItemIcon>
              <ListItemText primary="Upload Events" />
            </ListItemButton>
          </Link>
          <Link
            to="/input_demands"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <DirectionsCarIcon />
              </ListItemIcon>
              <ListItemText primary="Add Missing Demands" />
            </ListItemButton>
          </Link>
        </List>
      </Box>
    </Drawer>
  );
};

export default Navigation;
