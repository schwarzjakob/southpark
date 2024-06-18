// src/components/Header.jsx
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { styled } from "@mui/system";

const LogoContainer = styled(Link)({
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
  color: "inherit",
});

const Logo = styled("img")({
  marginRight: 2,
});

const Grow = styled("div")({
  flexGrow: 1,
});

function Header({ toggleNav }) {
  return (
    <AppBar position="static" className="header-container">
      <Toolbar>
        <IconButton
          className="menu-button"
          edge="start"
          color="inherit"
          onClick={toggleNav}
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
        <LogoContainer to="/">
          <Logo
            src="src/assets/logo_white.svg"
            alt="Messe München"
            className="logo"
          />
          <Typography variant="h6" className="page-title">
            Parking Space
            <br />
            Management System
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

Header.propTypes = {
  toggleNav: PropTypes.func.isRequired,
};

export default Header;
