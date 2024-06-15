import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import PropTypes from "prop-types";
import axios from "axios";
import dayjs from "dayjs";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import InfoHoverComponent from "../InfoHoverComponent.jsx";
import InfoTextComponent from "../InfoTextComponent.jsx";
import BackupTableOutlinedIcon from "@mui/icons-material/BackupTableOutlined";

const TITLE = "Capacity Utilization Heatmap";
const LABEL_OVER100_TITLE = "TAKE ACTION";
const LABEL_80TO100_TITLE = "MONITOR";
const TABLE_LABEL = "Days with Utilization Rate";
const LABEL_OVER100 = "above 100%";
const LABEL_80TO100 = "between 80% and 100%";
const COLOR_OVER100 = "#ff434375";
const COLOR_80TO100 = "#f39c12bd";
const LABEL_OVER100_INFO =
  "Total number of days when the demand for parking spaces exceeded the total available capacity. Recommendation: Take action! Additional parking spaces are urgently needed to meet the demand.";
const LABEL_80TO100_INFO =
  "Total number of days when the demand for parking spaces was high but did not exceed the total available capacity. Recommendation: Monitor. The occupation is not critical yet, but it should be validated and kept under observation.";
const INFO_TEXT =
  "Hover to show details or click to move to time range in chart";

const MonthlyDemandTable = ({
  selectedYear,
  setSelectedYear,
  setDateRange,
}) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/capacity_utilization");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleYearChange = (increment) => {
    setSelectedYear(selectedYear + increment);
  };

  const handleMonthClick = (month) => {
    const startOfMonth = dayjs()
      .year(selectedYear)
      .month(month)
      .startOf("month");

    const endOfMonth = dayjs().year(selectedYear).month(month).endOf("month");
    setDateRange([startOfMonth, endOfMonth]);
  };

  if (!data) {
    return null;
  }

  const months = Array.from({ length: 12 }, (_, i) =>
    dayjs().month(i).format("MMM"),
  );

  const getMonthlyCounts = (month, condition) => {
    const days = data.filter(
      (day) =>
        dayjs(day.date).year() === selectedYear &&
        dayjs(day.date).month() === month,
    );
    return days.filter(condition).length;
  };

  const getAffectedDays = (month, condition) => {
    const days = data.filter(
      (day) =>
        dayjs(day.date).year() === selectedYear &&
        dayjs(day.date).month() === month &&
        condition(day),
    );
    if (days.length === 0) {
      return "No affected days";
    }
    return (
      "Critical days: " +
      days.map((day) => dayjs(day.date).format("DD.MM.YYYY")).join(", ")
    );
  };

  return (
    <Paper
      className="demandTable__container"
      style={{ padding: 20, marginBottom: 20 }}
    >
      <Box className="iconHeadline__container">
        <BackupTableOutlinedIcon className="demandTable__icon" />{" "}
        <Typography variant="h5" gutterBottom className="demandTable__title">
          {TITLE}
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="demandTable__headerCell">
                <Box className="demandTable__headerCell-nav">
                  <IconButton
                    className="ArrowBackIosIcon"
                    onClick={() => handleYearChange(-1)}
                    size="small"
                    style={{
                      transition: "transform 0.3s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.transform = "scale(1.2)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <ArrowBackIosIcon fontSize="small" />
                  </IconButton>
                  <Typography
                    variant="h5"
                    style={{ fontWeight: "bold" }}
                    className="demandTable__monthLabel"
                  >
                    {selectedYear}
                  </Typography>
                  <IconButton
                    className="ArrowForwardIosIcon"
                    onClick={() => handleYearChange(1)}
                    size="small"
                    style={{
                      transition: "transform 0.3s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.transform = "scale(1.2)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
              {months.map((month, index) => (
                <TableCell
                  key={index}
                  align="center"
                  className="demandTable__headerCell demandTable__headerCell-month"
                  onClick={() => handleMonthClick(index)}
                  style={{ cursor: "pointer" }}
                >
                  <Typography
                    variant="body1"
                    style={{ fontWeight: "bold" }}
                    className="demandTable__monthLabel"
                  >
                    {month}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell className="demandTable__itemLabel">
                <Box className="demandTable__itemLabel-container">
                  <WarningIcon className="demandTable__warningIcon" />
                  <Box className="demandTable__itemFont">
                    <Typography
                      variant="h5"
                      style={{ fontWeight: "bold" }}
                      className="demandTable__itemHeader"
                    >
                      {LABEL_OVER100_TITLE}
                    </Typography>
                    <Typography
                      variant="body1"
                      className="demandTable__itemText"
                    >
                      {TABLE_LABEL} {LABEL_OVER100}
                      <InfoHoverComponent infoText={LABEL_OVER100_INFO} />
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              {months.map((_, index) => (
                <Tooltip
                  key={index}
                  title={getAffectedDays(
                    index,
                    (day) => day.total_demand > day.total_capacity,
                  )}
                  arrow
                >
                  <TableCell
                    key={index}
                    align="center"
                    className="demandTable__itemCell"
                    style={{
                      backgroundColor:
                        getMonthlyCounts(
                          index,
                          (day) => day.total_demand > day.total_capacity,
                        ) > 0
                          ? COLOR_OVER100
                          : "",
                    }}
                  >
                    <Typography
                      className="demandTable__subitemText"
                      style={{
                        color:
                          getMonthlyCounts(
                            index,
                            (day) => day.total_demand > day.total_capacity,
                          ) > 0
                            ? "red"
                            : "",
                      }}
                    >
                      {getMonthlyCounts(
                        index,
                        (day) => day.total_demand > day.total_capacity,
                      ) || ""}
                    </Typography>
                  </TableCell>
                </Tooltip>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="demandTable__itemLabel">
                <Box className="demandTable__itemLabel-container">
                  <VisibilityIcon className="demandTable__visibilityIcon" />
                  <Box className="demandTable__itemFont">
                    <Typography
                      variant="h5"
                      style={{ fontWeight: "bold" }}
                      className="demandTable__itemHeader"
                    >
                      {LABEL_80TO100_TITLE}
                    </Typography>
                    <Typography
                      variant="body1"
                      className="demandTable__itemText"
                    >
                      {TABLE_LABEL} {LABEL_80TO100}{" "}
                      <InfoHoverComponent
                        direction="right"
                        infoText={LABEL_80TO100_INFO}
                      />
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              {months.map((_, index) => (
                <Tooltip
                  key={index}
                  title={getAffectedDays(
                    index,
                    (day) =>
                      day.total_demand >= 0.8 * day.total_capacity &&
                      day.total_demand <= day.total_capacity,
                  )}
                  arrow
                >
                  <TableCell
                    key={index}
                    align="center"
                    className="demandTable__itemCell"
                    style={{
                      backgroundColor:
                        getMonthlyCounts(
                          index,
                          (day) =>
                            day.total_demand >= 0.8 * day.total_capacity &&
                            day.total_demand <= day.total_capacity,
                        ) > 0
                          ? COLOR_80TO100
                          : "",
                    }}
                  >
                    <Typography
                      className="demandTable__subitemText"
                      style={{
                        color:
                          getMonthlyCounts(
                            index,
                            (day) =>
                              day.total_demand >= 0.8 * day.total_capacity &&
                              day.total_demand <= day.total_capacity,
                          ) > 0
                            ? "orange"
                            : "",
                      }}
                    >
                      {getMonthlyCounts(
                        index,
                        (day) =>
                          day.total_demand >= 0.8 * day.total_capacity &&
                          day.total_demand <= day.total_capacity,
                      ) || ""}
                    </Typography>
                  </TableCell>
                </Tooltip>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <InfoTextComponent
        infoText={INFO_TEXT}
        direction="left"
        iconPosition="left"
      />
    </Paper>
  );
};

MonthlyDemandTable.propTypes = {
  selectedYear: PropTypes.number.isRequired,
  setSelectedYear: PropTypes.func.isRequired,
  setDateRange: PropTypes.func.isRequired,
};

export default MonthlyDemandTable;
