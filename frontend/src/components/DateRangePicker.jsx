// src/components/DateRangePicker.jsx
import { DatePicker } from "antd";
import { Box } from "@mui/material";
import PropTypes from "prop-types";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import "../styles/antTheme.css";

const { RangePicker } = DatePicker;

const DateRangePicker = ({ dateRange, setDateRange }) => {
  DateRangePicker.propTypes = {
    dateRange: PropTypes.array.isRequired,
    setDateRange: PropTypes.func.isRequired,
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      className="date-picker-container"
    >
      <RangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates)}
        className="date-picker"
        format="DD.MM.YYYY"
        locale={{
          lang: {
            locale: "de",
            week: {
              dow: 1,
              doy: 4,
            },
          },
        }}
        separator={<ArrowRightAltIcon />}
      />
    </Box>
  );
};

export default DateRangePicker;
