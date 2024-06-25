import { useState, useEffect } from "react";
import { IconButton, Menu, MenuItem, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import axios from "axios";

const UserMenu = ({ onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState({ username: "", email: "" });
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const fetchUser = async () => {
        try {
          const token = sessionStorage.getItem("token");
          const response = await axios.get("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const userData = response.data;
          setUser(userData);
          sessionStorage.setItem("user", JSON.stringify(userData));
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      };
      fetchUser();
    }
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    onLogout();
    navigate("/login");
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
        PaperProps={{
          style: {
            marginTop: "0px",
          },
        }}
        open={open}
        onClose={handleClose}
      >
        <MenuItem disabled>
          <Box display="flex" alignItems="center">
            <AccountCircleRoundedIcon />
            <Typography variant="body1" ml={1}>
              {user.username}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem disabled>
          <Box display="flex" alignItems="center">
            <AlternateEmailRoundedIcon />
            <Typography variant="body1" ml={1}>
              {user.email}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => navigate("/account")}>
          <Box display="flex" alignItems="center">
            <ManageAccountsRoundedIcon />
            <Typography variant="body1" ml={1}>
              Manage Account
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
    </>
  );
};

UserMenu.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default UserMenu;
