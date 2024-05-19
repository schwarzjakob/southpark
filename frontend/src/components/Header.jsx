import React from "react";
import { Link } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { styled } from "@mui/system";

const LogoContainer = styled(Link)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
  color: "inherit",
}));

const Logo = styled("img")(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

const Grow = styled("div")({
  flexGrow: 1,
});

function Header({ toggleNav }) {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={toggleNav}
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
        <LogoContainer to="/">
          <Logo src="src/assets/logo_white.svg" alt="Messe München" />
          <Typography variant="h6">
            Parking Area
            <br />
            Management
          </Typography>
        </LogoContainer>
        <Grow />
        <IconButton color="inherit" component={Link} to="/user">
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
