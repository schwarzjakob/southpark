import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
  IconButton,
  Alert,
} from "@mui/material";
import {
  DateRangeRounded as DateRangeRoundedIcon,
  LocalParkingRounded as LocalParkingRoundedIcon,
  DirectionsCarFilledRounded as DirectionsCarFilledRoundedIcon,
  AirportShuttleRounded as AirportShuttleRoundedIcon,
  LocalShippingRounded as LocalShippingRoundedIcon,
  NumbersRounded as NumbersRoundedIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./styles/parkingSpaces.css";

const TITLE = "Parking Space Capacities";

const ParkingSpaceCapacitiesTable = ({ parkingLotId }) => {
  ParkingSpaceCapacitiesTable.propTypes = {
    parkingLotId: PropTypes.string.isRequired,
  };

  const [capacities, setCapacities] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("valid_from");
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCapacities = async () => {
      try {
        const response = await axios.get(
          `/api/parking/capacities/${parkingLotId}`
        );
        if (response.status === 204) {
          setNotification("No capacities found for this parking lot.");
        } else {
          setCapacities(response.data);
        }
      } catch (error) {
        console.error("Error fetching capacities data:", error);
      }
    };

    fetchCapacities();
  }, [parkingLotId]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedCapacities = capacities.sort((a, b) => {
    const isAsc = order === "asc";
    if (orderBy === "valid_from") {
      return isAsc
        ? new Date(a.valid_from) - new Date(b.valid_from)
        : new Date(b.valid_from) - new Date(a.valid_from);
    }
    return 0;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}.${day}.${year}`;
  };

  return (
    <Box className="capacitiesTable-container">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <NumbersRoundedIcon className="demandTable__icon" />
          <Typography variant="h4" gutterBottom className="demandTable__title">
            {TITLE}
          </Typography>
        </Box>
        <Link
          to={`/capacity/add?parkinglotId=${parkingLotId}`}
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="contained"
            color="secondary"
            style={{ marginBottom: "1rem", float: "right" }}
          >
            <AddIcon className="addIcon" />
            Add Capacity
          </Button>
        </Link>
      </Box>
      {notification && <Alert severity="info">{notification}</Alert>}
      {capacities.length > 0 && (
        <TableContainer className="parkingSpaces-container" component={Paper}>
          <Table className="parkingSpaces-table">
            <TableHead className="parkingSpaces-table__header">
              <TableRow>
                <TableCell>
                  <Box className="header-icon-container">
                    <NumbersRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "id"}
                      direction={orderBy === "id" ? order : "asc"}
                      onClick={() => handleRequestSort("id")}
                    >
                      ID
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <DateRangeRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "valid_from"}
                      direction={orderBy === "valid_from" ? order : "asc"}
                      onClick={() => handleRequestSort("valid_from")}
                    >
                      Valid from
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <DateRangeRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "valid_to"}
                      direction={orderBy === "valid_to" ? order : "asc"}
                      onClick={() => handleRequestSort("valid_to")}
                    >
                      Valid to
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <LocalParkingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "utilization_type"}
                      direction={orderBy === "utilization_type" ? order : "asc"}
                      onClick={() => handleRequestSort("utilization_type")}
                    >
                      Utilization Type
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <DirectionsCarFilledRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "capacity"}
                      direction={orderBy === "capacity" ? order : "asc"}
                      onClick={() => handleRequestSort("capacity")}
                    >
                      <Box className="header-icon-container__label">
                        <Box className="header-icon-container__label-title">
                          Total Capacity
                        </Box>
                        <Box className="header-icon-container__label-unit">
                          (Car Units)
                        </Box>
                      </Box>
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <AirportShuttleRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "bus_limit"}
                      direction={orderBy === "bus_limit" ? order : "asc"}
                      onClick={() => handleRequestSort("bus_limit")}
                    >
                      <Box className="header-icon-container__label">
                        <Box className="header-icon-container__label-title">
                          Bus limit
                        </Box>
                        <Box className="header-icon-container__label-unit">
                          (= 3x Car Units)
                        </Box>
                      </Box>
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <LocalShippingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "truck_limit"}
                      direction={orderBy === "truck_limit" ? order : "asc"}
                      onClick={() => handleRequestSort("truck_limit")}
                    >
                      <Box className="header-icon-container__label">
                        <Box className="header-icon-container__label-title">
                          Truck limit
                        </Box>
                        <Box className="header-icon-container__label-unit">
                          (= 4x Car Units)
                        </Box>
                      </Box>{" "}
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <p></p>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCapacities.map((capacity) => (
                <TableRow
                  key={capacity.id}
                  hover
                  onClick={() =>
                    navigate(
                      `/capacity/edit/?capacityId=${capacity.id}&parkinglotId=${parkingLotId}`
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{capacity.id}</TableCell>
                  <TableCell>{formatDate(capacity.valid_from)}</TableCell>
                  <TableCell>{formatDate(capacity.valid_to)}</TableCell>
                  <TableCell>
                    {capacity.utilization_type.charAt(0).toUpperCase() +
                      capacity.utilization_type.slice(1)}
                  </TableCell>
                  <TableCell>{capacity.capacity}</TableCell>
                  <TableCell>{capacity.bus_limit}</TableCell>
                  <TableCell>{capacity.truck_limit}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/capacity/edit/?capacityId=${capacity.id}&parkinglotId=${parkingLotId}`
                        );
                      }}
                      edge="start"
                      size="small"
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ParkingSpaceCapacitiesTable;
