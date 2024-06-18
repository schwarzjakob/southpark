import React, { useState } from "react";
import { Grid, TextField, Typography, Paper, Button, Box } from "@mui/material";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import { Progress, DatePicker } from "antd";
import "antd/dist/reset.css"; // Import Ant Design styles
import PropTypes from "prop-types";
import moment from "moment";

const { RangePicker } = DatePicker;

const InputMatrix = ({ y = 12, previousDemandData = [] }) => {
  const columns = [
    { name: "Cars", icon: <DirectionsCarFilledRoundedIcon /> },
    { name: "Buses", icon: <AirportShuttleRoundedIcon /> },
    { name: "Trucks", icon: <LocalShippingIcon /> },
  ];

  const totalDemand = [5000, 150, 500];
  const assignedDemand = [0, 0, 0];

  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedPhase, setSelectedPhase] = useState(0);

  const phases = [
    { name: "Assembly", color: "green" },
    { name: "Runtime", color: "blue" },
    { name: "Disassembly", color: "red" },
  ];

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handlePhaseClick = (index) => {
    setSelectedPhase(index);
  };

  const handleInputChange = (event, rowIndex, colIndex) => {
    const newValue = parseInt(event.target.value, 10);
    // Handle the change in value
  };

  return (
    <Paper style={{ padding: 16 }}>
      <Typography variant="h4" gutterBottom>
        Demand Allocation Matrix
      </Typography>
      <Progress
        percent={100}
        status="active"
        format={() => "Step 4/4: Assign Demands"}
      />
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Button
          onClick={() =>
            handleDateChange(moment(selectedDate).subtract(1, "days"))
          }
        >
          {"<"}
        </Button>
        <Typography variant="h6">
          {selectedDate.format("ddd, DD.MM.YY")}
        </Typography>
        <Button
          onClick={() => handleDateChange(moment(selectedDate).add(1, "days"))}
        >
          {">"}
        </Button>
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        mb={2}
      >
        {phases.map((phase, index) => (
          <Box
            key={index}
            display="flex"
            flexDirection="column"
            alignItems="center"
            flex={1}
            mx={1}
          >
            <Button
              variant={selectedPhase === index ? "contained" : "outlined"}
              style={{
                borderColor: phase.color,
                transform: selectedPhase === index ? "scale(1.2)" : "scale(1)",
              }}
              onClick={() => handlePhaseClick(index)}
            >
              {phase.name}
            </Button>
          </Box>
        ))}
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        mb={2}
      >
        {columns.map((column, index) => (
          <Box
            key={index}
            display="flex"
            flexDirection="column"
            alignItems="center"
            flex={1}
            mx={1}
          >
            {column.icon}
            <Typography variant="h6">{column.name}</Typography>
            <Typography variant="body2">
              Total Demand: {totalDemand[index]}
            </Typography>
            <Typography variant="body2">
              Assigned Demand: {assignedDemand[index]}
            </Typography>
            <hr style={{ width: "100%", borderTop: "1px solid grey" }} />
            <Typography variant="body2">
              Remaining Demand: {totalDemand[index] - assignedDemand[index]}
            </Typography>
          </Box>
        ))}
      </Box>
      <Grid container spacing={2}>
        {[...Array(y)].map((_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <Grid item xs={12} container alignItems="center">
              <Grid item xs={1}>
                <Typography
                  variant="subtitle1"
                  style={{
                    backgroundColor: "#87CEEB",
                    border: "1px solid #1890ff",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  {`P${rowIndex + 1}`}
                </Typography>
              </Grid>
              {columns.map((column, colIndex) => (
                <Grid item xs={3} key={colIndex}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    InputProps={{
                      inputProps: { step: 100 },
                      style: { height: 40 },
                    }}
                    onChange={(event) =>
                      handleInputChange(event, rowIndex, colIndex)
                    }
                    placeholder={`Historic Demand: ${
                      previousDemandData[rowIndex]?.[colIndex] ?? 1000
                    }`}
                  />
                  <Typography variant="caption" display="block" align="center">
                    {previousDemandData[rowIndex]?.[colIndex] ?? 1000}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </React.Fragment>
        ))}
        <Grid item xs={6}>
          <Button fullWidth variant="contained" color="secondary">
            Zurücksetzen
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button fullWidth variant="contained" color="primary">
            Speichern
          </Button>
        </Grid>
      </Grid>
      <Typography variant="body2" style={{ marginTop: 16 }}>
        Based on historic demand from event XXX.
      </Typography>
    </Paper>
  );
};

InputMatrix.propTypes = {
  y: PropTypes.number,
  previousDemandData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
};

export default InputMatrix;
