import { useState, useEffect } from "react";
import { IconButton, Menu, MenuItem, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PermissionPopup from "./PermissionPopup"; // Import the new component

const UserMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState({ username: "", email: "" });
  const [popupOpen, setPopupOpen] = useState(false); // State for controlling the popup
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("user");
    const storedEmail = localStorage.getItem("email");

    if (storedUsername && storedEmail) {
      setUser({ username: storedUsername, email: storedEmail });
    }
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose(); // Close the menu
    setPopupOpen(true); // Open the popup
    setTimeout(() => setPopupOpen(false), 5000); // Close the popup after 5 seconds
  };

  return (
    <>
      <IconButton
        edge="end"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
      >
        <AccountCircleRoundedIcon />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => navigate("/account")}>
          <Box display="flex" alignItems="center">
            <ManageAccountsRoundedIcon />
            <Typography variant="body1" ml={1}>
              {user.username}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Box display="flex" alignItems="center">
            <LogoutRoundedIcon />
            <Typography variant="body1" ml={1}>
              Logout
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
      <PermissionPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        message="Logout is disabled for demo purposes"
      />
    </>
  );
};

UserMenu.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default UserMenu;
