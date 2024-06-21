import { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import InsertInvitationRoundedIcon from "@mui/icons-material/InsertInvitationRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventDemandTable from "./EventDemandTable";

import "./styles/events.css";

const TITLE = "Event Details";

const Event = () => {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events/event/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Error fetching event data.");
      }
    };

    fetchEvent();
  }, [id]);

  if (!event) {
    return (
      <Box className="form-width">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const getContrastingTextColor = (backgroundColor) => {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "black" : "white";
  };

  return (
    <Box className="form-width">
      <Box className="iconHeadline__container">
        <InsertInvitationRoundedIcon />
        <Typography variant="h4" gutterBottom className="demandTable__title">
          {TITLE}
        </Typography>
      </Box>
      <Paper className="form-container">
        {error && (
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        )}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding="16px"
        >
          <Box display="flex" alignItems="end" gap="10px">
            <Box display="flex" alignItems="center">
              <Box
                className="event-box"
                style={{
                  backgroundColor: event.color,
                  color: getContrastingTextColor(event.color),
                }}
              >
                {event.name}
              </Box>
            </Box>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate(`/events/event/edit/${id}`)}
            >
              <Box display="flex" alignItems="center">
                <EditRoundedIcon className="icon__edit-event" />
              </Box>
              Edit Event
            </Button>
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" padding="16px">
          <Typography variant="body1">
            Assembly Period:{" "}
            {`${new Date(
              event.assembly_start_date,
            ).toLocaleDateString()} - ${new Date(
              event.assembly_end_date,
            ).toLocaleDateString()}`}
          </Typography>
          <Typography variant="body1">
            Runtime Period:{" "}
            {`${new Date(
              event.runtime_start_date,
            ).toLocaleDateString()} - ${new Date(
              event.runtime_end_date,
            ).toLocaleDateString()}`}
          </Typography>
          <Typography variant="body1">
            Disassembly Period:{" "}
            {`${new Date(
              event.disassembly_start_date,
            ).toLocaleDateString()} - ${new Date(
              event.disassembly_end_date,
            ).toLocaleDateString()}`}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" padding="16px">
          <Typography variant="body1">
            Halls: {event.halls.join(", ")}
          </Typography>
          <Typography variant="body1">
            Entrances: {event.entrances.join(", ")}
          </Typography>
        </Box>
      </Paper>
      <EventDemandTable eventId={id} />
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          className="back-button"
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/events/`)}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default Event;
