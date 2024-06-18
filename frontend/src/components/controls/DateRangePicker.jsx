// src/components/DateRangePicker.jsx
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Box } from "@mui/material";
import PropTypes from "prop-types";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";

const { RangePicker } = DatePicker;

const DateRangePicker = ({ dateRange, setDateRange, enabledPresets = [] }) => {
  DateRangePicker.propTypes = {
    dateRange: PropTypes.array.isRequired,
    setDateRange: PropTypes.func.isRequired,
    enabledPresets: PropTypes.arrayOf(PropTypes.string),
  };

  const currentMonth = dayjs().month();
  const currentYear = dayjs().year();

  const availablePresets = {
    currentWeek: {
      label: "Current Week",
      value: [
        dayjs().startOf("week").add(1, "day"),
        dayjs().endOf("week").add(1, "day"),
      ],
    },
    nextWeek: {
      label: "Next Week",
      value: [
        dayjs().add(1, "week").startOf("week"),
        dayjs().add(1, "week").endOf("week"),
      ],
    },
    currentMonth: {
      label: "Current Month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
    nextMonth: {
      label: "Next Month",
      value: [
        dayjs().add(1, "month").startOf("month"),
        dayjs().add(1, "month").endOf("month"),
      ],
    },
    last7Days: {
      label: "Last 7 Days",
      value: [dayjs().subtract(7, "day"), dayjs()],
    },
    last30Days: {
      label: "Last 30 Days",
      value: [dayjs().subtract(30, "day"), dayjs()],
    },
    lastMonth: {
      label: "Last Month",
      value: [
        dayjs().subtract(1, "month").startOf("month"),
        dayjs().subtract(1, "month").endOf("month"),
      ],
    },
    thisYear: {
      label: "This Year",
      value: [dayjs().startOf("year"), dayjs().endOf("year")],
    },
    lastYear: {
      label: "Last Year",
      value: [
        dayjs().subtract(1, "year").startOf("year"),
        dayjs().subtract(1, "year").endOf("year"),
      ],
    },
    nextYear: {
      label: "Next Year",
      value: [
        dayjs().add(1, "year").startOf("year"),
        dayjs().add(1, "year").endOf("year"),
      ],
    },
    months: Array.from({ length: 12 }, (_, i) => {
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
  };

  const presets = enabledPresets.flatMap((preset) =>
    preset === "months"
      ? availablePresets.months
      : availablePresets[preset]
      ? [availablePresets[preset]]
      : []
  );

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
