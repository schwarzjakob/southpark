import React from "react";
import { Box, Typography } from "@mui/material";
import CalendarSlider from "./CalendarSlider.jsx";
import MapComponent from "./MapComponent.jsx";

const MapView = () => {
  return (
    <Box>
      <Typography variant="h3" component="h2" gutterBottom>
        Add Event
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <CalendarSlider />
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <CalendarSlider />
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <MapComponent />
        </Box>
      </Box>
    </Box>
  );
};

export default MapView;
