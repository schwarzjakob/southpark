// src/components/MobileWarning.jsx
import { Typography, Box, IconButton } from "@mui/material";
import ScreenshotMonitorIcon from "@mui/icons-material/ScreenshotMonitor";
import logo from "../assets/logo.svg";

const LOGO_WIDTH = "150px";
const ICON_FONT_SIZE = 60;
const MOBILE_WARNING_MESSAGE = "Application Not Optimized for Mobile Devices";
const USER_EXPERIENCE_MESSAGE =
  "For the best user experience, please access this application from a desktop device.";

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
        <img src={logo} alt="Messe München" style={{ width: LOGO_WIDTH }} />
      </Box>
      <Typography variant="h6" gutterBottom>
        {MOBILE_WARNING_MESSAGE}
      </Typography>
      <IconButton>
        <ScreenshotMonitorIcon
          color="black"
          style={{ fontSize: ICON_FONT_SIZE }}
        />
      </IconButton>
      <Typography variant="body1" paragraph>
        {USER_EXPERIENCE_MESSAGE}
      </Typography>
    </Box>
  );
};

export default MobileWarning;
