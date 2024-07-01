import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { Switch } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./styles/mapView.css";
import TimelineSlider from "./TimelineSlider.jsx";
import EventsMap from "./EventsMap.jsx";
import Heatmap from "./HeatMap.jsx";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import HorizontalSplitRoundedIcon from "@mui/icons-material/HorizontalSplitRounded";
import OccupanciesBarChart from "./OccupanciesBarChart.jsx";
import MapIcon from "@mui/icons-material/MapRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

const TITLE = "Map";

const MapView = () => {
  const location = useLocation();
  const initialDate =
    location.state?.selectedDate || dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events] = useState([]);
  const [isPercentage, setIsPercentage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEventId] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 10));
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleToggle = () => {
    setIsPercentage(!isPercentage);
  };

  const toggleMap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box className="form-headline-button__container">
          <Box className="iconHeadline__container">
            <MapIcon />
            <Typography variant="h4" gutterBottom>
              {TITLE}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              onClick={toggleMap}
              startIcon={
                showHeatmap ? (
                  <HorizontalSplitRoundedIcon />
                ) : (
                  <LocalFireDepartmentRoundedIcon />
                )
              }
            >
              {showHeatmap ? "Switch to Events Map" : "Switch to Heatmap"}
            </Button>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate(`/event/add`)}
            >
              <Box display="flex" alignItems="center">
                <AddRoundedIcon className="icon__edit-parking-space" />
              </Box>
              Add Event
            </Button>
          </Box>
        </Box>


        <Box
          className="map__timeline-slider"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <TimelineSlider
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            events={events}
          />
        </Box>
        <Box
          className="map__main-content"
          display="flex"
          alignItems="stretch"
          justifyContent="center"
          width="100%"
          height="70vh"
          gap={2}
        >
          <Box
            className="map__map-component"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor="grey.300"
            p={2}
            width="70vw"
            height="100%"
          >
            {showHeatmap ? (
              <Heatmap selectedDate={selectedDate} zoom={15.5} />
            ) : (
              <EventsMap
                selectedDate={selectedDate}
                zoom={15.5}
                selectedEventId={selectedEventId} 
              />
            )}
          </Box>
          <Box
            className="map__bar-chart-component"
            display="flex"
            flexDirection={"column"}
            alignItems="center"
            justifyContent="flex-start"
            border="1px solid"
            borderColor="grey.300"
            width="30vw"
            height={"100%"}
            overflow={"auto"}
          >
            <Box className="chart-header">
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "var(--textColor)",
                    padding: "0.3rem",
                  }}
                >
                  {"Parking Lot Utilization"} | {formattedDate}
                </Typography>
              </Box>
              <Box
                className="switch-container switch-container-bar-chart"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  alignContent: "center",
                  gap: "0.8rem",
                  fontSize: "0.5center",
                  padding: "0.3rem",
                  width: "100%",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                  }}
                >
                  # Absolute
                </Typography>
                <Switch
                  checked={isPercentage}
                  onChange={handleToggle}
                  className="switch"
                  size="small"
                />
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                  }}
                >
                  % Percentage
                </Typography>
              </Box>
            </Box>
            <OccupanciesBarChart
              className="bar-chart"
              selectedDate={selectedDate}
              isPercentage={isPercentage}
              handleToggle={handleToggle}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MapView;
