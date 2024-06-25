import { useEffect, useState, useCallback } from "react";
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
  IconButton,
} from "@mui/material";
import PropTypes from "prop-types";
import axios from "axios";
import dayjs from "dayjs";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import BackupTableOutlinedIcon from "@mui/icons-material/BackupTableOutlined";
import CheckIcon from "@mui/icons-material/Check";
import InfoHoverComponent from "../common/InfoHover.jsx";
import InfoTextComponent from "../common/InfoText.jsx";

const TITLE = "Capacity Utilization Heatmap";
const LABEL_OVER100_TITLE = "TAKE ACTION";
const LABEL_80TO100_TITLE = "MONITOR";
const TABLE_LABEL = "Days with Utilization Rate";
const LABEL_OVER100 = "above 100%";
const LABEL_80TO100 = "between 80% and 100%";

const over100Styles = {
  border: "3px solid #ff4343",
  background: "#ff434375",
};

const between80and100Styles = {
  border: "3px solid #ffd753",
  background: "#ffd75375",
};

const LABEL_OVER100_INFO =
  "Total number of days when the demand for parking spaces exceeded the total available capacity. Recommendation: Take action! Additional parking spaces are urgently needed to meet the demand.";
const LABEL_80TO100_INFO =
  "Total number of days when the demand for parking spaces was high but did not exceed the total available capacity. Recommendation: Monitor. The occupation is not critical yet, but it should be validated and kept under observation.";
const INFO_TEXT =
  "Hover to show details or click on month to move to time range in bar chart below";

const MonthlyDemandTable = ({
  selectedYear,
  setSelectedYear,
  setDateRange,
}) => {
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/dashboard/capacity_utilization_critical_days/${selectedYear}`
      );
      setData(response.data);
      //DEBUG
      //console.log("Data fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    dayjs().month(i).format("MMM")
  );

  const getMonthlyCounts = (month, type) => {
    return data[month] ? data[month][type].count : 0;
  };

  const getAffectedDays = (month, type) => {
    const days = data[month] ? data[month][type].dates : [];
    if (days.length === 0) {
      return "No affected days";
    }
    return (
      "Critical days: " +
      days.map((day) => dayjs(day).format("DD.MM.YYYY")).join(", ")
    );
  };

  return (
    <Paper
      className="demandTable__container"
      style={{ padding: 20, marginBottom: 20 }}
    >
      <Box className="iconHeadline__container">
        <BackupTableOutlinedIcon />
        <Typography variant="h5" gutterBottom>
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
                    style={{ transition: "transform 0.3s" }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.transform = "scale(1.2)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <ArrowBackIosIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="h6" className="demandTable__monthLabel">
                    {selectedYear}
                  </Typography>
                  <IconButton
                    className="ArrowForwardIosIcon"
                    onClick={() => handleYearChange(1)}
                    size="small"
                    style={{ transition: "transform 0.3s" }}
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
                    className="demandTable__monthLabel"
                  >
                    {month}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody className="critical-days-table">
            <TableRow>
              <TableCell className="demandTable__itemLabel">
                <Box className="demandTable__itemLabel-container">
                  <WarningIcon className="demandTable__warningIcon" />
                  <Box className="demandTable__itemFont">
                    <Typography
                      variant="body1"
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
              {months.map((_, index) => {
                const monthString = `${selectedYear}-${(index + 1)
                  .toString()
                  .padStart(2, "0")}`;
                const above100Count = getMonthlyCounts(
                  monthString,
                  "above_100"
                );
                const above100Style = above100Count > 0 ? over100Styles : {};

                return (
                  <Tooltip
                    key={index}
                    title={getAffectedDays(monthString, "above_100")}
                    arrow
                  >
                    <TableCell
                      className="demandTable__subitem"
                      key={index}
                      align="center"
                      style={above100Style}
                      onClick={() => handleMonthClick(index)}
                    >
                      {above100Count > 0 ? (
                        <Typography
                          className="demandTable__subitemText"
                          style={{
                            color: "red",
                          }}
                        >
                          {above100Count}
                        </Typography>
                      ) : (
                        <Box>
                          <CheckIcon className="demandTable__checkIcon" />
                        </Box>
                      )}
                    </TableCell>
                  </Tooltip>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell className="demandTable__itemLabel">
                <Box className="demandTable__itemLabel-container">
                  <VisibilityIcon className="demandTable__visibilityIcon" />
                  <Box className="demandTable__itemFont">
                    <Typography
                      variant="h6"
                      style={{ fontWeight: "bold" }}
                      className="demandTable__itemHeader"
                    >
                      {LABEL_80TO100_TITLE}
                    </Typography>
                    <Typography
                      variant="body1"
                      className="demandTable__itemText"
                    >
                      {TABLE_LABEL} {LABEL_80TO100}
                      <InfoHoverComponent
                        direction="right"
                        infoText={LABEL_80TO100_INFO}
                      />
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              {months.map((_, index) => {
                const monthString = `${selectedYear}-${(index + 1)
                  .toString()
                  .padStart(2, "0")}`;
                const between80and100Count = getMonthlyCounts(
                  monthString,
                  "between_80_and_100"
                );
                const between80and100Style =
                  between80and100Count > 0 ? between80and100Styles : {};

                return (
                  <Tooltip
                    key={index}
                    title={getAffectedDays(monthString, "between_80_and_100")}
                    arrow
                  >
                    <TableCell
                      className="demandTable__subitem"
                      key={index}
                      align="center"
                      style={between80and100Style}
                      onClick={() => handleMonthClick(index)}
                    >
                      {between80and100Count > 0 ? (
                        <Typography
                          className="demandTable__subitemText"
                          style={{
                            color: "orange",
                          }}
                        >
                          {between80and100Count}
                        </Typography>
                      ) : (
                        <Box>
                          <CheckIcon className="demandTable__checkIcon" />
                        </Box>
                      )}
                    </TableCell>
                  </Tooltip>
                );
              })}
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
