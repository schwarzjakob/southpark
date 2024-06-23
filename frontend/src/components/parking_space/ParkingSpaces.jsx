import { useEffect, useState } from "react";
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
  TableSortLabel,
  Typography,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useNavigate } from "react-router-dom";
import GarageIcon from "@mui/icons-material/GarageRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoadRoundedIcon from "@mui/icons-material/AddRoadRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import AddIcon from "@mui/icons-material/Add";

import "./styles/parkingSpaces.css";

const TITLE = "Parking Spaces";

const ParkingSpaces = () => {
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/parking/spaces");
        setParkingSpaces(response.data);
      } catch (error) {
        console.error("Error fetching parking spaces data", error);
      }
    };

    fetchData();
  }, []);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

  const sortedParkingSpaces = parkingSpaces.sort((a, b) => {
    if (orderBy === "name") {
      return order === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (orderBy === "surface_material") {
      return order === "asc"
        ? a.surface_material.localeCompare(b.surface_material)
        : b.surface_material.localeCompare(a.surface_material);
    } else if (orderBy === "service_shelter") {
      return order === "asc"
        ? a.service_shelter - b.service_shelter
        : b.service_shelter - a.service_shelter;
    } else if (orderBy === "service_toilets") {
      return order === "asc"
        ? a.service_toilets - b.service_toilets
        : b.service_toilets - a.service_toilets;
    } else if (orderBy === "pricing") {
      return order === "asc"
        ? a.pricing.localeCompare(b.pricing)
        : b.pricing.localeCompare(a.pricing);
    } else if (orderBy === "type") {
      return order === "asc"
        ? (a.external ? "External" : "Internal").localeCompare(
            b.external ? "External" : "Internal"
          )
        : (b.external ? "External" : "Internal").localeCompare(
            a.external ? "External" : "Internal"
          );
    }
    return 0;
  });

  return (
    <Box className="form-width">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <GarageIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
        <Link to="/parking_space/add" style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            color="secondary"
            style={{ marginBottom: "1rem", float: "right" }}
          >
            <AddIcon className="addIcon" />
            Add Parking Space
          </Button>
        </Link>
      </Box>
      <Box>
        <TableContainer className="parkingSpaces-container" component={Paper}>
          <Table className="parkingSpaces-table">
            <TableHead className="parkingSpaces-table__header">
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "name"}
                    direction={orderBy === "name" ? order : "asc"}
                    onClick={() => handleRequestSort("name")}
                  >
                    Parking Lot
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <PlaceRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "type"}
                      direction={orderBy === "type" ? order : "asc"}
                      onClick={() => handleRequestSort("type")}
                    >
                      Type
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <AddRoadRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "surface_material"}
                      direction={orderBy === "surface_material" ? order : "asc"}
                      onClick={() => handleRequestSort("surface_material")}
                    >
                      Surface
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <RoofingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "service_shelter"}
                      direction={orderBy === "service_shelter" ? order : "asc"}
                      onClick={() => handleRequestSort("service_shelter")}
                    >
                      Shelter
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <WcRoundedIcon fontSize="small" className="header-icon" />
                    <TableSortLabel
                      active={orderBy === "service_toilets"}
                      direction={orderBy === "service_toilets" ? order : "asc"}
                      onClick={() => handleRequestSort("service_toilets")}
                    >
                      Toilets
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <AttachMoneyRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "pricing"}
                      direction={orderBy === "pricing" ? order : "asc"}
                      onClick={() => handleRequestSort("pricing")}
                    >
                      Pricing
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <p></p>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedParkingSpaces.map((space) => (
                <TableRow
                  key={space.id}
                  onClick={() => navigate(`/parking_space/${space.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell className="parking-lot">
                    <Box className="parking-lot-box">
                      {capitalize(space.name)}
                    </Box>
                  </TableCell>
                  <TableCell className="type">
                    {space.external ? "External" : "Internal"}
                  </TableCell>
                  <TableCell className="surface">
                    {capitalize(space.surface_material)}
                  </TableCell>
                  <TableCell className="shelter">
                    {space.service_shelter ? "✓" : "✗"}
                  </TableCell>
                  <TableCell className="toilets">
                    {space.service_toilets ? "✓" : "✗"}
                  </TableCell>
                  <TableCell className="pricing">
                    {capitalize(space.pricing)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => navigate(`/parking_space/${space.id}`)}
                      edge="start"
                      size="small"
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ParkingSpaces;
