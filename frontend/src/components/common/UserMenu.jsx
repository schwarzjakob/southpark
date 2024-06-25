import { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import PropTypes from "prop-types";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";

const UserMenu = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
          vertical: "top",
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
        <MenuItem disabled>{user.name}</MenuItem>
        <MenuItem disabled>Login since: {user.loginSince}</MenuItem>
        <MenuItem onClick={onLogout} color="secondary">
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

UserMenu.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    loginSince: PropTypes.string.isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default UserMenu;
