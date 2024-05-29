import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import CapacityUtilization from "../components/dashboard/CapacityUtilization";

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/capacity_utilization");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  if (!data) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  const circleStyle = {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#ff566a75",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "20px",
    fontSize: "24px",
  };

  return (
    <div>
      <Typography variant="h2" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Paper
            onClick={() => navigate("/exceedsCapacity")}
            style={{
              padding: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography variant="h4">Capacity Exceeded</Typography>
            <Box style={circleStyle}>{data.exceeds_capacity?.length || 0}</Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper
            onClick={() => navigate("/between80And100")}
            style={{
              padding: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography variant="h4">Capacity Over 80% Utilized</Typography>
            <Box style={circleStyle}>
              {data.between_80_and_100?.length || 0}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: 20 }}>
            <CapacityUtilization />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
