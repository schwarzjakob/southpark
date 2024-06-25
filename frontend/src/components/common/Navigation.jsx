import PropTypes from "prop-types";
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
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import MapIcon from "@mui/icons-material/MapRounded";
import EventIcon from "@mui/icons-material/Event";
import GarageIcon from "@mui/icons-material/GarageRounded";
import logo from "../../assets/logo.svg";

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
            <img src={logo} alt="Messe München" style={{ marginRight: 16 }} />
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
                <DashboardRoundedIcon />
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
            to="/events"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <EventIcon />
              </ListItemIcon>
              <ListItemText primary="Events" />
            </ListItemButton>
          </Link>
          <Link
            to="/parking_spaces"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemButton onClick={toggleNav}>
              <ListItemIcon>
                <GarageIcon />
              </ListItemIcon>
              <ListItemText primary="Parking Spaces" />
            </ListItemButton>
          </Link>
        </List>
      </Box>
    </Drawer>
  );
};

Navigation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleNav: PropTypes.func.isRequired,
};

export default Navigation;
