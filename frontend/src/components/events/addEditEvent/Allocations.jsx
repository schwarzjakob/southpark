import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableSortLabel,
  TableRow,
  CircularProgress,
} from "@mui/material";
import {
  DateRangeRounded as DateRangeRoundedIcon,
  DirectionsCarFilledRounded as DirectionsCarFilledRoundedIcon,
  AirportShuttleRounded as AirportShuttleRoundedIcon,
  LocalShippingRounded as LocalShippingRoundedIcon,
  FunctionsRounded as FunctionsRoundedIcon,
  Garage as GarageIcon,
  AccountTreeRounded as AccountTreeRoundedIcon,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const TITLE = "Event Allocations";

const Allocations = ({ eventId, isEditingDemands }) => {
  Allocations.propTypes = {
    eventId: PropTypes.string.isRequired,
    isEditingDemands: PropTypes.func.isRequired,
  };

  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("date");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await axios.get(`/api/events/allocations/${eventId}`);
        if (response.status === 204) {
          setAllocations([]);
        } else {
          setAllocations(response.data);
        }
      } catch (error) {
        console.error("Error fetching allocations data:", error);
        setError("Error fetching allocations data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, [eventId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedAllocations = [...allocations].sort((a, b) => {
    if (orderBy === "date") {
      return order === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else {
      return order === "asc"
        ? a[orderBy] - b[orderBy]
        : b[orderBy] - a[orderBy];
    }
  });

  const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="allocations-container">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <GarageIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mt={2}>
          {!isEditingDemands && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AccountTreeRoundedIcon />}
              onClick={() =>
                navigate(`/events/event/${eventId}/allocate-parking-spaces`)
              }
              style={{
                marginBottom: "1rem",
                float: "right",
              }}
            >
              Allocate Parking Spaces
            </Button>
          )}
        </Box>
      </Box>
      {error && (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      )}
      <TableContainer
        className="allocations-table__container"
        component={Paper}
      >
        <Table className="allocations-table">
          <TableHead className="allocations-table__header">
            <TableRow>
              <TableCell>
                <Box className="header-icon-container">
                  <DateRangeRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <TableSortLabel
                    active={orderBy === "date"}
                    direction={orderBy === "date" ? order : "asc"}
                    onClick={() => handleRequestSort("date")}
                  >
                    Date
                  </TableSortLabel>
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <GarageIcon fontSize="small" className="header-icon" />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Parking Lot
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <DirectionsCarFilledRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Allocated Cars
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (Car Units)
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <AirportShuttleRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Allocated Buses
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (= 3x Car Units)
                    </Box>
                  </Box>{" "}
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <LocalShippingRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Allocated Trucks
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (= 4x Car Units)
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <FunctionsRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Total Allocated
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (Total Car Units)
                    </Box>
                  </Box>{" "}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAllocations.map((allocation) => (
              <TableRow
                key={allocation.allocation_id}
                hover
                onClick={() =>
                  navigate(`/parking_space/${allocation.parking_lot_id}`, {
                    state: { selectedDate: allocation.date },
                  })
                }
                style={{ cursor: "pointer" }}
                className="allocation-table-row"
                data-date={formatDate(allocation.date)}
              >
                <TableCell>{formatDate(allocation.date)}</TableCell>
                <TableCell>
                  <Box className="parking-lot-box">
                    {capitalize(allocation.parking_lot_name)}
                  </Box>
                </TableCell>
                <TableCell>{allocation.allocated_cars}</TableCell>
                <TableCell>{allocation.allocated_buses}</TableCell>
                <TableCell>{allocation.allocated_trucks}</TableCell>
                <TableCell>
                  {allocation.allocated_cars +
                    allocation.allocated_buses * 3 +
                    allocation.allocated_trucks * 4}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Allocations;
