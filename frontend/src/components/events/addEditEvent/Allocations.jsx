import React, { useState, useEffect } from "react";
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
  ArrowCircleUpRounded as ArrowCircleUpRoundedIcon,
  PlayCircleFilledRounded as PlayCircleFilledRoundedIcon,
  ArrowCircleDownRounded as ArrowCircleDownRoundedIcon,
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
  const [demands, setDemands] = useState([]);
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
          setAllocations([{}]);
        } else {
          setAllocations(response.data.length ? response.data : [{}]);
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

  useEffect(() => {
    const fetchDemands = async () => {
      try {
        const response = await axios.get(`/api/events/demands/${eventId}`);
        if (response.status === 204) {
          setDemands([]);
        } else {
          setDemands(response.data);
        }
      } catch (error) {
        console.error("Error fetching demands data:", error);
      }
    };

    fetchDemands();
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

  const groupedAllocations = sortedAllocations.reduce((acc, allocation) => {
    const demand = demands.find(
      (d) => formatDate(d.date) === formatDate(allocation.date),
    );
    const phase = demand ? demand.status : "other";
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(allocation);
    return acc;
  }, {});

  const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

  const totalRowStyle = {
    position: "relative",
    borderBottom: "2px solid #6a91ce",
    paddingTop: "6px",
  };

  const doubleStrokeStyle = {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    borderTop: "1px solid rgba(128, 128, 128, 0.5)",
    borderBottom: "1px solid rgba(128, 128, 128, 0.5)",
  };

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
                  </Box>
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
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.length === 1 && !allocations[0].allocation_id ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No allocations available.
                </TableCell>
              </TableRow>
            ) : (
              ["assembly", "runtime", "disassembly"].map(
                (phase, phaseIndex) => (
                  <React.Fragment key={phase}>
                    {groupedAllocations[phase]?.length > 0 && (
                      <>
                        <TableRow
                          style={{
                            backgroundColor: "#f0f0f0",
                            borderTop:
                              phaseIndex > 0 ? "2px solid #6a91ce" : "none",
                          }}
                        >
                          <TableCell colSpan={7}>
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
                        {groupedAllocations[phase].reduce(
                          (acc, allocation, index, array) => {
                            const isLastRow = index === array.length - 1;
                            const nextDate = array[index + 1]?.date;
                            const shouldSumRow =
                              isLastRow || allocation.date !== nextDate;

                            acc.push(
                              <TableRow
                                key={allocation.allocation_id}
                                hover
                                onClick={() =>
                                  navigate(
                                    `/parking_space/${allocation.parking_lot_id}`,
                                    {
                                      state: { selectedDate: allocation.date },
                                    },
                                  )
                                }
                                style={{ cursor: "pointer" }}
                                className="allocation-table-row"
                                data-date={formatDate(allocation.date)}
                              >
                                <TableCell>
                                  {formatDate(allocation.date)}
                                </TableCell>
                                <TableCell>
                                  <Box className="parking-lot-box">
                                    {capitalize(allocation.parking_lot_name)}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  {allocation.allocated_cars}
                                </TableCell>
                                <TableCell>
                                  {allocation.allocated_buses}
                                </TableCell>
                                <TableCell>
                                  {allocation.allocated_trucks}
                                </TableCell>
                                <TableCell>
                                  {allocation.allocated_cars +
                                    allocation.allocated_buses * 3 +
                                    allocation.allocated_trucks * 4}
                                </TableCell>
                              </TableRow>,
                            );

                            if (shouldSumRow) {
                              acc.push(
                                <TableRow
                                  key={`${allocation.date}-total`}
                                  style={{
                                    ...totalRowStyle,
                                    borderBottom: isLastRow
                                      ? "none"
                                      : "2px solid #6a91ce",
                                  }}
                                >
                                  <TableCell>
                                    <Box style={doubleStrokeStyle}></Box>
                                    <Box
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <FunctionsRoundedIcon></FunctionsRoundedIcon>
                                    </Box>
                                  </TableCell>
                                  <TableCell></TableCell>
                                  <TableCell>
                                    {groupedAllocations[phase]
                                      .filter(
                                        (alloc) =>
                                          alloc.date === allocation.date,
                                      )
                                      .reduce(
                                        (sum, alloc) =>
                                          sum + alloc.allocated_cars,
                                        0,
                                      )}
                                  </TableCell>
                                  <TableCell>
                                    {groupedAllocations[phase]
                                      .filter(
                                        (alloc) =>
                                          alloc.date === allocation.date,
                                      )
                                      .reduce(
                                        (sum, alloc) =>
                                          sum + alloc.allocated_buses,
                                        0,
                                      )}
                                  </TableCell>
                                  <TableCell>
                                    {groupedAllocations[phase]
                                      .filter(
                                        (alloc) =>
                                          alloc.date === allocation.date,
                                      )
                                      .reduce(
                                        (sum, alloc) =>
                                          sum + alloc.allocated_trucks,
                                        0,
                                      )}
                                  </TableCell>
                                  <TableCell>
                                    {groupedAllocations[phase]
                                      .filter(
                                        (alloc) =>
                                          alloc.date === allocation.date,
                                      )
                                      .reduce(
                                        (sum, alloc) =>
                                          sum +
                                          alloc.allocated_cars +
                                          alloc.allocated_buses * 3 +
                                          alloc.allocated_trucks * 4,
                                        0,
                                      )}
                                  </TableCell>
                                </TableRow>,
                              );
                            }
                            return acc;
                          },
                          [],
                        )}
                      </>
                    )}
                  </React.Fragment>
                ),
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Allocations;
