import React, { useState, useEffect } from "react";
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
  TextField,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  DateRangeRounded as DateRangeRoundedIcon,
  DirectionsCarFilledRounded as DirectionsCarFilledRoundedIcon,
  AirportShuttleRounded as AirportShuttleRoundedIcon,
  LocalShippingRounded as LocalShippingRoundedIcon,
  NumbersRounded as NumbersRoundedIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import LocalParkingRoundedIcon from "@mui/icons-material/LocalParkingRounded";
import CircleIcon from "@mui/icons-material/Circle";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

import PropTypes from "prop-types";

const TITLE = "Event Demands";

const EventDemandTable = ({ eventId, setIsEditingDemands }) => {
  EventDemandTable.propTypes = {
    eventId: PropTypes.string.isRequired,
    setIsEditingDemands: PropTypes.func.isRequired,
  };

  const [demands, setDemands] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("date");
  const [notification, setNotification] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedDemands, setEditedDemands] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [datesToDelete, setDatesToDelete] = useState([]);

  useEffect(() => {
    const fetchDemands = async () => {
      try {
        const response = await axios.get(`/api/events/demands/${eventId}`);
        if (response.status === 204) {
          setNotification("No demands found for this event.");
          setDemands([]);
          setEditedDemands([]);
        } else {
          setDemands(response.data);
          setEditedDemands(response.data);
        }
      } catch (error) {
        console.error("Error fetching demands data:", error);
      }
    };

    const fetchAllocations = async () => {
      try {
        const response = await axios.get(`/api/events/allocations/${eventId}`);
        setAllocations(response.data);
      } catch (error) {
        console.error("Error fetching allocations data:", error);
      }
    };

    fetchDemands();
    fetchAllocations();
  }, [eventId]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleEditChange = (id, field, value) => {
    setEditedDemands((prevEditedDemands) =>
      prevEditedDemands.map((demand) =>
        demand.id === id ? { ...demand, [field]: Number(value) } : demand,
      ),
    );
  };

  const handleSave = async () => {
    const modifiedDates = editedDemands
      .filter((demand, index) => {
        const originalDemand = demands[index] || {};
        return (
          demand.car_demand !== originalDemand.car_demand ||
          demand.truck_demand !== originalDemand.truck_demand ||
          demand.bus_demand !== originalDemand.bus_demand
        );
      })
      .map((demand) => demand.date);

    const allocationsToDelete = Array.isArray(allocations)
      ? allocations.filter((allocation) =>
          modifiedDates.includes(allocation.date),
        )
      : [];

    if (allocationsToDelete.length > 0) {
      setDatesToDelete(modifiedDates);
      setOpenDialog(true);
    } else {
      await saveDemands();
    }
  };

  const saveDemands = async () => {
    try {
      await axios.put(`/api/events/demands/${eventId}`, editedDemands);
      setEditMode(false);
      setIsEditingDemands(false);
      setDemands(editedDemands);
      updateStatuses(); // Update statuses after saving demands
      await fetchAllocations();
      await fetchDemands();
    } catch (error) {
      console.error("Error saving demands data:", error);
    }
  };

  const handleConfirmSave = async () => {
    try {
      await axios.delete(`/api/events/allocations`, {
        data: { event_id: eventId, dates: datesToDelete },
      });
      await saveDemands();
      setOpenDialog(false);
    } catch (error) {
      console.error("Error deleting allocations:", error);
    }
  };

  const handleCancelSave = () => {
    setOpenDialog(false);
  };

  const handleCancel = () => {
    setEditedDemands(demands);
    setEditMode(false);
    setIsEditingDemands(false);
  };

  const fetchAllocations = async () => {
    try {
      const response = await axios.get(`/api/events/allocations/${eventId}`);
      setAllocations(response.data);
    } catch (error) {
      console.error("Error fetching allocations data:", error);
    }
  };

  const fetchDemands = async () => {
    try {
      const response = await axios.get(`/api/events/demands/${eventId}`);
      if (response.status === 204) {
        setNotification("No demands found for this event.");
        setDemands([]);
        setEditedDemands([]);
      } else {
        setDemands(response.data);
        setEditedDemands(response.data);
      }
    } catch (error) {
      console.error("Error fetching demands data:", error);
    }
  };

  const updateStatuses = () => {
    const updatedDemands = demands.map((demand) => {
      const totalDemand =
        demand.car_demand + 4 * demand.truck_demand + 3 * demand.bus_demand;
      const allocation = allocations.find(
        (alloc) => formatDate(alloc.date) === formatDate(demand.date),
      );
      let status;
      if (totalDemand === 0) {
        status = "no_demands";
      } else if (!allocation || allocation.allocated_capacity === 0) {
        status = "not_allocated";
      } else {
        const ratio = allocation.allocated_capacity / totalDemand;
        if (ratio === 1) {
          status = "allocated";
        } else {
          status = "partially_allocated";
        }
      }
      return { ...demand, status };
    });
    setDemands(updatedDemands);
  };

  const sortedDemands = demands.sort((a, b) => {
    const isAsc = order === "asc";
    const statusOrder = ["assembly", "runtime", "disassembly"];
    switch (orderBy) {
      case "date":
        return isAsc
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      case "car_demand":
        return isAsc
          ? a.car_demand - b.car_demand
          : b.car_demand - a.car_demand;
      case "truck_demand":
        return isAsc
          ? a.truck_demand - b.truck_demand
          : b.truck_demand - a.truck_demand;
      case "bus_demand":
        return isAsc
          ? a.bus_demand - b.bus_demand
          : b.bus_demand - a.bus_demand;
      case "demand":
        return isAsc ? a.demand - b.demand : b.demand - a.demand;
      case "status":
        return isAsc
          ? statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          : statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status);
      default:
        return 0;
    }
  });

  const groupedDemands = sortedDemands.reduce((acc, demand) => {
    if (!acc[demand.status]) {
      acc[demand.status] = [];
    }
    acc[demand.status].push(demand);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case "assembly":
        return <ArrowCircleUpRoundedIcon />;
      case "runtime":
        return <PlayCircleFilledRoundedIcon />;
      case "disassembly":
        return <ArrowCircleDownRoundedIcon />;
      default:
        return null;
    }
  };

  const getAllocatedTotal = (demandDate) => {
    const demand = editedDemands.find(
      (d) => formatDate(d.date) === formatDate(demandDate),
    );
    if (!demand) return `0/0`;

    const demandTotal =
      demand.car_demand + 4 * demand.truck_demand + 3 * demand.bus_demand;

    if (demandTotal === 0) return `0/0`;

    if (!Array.isArray(allocations)) return `0/${demandTotal}`;

    const allocationsForDate = allocations.filter(
      (alloc) => formatDate(alloc.date) === formatDate(demandDate),
    );

    const totalAllocated = allocationsForDate.reduce(
      (acc, alloc) => acc + alloc.allocated_capacity,
      0,
    );

    return `${totalAllocated}/${demandTotal}`;
  };

  const calculateStatus = (demandDate, demandTotal) => {
    if (demandTotal === 0) return "no_demands";
    if (!Array.isArray(allocations)) return "not_allocated";

    const allocationsForDate = allocations.filter(
      (alloc) => formatDate(alloc.date) === formatDate(demandDate),
    );

    const totalAllocated = allocationsForDate.reduce(
      (acc, alloc) => acc + alloc.allocated_capacity,
      0,
    );

    const ratio = totalAllocated / demandTotal;
    if (totalAllocated === 0) return "not_allocated";
    if (ratio === 1) return "allocated";
    return "partially_allocated";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "no_demands":
        return (
          <Box className="status-label">
            <Typography className="status-label" variant="body2">
              No demands
            </Typography>
          </Box>
        );
      case "allocated":
        return (
          <Box className="status-label">
            <Typography className="status-label" variant="body2">
              Fully allocated
            </Typography>
          </Box>
        );
      case "partially_allocated":
        return (
          <Box className="status-label">
            <Typography className="status-label" variant="body2">
              Partly allocated
            </Typography>
          </Box>
        );
      case "not_allocated":
        return (
          <Box className="status-label">
            <Typography className="status-label" variant="body2">
              Not allocated
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const getStatusCircle = (status) => {
    let color;
    switch (status) {
      case "allocated":
        color = "green";
        break;
      case "partially_allocated":
        color = "orange";
        break;
      case "not_allocated":
        color = "red";
        break;
      default:
        color = "grey";
    }
    return <CircleIcon style={{ color }} />;
  };

  return (
    <Box className="capacitiesTable-container">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <NumbersRoundedIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
        {editMode ? (
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ClearRoundedIcon />}
              onClick={handleCancel}
              style={{
                marginBottom: "1rem",
                marginRight: "1rem",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveRoundedIcon />}
              style={{
                marginBottom: "1rem",
              }}
              onClick={handleSave}
            >
              Save Demands
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              setEditMode(true);
              setIsEditingDemands(true);
            }}
            style={{
              marginBottom: "1rem",
              float: "right",
            }}
          >
            <EditIcon className="icon__edit-event" />
            Edit Demands
          </Button>
        )}
      </Box>

      {notification && <Alert severity="info">{notification}</Alert>}
      <TableContainer className="events-container" component={Paper}>
        <Table className="events-table">
          <TableHead className="events-table__header">
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
                  <DirectionsCarFilledRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <TableSortLabel
                    active={orderBy === "car_demand"}
                    direction={orderBy === "car_demand" ? order : "asc"}
                    onClick={() => handleRequestSort("car_demand")}
                  >
                    <Box className="header-icon-container__label">
                      <Box className="header-icon-container__label-title">
                        Car Demand
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
                    active={orderBy === "bus_demand"}
                    direction={orderBy === "bus_demand" ? order : "asc"}
                    onClick={() => handleRequestSort("bus_demand")}
                  >
                    <Box className="header-icon-container__label">
                      <Box className="header-icon-container__label-title">
                        Bus Demand
                      </Box>
                      <Box className="header-icon-container__label-unit">
                        (= 3x Car Units)
                      </Box>
                    </Box>{" "}
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
                    active={orderBy === "truck_demand"}
                    direction={orderBy === "truck_demand" ? order : "asc"}
                    onClick={() => handleRequestSort("truck_demand")}
                  >
                    <Box className="header-icon-container__label">
                      <Box className="header-icon-container__label-title">
                        Truck Demand
                      </Box>
                      <Box className="header-icon-container__label-unit">
                        (= 4x Car Units)
                      </Box>
                    </Box>
                  </TableSortLabel>
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <FunctionsRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <TableSortLabel
                    active={orderBy === "demand"}
                    direction={orderBy === "demand" ? order : "asc"}
                    onClick={() => handleRequestSort("demand")}
                  >
                    <Box className="header-icon-container__label">
                      <Box className="header-icon-container__label-title">
                        Allocated / Total
                      </Box>
                      <Box className="header-icon-container__label-unit">
                        (Total Car Units)
                      </Box>
                    </Box>{" "}
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
                    active={orderBy === "status"}
                    direction={orderBy === "status" ? order : "asc"}
                    onClick={() => handleRequestSort("status")}
                  >
                    Status
                  </TableSortLabel>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {["assembly", "runtime", "disassembly"].map((phase) => (
              <React.Fragment key={phase}>
                {groupedDemands[phase]?.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        style={{ backgroundColor: "#f0f0f0" }}
                      >
                        <Box display="flex" alignItems="center">
                          {getPhaseIcon(phase)}
                          <Typography
                            variant="h6"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            {phase.charAt(0).toUpperCase() + phase.slice(1)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                    {groupedDemands[phase].map((demand) => (
                      <TableRow key={demand.id} hover>
                        <TableCell>{formatDate(demand.date)}</TableCell>
                        <TableCell>
                          {editMode ? (
                            <TextField
                              className="input__demand"
                              value={
                                editedDemands.find((d) => d.id === demand.id)
                                  .car_demand
                              }
                              onChange={(e) =>
                                handleEditChange(
                                  demand.id,
                                  "car_demand",
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            demand.car_demand
                          )}
                        </TableCell>

                        <TableCell>
                          {editMode ? (
                            <TextField
                              className="input__demand"
                              value={
                                editedDemands.find((d) => d.id === demand.id)
                                  .bus_demand
                              }
                              onChange={(e) =>
                                handleEditChange(
                                  demand.id,
                                  "bus_demand",
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            demand.bus_demand
                          )}
                        </TableCell>
                        <TableCell>
                          {editMode ? (
                            <TextField
                              className="input__demand"
                              value={
                                editedDemands.find((d) => d.id === demand.id)
                                  .truck_demand
                              }
                              onChange={(e) =>
                                handleEditChange(
                                  demand.id,
                                  "truck_demand",
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            demand.truck_demand
                          )}
                        </TableCell>
                        <TableCell>{getAllocatedTotal(demand.date)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getStatusCircle(
                              calculateStatus(demand.date, demand.demand),
                            )}
                            {getStatusLabel(
                              calculateStatus(demand.date, demand.demand),
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    <></>
                  </>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCancelSave}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Save"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Saving the changes will delete existing allocations for the
            respective dates. Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            className="popup-btn-close"
            onClick={handleCancelSave}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            className="popup-btn"
            variant="contained"
            color="primary"
            onClick={handleConfirmSave}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDemandTable;
