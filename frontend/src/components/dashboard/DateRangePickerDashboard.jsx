// src/components/dashboard/DateRangePickerDashboard.jsx
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Box } from "@mui/material";
import PropTypes from "prop-types";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import "../../styles/antTheme.css";

const { RangePicker } = DatePicker;

const DateRangePicker = ({ dateRange, setDateRange }) => {
  DateRangePicker.propTypes = {
    dateRange: PropTypes.array.isRequired,
    setDateRange: PropTypes.func.isRequired,
  };

  const currentMonth = dayjs().month();
  const currentYear = dayjs().year();

  const presets = [
    {
      label: "Current Week",
      value: [
        dayjs().startOf("week").add(1, "day"),
        dayjs().endOf("week").add(1, "day"),
      ],
    },
    {
      label: "Next Week",
      value: [
        dayjs().add(1, "week").startOf("week"),
        dayjs().add(1, "week").endOf("week"),
      ],
    },
    {
      label: "Current Month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
    {
      label: "Next Month",
      value: [
        dayjs().add(1, "month").startOf("month"),
        dayjs().add(1, "month").endOf("month"),
      ],
    },
    {
      label: "This Year",
      value: [dayjs().startOf("year"), dayjs().endOf("year")],
    },
    {
      label: "Next Year",
      value: [
        dayjs().add(1, "year").startOf("year"),
        dayjs().add(1, "year").endOf("year"),
      ],
    },
    ...Array.from({ length: 12 }, (_, i) => {
      const month = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      return {
        label: dayjs().month(month).year(year).format("MMM YY"),
        value: [
          dayjs().month(month).year(year).startOf("month"),
          dayjs().month(month).year(year).endOf("month"),
        ],
      };
    }),
  ];

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      className="date-picker-container"
    >
      <RangePicker
        presets={presets}
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
