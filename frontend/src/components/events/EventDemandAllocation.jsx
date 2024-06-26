import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Paper } from "@mui/material";
import AddLinkIcon from "@mui/icons-material/AddLink";
import CustomBreadcrumbs from "../common/BreadCrumbs.jsx";
import axios from "axios";

const EventDemandAllocation = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events/event/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };
    fetchEvent();
  }, [id]);

  const breadcrumbLinks = [
    { label: "Events", path: "/events" },
    { label: event ? event.name : "Event", path: `/events/event/${id}` },
    {
      label: "Allocate Parking Spaces",
      path: `/events/event/${id}/allocate-parking-spaces`,
    },
  ];

  return (
    <Box className="form-width">
      <CustomBreadcrumbs
        links={breadcrumbLinks}
        onClick={(link) => navigate(link.path)}
      />
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <AddLinkIcon />

          <Typography variant="h4" gutterBottom style={{ marginLeft: "1rem" }}>
            Allocate Parking Spaces
          </Typography>
        </Box>
      </Box>
      <Box display="flex" flexDirection="row" gap="1rem">
        <Paper style={{ width: "33.3%", padding: "1rem" }}>
          <Typography variant="h6">Demands</Typography>
          {/* Add content for Edit Section here */}
        </Paper>
        <Paper style={{ width: "33.3", padding: "1rem" }}>
          <Typography variant="h6">Recommendations</Typography>
          {/* Add content for Recommendations Section here */}
        </Paper>
        <Paper style={{ width: "33.3%", padding: "1rem" }}>
          <Typography variant="h6">Allocate </Typography>
          {/* Add content for Recommendations Section here */}
        </Paper>
      </Box>
    </Box>
  );
};

export default EventDemandAllocation;
