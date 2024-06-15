// src/components/dashboard/Dashboard.jsx
import { useEffect, useState } from "react";
import { Paper, Grid, Typography, Box } from "@mui/material";
import axios from "axios";
import CapacityUtilization from "./CapacityUtilization";
import LoadingAnimation from "../LoadingAnimation";
import MonthlyDemandTable from "./MonthlyDemandTable";
import InfoTextComponent from "../InfoTextComponent.jsx";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import dayjs from "dayjs";

const TITLE = "Dashboard";

const infoText =
  "The capacity utilization chart shows the percentage of the total capacity that is being used. The chart is based on the data from the selected time range.";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [selectedYear, setSelectedYear] = useState(dateRange[1].year());

  useEffect(() => {
    fetchData();
  }, [selectedYear, dateRange]);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/capacity_utilization", {
        params: {
          start_date: dateRange[0].format("YYYY-MM-DD"),
          end_date: dateRange[1].format("YYYY-MM-DD"),
        },
      });
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);

    const newStartDate = dayjs(dateRange[0]).year(newYear);
    const newEndDate = dayjs(dateRange[1]).year(newYear);

    // Sonderbehandlung für Schaltjahre
    if (
      newStartDate.month() === 1 &&
      newStartDate.date() === 29 &&
      !newStartDate.isLeapYear()
    ) {
      newStartDate.date(28);
    }

    if (
      newEndDate.month() === 1 &&
      newEndDate.date() === 29 &&
      !newEndDate.isLeapYear()
    ) {
      newEndDate.date(28);
    }

    setDateRange([newStartDate, newEndDate]);
  };

  if (!data) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <LoadingAnimation />
      </Box>
    );
  }

  return (
    <div>
      <Box className="iconHeadline__container">
        <DashboardRoundedIcon className="demandTable__icon" />{" "}
        <Typography variant="h4" gutterBottom className="demandTable__title">
          {TITLE}
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MonthlyDemandTable
            selectedYear={selectedYear}
            setSelectedYear={handleYearChange}
            setDateRange={setDateRange}
          />
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: 20 }}>
            <CapacityUtilization
              selectedYear={selectedYear}
              setSelectedYear={handleYearChange}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
            <InfoTextComponent
              infoText={infoText}
              direction="left"
              iconPosition="left"
            />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
