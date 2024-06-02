import React from "react";
import { Typography, Box, IconButton } from "@mui/material";
import ScreenshotMonitorIcon from "@mui/icons-material/ScreenshotMonitor";
import logo from "../assets/logo.svg";

const MobileWarning = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      padding={4}
      textAlign="center"
    >
      <Box
        position="absolute"
        top={20}
        display="flex"
        justifyContent="center"
        width="100%"
      >
        <img src={logo} alt="Messe München" style={{ width: "150px" }} />
      </Box>
      <Typography variant="h6" gutterBottom>
        Application Not Optimized for Mobile Devices
      </Typography>
      <IconButton>
        <ScreenshotMonitorIcon color="black" style={{ fontSize: 60 }} />
      </IconButton>
      <Typography variant="body1" paragraph>
        For the best user experience, please access this application from a
        desktop device.
      </Typography>
    </Box>
  );
};

export default MobileWarning;
