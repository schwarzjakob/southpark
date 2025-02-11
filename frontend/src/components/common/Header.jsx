import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import SearchAppBar from "./SearchAppBar";
import MapIcon from "@mui/icons-material/MapRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import EventIcon from "@mui/icons-material/Event";
import GarageIcon from "@mui/icons-material/GarageRounded";
import GroupsIcon from "@mui/icons-material/Groups";
import { styled } from "@mui/material/styles";
import logo from "../../assets/logo_white.svg";
import useAuth from "../hooks/useAuth";
import UserMenu from "./UserMenu";
const LogoContainer = styled(Link)({
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
  color: "inherit",
});

const Logo = styled("img")({
  marginRight: 8,
});

const Grow = styled("div")({
  flexGrow: 1,
});

function Header() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isAuthenticated = useAuth();
  const [user] = useState({
    name: "User Name",
  });

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.clear();
    window.location.reload();
  };

  const isPathSelected = (path) => {
    return (
      currentPath === path || (path !== "/" && currentPath.startsWith(path))
    );
  };

  useEffect(() => {
    const handleAuthChange = () => {
      window.location.reload();
    };

    window.addEventListener("authChange", handleAuthChange);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  return (
    <AppBar position="sticky" className="header-container">
      <Toolbar className="header-toolbar">
        <LogoContainer to="/">
          <Logo src={logo} alt="Messe München" className="logo" />
          <Typography variant="h6" className="page-title">
            Parking Space
            <br />
            Management System
          </Typography>
          <Typography variant="h6" className="page-title-short">
            PSMS
          </Typography>
        </LogoContainer>
        <Grow />
        {isAuthenticated && user && (
          <Box className="nav-buttons" display="flex" alignItems="center">
            <Button
              component={Link}
              to="/"
              color="inherit"
              startIcon={<MapIcon />}
              className={`nav-button ${currentPath === "/" ? "selected" : ""}`}
            >
              <Typography variant="body1" className="nav-button-text">
                Map
              </Typography>
            </Button>
            <Button
              component={Link}
              to="/dashboard"
              color="inherit"
              startIcon={<BarChartRoundedIcon />}
              className={`nav-button ${
                isPathSelected("/dashboard") ? "selected" : ""
              }`}
            >
              <Typography variant="body1" className="nav-button-text">
                Dashboard
              </Typography>
            </Button>
            <Button
              component={Link}
              to="/events"
              color="inherit"
              startIcon={<EventIcon />}
              className={`nav-button ${
                isPathSelected("/events") || isPathSelected("/event")
                  ? "selected"
                  : ""
              }`}
            >
              <Typography variant="body1" className="nav-button-text">
                Events
              </Typography>
            </Button>
            <Button
              component={Link}
              to="/parking_spaces"
              color="inherit"
              startIcon={<GarageIcon />}
              className={`nav-button ${
                isPathSelected("/parking_spaces") ||
                isPathSelected("/parking_space")
                  ? "selected"
                  : ""
              }`}
            >
              <Typography variant="body1" className="nav-button-text">
                Parking spaces
              </Typography>
            </Button>
            <Button
              component={Link}
              to="/team"
              color="inherit"
              startIcon={<GroupsIcon />}
              className={`nav-button ${
                isPathSelected("/team") ? "selected" : ""
              }`}
            >
              <Typography variant="body1" className="nav-button-text">
                About us
              </Typography>
            </Button>
            <SearchAppBar />
            <UserMenu user={user} onLogout={handleLogout} />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
