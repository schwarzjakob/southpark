import { Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import MapIcon from "@mui/icons-material/MapRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import EventIcon from "@mui/icons-material/Event";
import GarageIcon from "@mui/icons-material/GarageRounded";
import GroupsIcon from "@mui/icons-material/Groups";
import { styled } from "@mui/system";
import logo from "../../assets/logo_white.svg";

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
  return (
    <AppBar position="sticky" className="header-container">
      <Toolbar>
        <LogoContainer to="/">
          <Logo src={logo} alt="Messe München" className="logo" />
          <Typography variant="h6" className="page-title">
            Parking Space
            <br />
            Management System
          </Typography>
        </LogoContainer>
        <Grow />
        <Box className="nav-buttons">
          <Button
            component={Link}
            to="/"
            color="inherit"
            startIcon={<MapIcon />}
            className="nav-button"
          >
            Map
          </Button>
          <Button
            component={Link}
            to="/dashboard"
            color="inherit"
            startIcon={<BarChartRoundedIcon />}
            className="nav-button"
          >
            Dashboard
          </Button>
          <Button
            component={Link}
            to="/events"
            color="inherit"
            startIcon={<EventIcon />}
            className="nav-button"
          >
            Events
          </Button>
          <Button
            component={Link}
            to="/parking_spaces"
            color="inherit"
            startIcon={<GarageIcon />}
            className="nav-button"
          >
            Parking Spaces
          </Button>
          <Button
            component={Link}
            to="/team"
            color="inherit"
            startIcon={<GroupsIcon />}
            className="nav-button"
          >
            Team
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
