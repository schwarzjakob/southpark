import { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Typography,
  Box,
} from "@mui/material";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useNavigate } from "react-router-dom";

const EventDemandTable = ({ eventId }) => {
  const [demands, setDemands] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDemands = async () => {
      try {
        const response = await axios.get(`/api/events/demands/${eventId}`);
        setDemands(response.data);
      } catch (error) {
        console.error("Error fetching event demands:", error);
      }
    };

    fetchDemands();
  }, [eventId]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/events/demands/${id}`);
      setDemands((prevDemands) =>
        prevDemands.filter((demand) => demand.id !== id),
      );
    } catch (error) {
      console.error("Error deleting demand:", error);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom={2}
      >
        <Typography variant="h6">Demands</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineRoundedIcon />}
          onClick={() => navigate(`/events/event/${eventId}/add-demand`)}
        >
          Add Demand
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Car Demand</TableCell>
              <TableCell>Truck Demand</TableCell>
              <TableCell>Bus Demand</TableCell>
              <TableCell>Total Demand</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {demands.map((demand) => (
              <TableRow key={demand.id}>
                <TableCell>
                  {new Date(demand.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{demand.car_demand}</TableCell>
                <TableCell>{demand.truck_demand}</TableCell>
                <TableCell>{demand.bus_demand}</TableCell>
                <TableCell>{demand.demand}</TableCell>
                <TableCell>{demand.status}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() =>
                      navigate(
                        `/events/event/${eventId}/edit-demand/${demand.id}`,
                      )
                    }
                  >
                    <EditRoundedIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(demand.id)}>
                    <DeleteRoundedIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EventDemandTable;
