import { useState, useEffect, useCallback } from "react";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import axios from "axios";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const ROW_HEIGHT = 24;
const OFFSET = 100;
const BUFFER = 10;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TimelineSlider = ({ selectedDate, setSelectedDate, selectedEventId }) => {
  const theme = useTheme();
  const [days, setDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventRows, setEventRows] = useState([]);

  useEffect(() => {
    const updateDays = () => {
      const calculateNumberOfDays = () => Math.floor(window.innerWidth / 45);
      const generateDays = (centerDate, numberOfDays) => {
        const today = dayjs(centerDate);
        const halfNumberOfDays = Math.floor(numberOfDays / 2);
        return Array.from({ length: numberOfDays }, (_, i) =>
          today.add(i - halfNumberOfDays, "day").format("YYYY-MM-DD")
        );
      };
      setDays(generateDays(selectedDate, calculateNumberOfDays() + BUFFER * 2));
    };

    updateDays();
    window.addEventListener("resize", updateDays);
    return () => window.removeEventListener("resize", updateDays);
  }, [selectedDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get(
          `/api/map/events_timeline/${selectedDate}`
        );
        const eventsData = Array.isArray(data) ? data : [];
        setEvents(eventsData);

        const rows = [];
        eventsData.forEach((event) => {
          const eventStart = dayjs(event.assembly_start_date).format(
            "YYYY-MM-DD"
          );
          const eventEnd = dayjs(event.disassembly_end_date).format(
            "YYYY-MM-DD"
          );
          let assigned = false;
          for (let i = 0; i < rows.length; i++) {
            if (
              !rows[i].some(
                (e) =>
                  dayjs(eventStart).isBetween(e.start, e.end, "day", "[]") ||
                  dayjs(eventEnd).isBetween(e.start, e.end, "day", "[]") ||
                  dayjs(e.start).isBetween(eventStart, eventEnd, "day", "[]") ||
                  dayjs(e.end).isBetween(eventStart, eventEnd, "day", "[]")
              )
            ) {
              rows[i].push({ start: eventStart, end: eventEnd, event });
              event.row = i;
              assigned = true;
              break;
            }
          }
          if (!assigned) {
            rows.push([{ start: eventStart, end: eventEnd, event }]);
            event.row = rows.length - 1;
          }
        });

        setEventRows(rows);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, [selectedDate]);

  const handleLeftClick = useCallback(() => {
    const newDate = dayjs(selectedDate).subtract(1, "day").format("YYYY-MM-DD");
    setSelectedDate(newDate);
    setDays((prevDays) =>
      prevDays.map((day) => dayjs(day).subtract(1, "day").format("YYYY-MM-DD"))
    );
  }, [selectedDate, setSelectedDate]);

  const handleRightClick = useCallback(() => {
    const newDate = dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD");
    setSelectedDate(newDate);
    setDays((prevDays) =>
      prevDays.map((day) => dayjs(day).add(1, "day").format("YYYY-MM-DD"))
    );
  }, [selectedDate, setSelectedDate]);

  const handleYearClick = (year) => {
    let newDate = dayjs(selectedDate).year(year);
    const daysInMonth = newDate.daysInMonth();
    if (newDate.date() > daysInMonth) newDate = newDate.date(daysInMonth);
    setSelectedDate(newDate.format("YYYY-MM-DD"));
  };

  const handleMonthClick = (monthIndex) => {
    let newDate = dayjs(selectedDate).month(monthIndex);
    const daysInMonth = newDate.daysInMonth();
    if (newDate.date() > daysInMonth) newDate = newDate.date(daysInMonth);
    setSelectedDate(newDate.format("YYYY-MM-DD"));
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  const renderYears = () => {
    const startYear = dayjs().subtract(10, "year").year();
    const endYear = dayjs().add(10, "year").year();
    return Array.from({ length: 21 }, (_, i) => {
      const year = dayjs(selectedDate)
        .add(i - 10, "year")
        .year();
      if (year < startYear || year > endYear) return null;
      const isSelected = year === dayjs(selectedDate).year();
      return (
        <Typography
          key={year}
          className={`timeline-year ${isSelected ? "selected" : ""}`}
          variant="body2"
          onClick={() => handleYearClick(year)}
          sx={{
            marginX: 1,
            fontWeight: isSelected ? "bold" : "normal",
            color: isSelected
              ? "var(--color-pure-white)"
              : "var(--color-gray-400)",
            background: isSelected ? "var(--color-primary)" : "",
            cursor: "pointer",
          }}
        >
          {year}
        </Typography>
      );
    }).filter(Boolean);
  };

  const renderMonths = () => {
    const selectedMonth = dayjs(selectedDate).month();
    return MONTHS.map((month, index) => {
      const isSelected = index === selectedMonth;
      return (
        <Typography
          key={month}
          variant="body2"
          className={`timeline-months ${isSelected ? "selected" : ""}`}
          onClick={() => handleMonthClick(index)}
          sx={{
            marginX: 0.5,
            padding: "0 0.5rem",
            backgroundColor: isSelected ? "var(--color-primary)" : "normal",
            fontWeight: isSelected ? "bold" : "normal",
            color: isSelected ? "var(--color-pure-white)" : "inherit",
            cursor: "pointer",
          }}
        >
          {month}
        </Typography>
      );
    });
  };

  const renderEvents = (day) => {
    const uniqueEvents = {};
    events.forEach((event) => {
      if (
        dayjs(day).isBetween(
          dayjs(event.assembly_start_date).startOf("day"),
          dayjs(event.disassembly_end_date).endOf("day"),
          "day",
          "[]"
        )
      ) {
        uniqueEvents[event.event_id] = event;
      }
    });
    const dayEvents = Object.values(uniqueEvents);
    const maxRow = Math.max(...dayEvents.map((event) => event.row), 0);
    const filledRows = Array.from({ length: maxRow + 1 }, (_, index) =>
      dayEvents.find((event) => event.row === index)
    );
    filledRows.sort((a, b) => (a?.row ?? -1) - (b?.row ?? -1));

    return filledRows.map((event, index) => {
      if (!event) {
        return (
          <Box
            key={`empty-${index}`}
            className="event-row"
            sx={{
              height: "22px",
              marginBottom: "2px",
              position: "relative",
              backgroundColor: "transparent",
            }}
          />
        );
      }
      const phases = [
        {
          startDate: event.assembly_start_date,
          endDate: event.assembly_end_date,
          opacity: 0.05,
          className: "status-assembly",
        },
        {
          startDate: event.runtime_start_date,
          endDate: event.runtime_end_date,
          opacity: 1,
          className: "",
        },
        {
          startDate: event.disassembly_start_date,
          endDate: event.disassembly_end_date,
          opacity: 0.05,
          className: "status-disassembly",
        },
      ];
      const phaseSegments = phases.map((phase, idx) => {
        const phaseStart = dayjs(phase.startDate);
        const phaseEnd = dayjs(phase.endDate);
        const startIndex = days.findIndex((d) =>
          dayjs(d).isSame(phaseStart, "day")
        );
        const endIndex = days.findIndex((d) =>
          dayjs(d).isSame(phaseEnd, "day")
        );
        if (startIndex === -1 || endIndex === -1) return null;
        const labelText =
          dayjs(day).isSame(event.runtime_start_date, "day") && idx === 1
            ? event.event_name
            : null;
        return renderEventSegments(
          event,
          startIndex,
          endIndex,
          phase.opacity,
          labelText,
          phase.className
        );
      });
      return phaseSegments;
    });
  };

  const renderEventSegments = (
    event,
    startIndex,
    endIndex,
    opacity,
    labelText,
    additionalClass = ""
  ) => {
    const left = startIndex * 45;
    const width = (endIndex - startIndex + 1) * 45;
    const isGrayedOut = selectedEventId && selectedEventId !== event.event_id;
    const textColor = getContrastColor(event.event_color);

    return (
      <Box
        key={`${event.event_id}-${startIndex}`}
        className={`event-row ${additionalClass}`}
        sx={{
          height: "22px",
          marginBottom: "2px",
          position: "absolute",
          left: `${left}px`,
          width: `${width}px`,
          top: `${event.row * ROW_HEIGHT + 48}px`,
          border: `1px solid ${
            isGrayedOut ? event.event_color : event.event_color
          }`,
        }}
      >
        <Box
          className={`event-bar ${additionalClass}`}
          sx={{
            backgroundColor: isGrayedOut ? "none" : event.event_color,
            height: "100%",
            position: "relative",
            opacity: isGrayedOut ? 0.7 : opacity,
          }}
        >
          {labelText && (
            <Typography
              className="event-bar__label"
              sx={{
                position: "relative",
                top: "0px",
                left: 0,
                fontSize: "0.75rem",
                color: isGrayedOut ? "#000000" : textColor,
                whiteSpace: "nowrap",
                zIndex: 1,
                opacity: 1,
              }}
            >
              {labelText}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const getContrastColor = (hexColor) => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  };

  return (
    <Box className="timeline-wrapper">
      {!isNaN(selectedEventId) ? (
        <Box className="timeline-arrows-container">
          <IconButton onClick={handleLeftClick} className="arrow-button left">
            <ArrowBackIosIcon />
          </IconButton>
          <IconButton onClick={handleRightClick} className="arrow-button right">
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      ) : null}
      <Box
        className="timeline-container"
        sx={{ height: `${eventRows.length * ROW_HEIGHT + OFFSET}px` }}
      >
        {!isNaN(selectedEventId) ? (
          <Box
            className="timeline-slider years"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            {renderYears()}
          </Box>
        ) : null}
        <Box
          className="timeline-slider months"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {renderMonths()}
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box position="relative" sx={{ flexGrow: 1 }}>
            <Box position="relative" sx={{ flexGrow: 1 }}>
              <Box
                className="timeline-slider days"
                sx={{
                  display: "flex",
                  bgcolor: theme.palette.background.paper,
                  height: `${eventRows.length * ROW_HEIGHT + OFFSET}px`,
                  position: "absolute",
                  left: `calc(-${BUFFER * 45 + 30}px - ${
                    selectedEventId ? "135px" : "45px"
                  })`,
                  transition: "left 0.3s ease-in-out",
                }}
              >
                {days.map((day) => (
                  <Box
                    key={day + selectedDate}
                    className={`timeline-date ${
                      day === selectedDate ? "selected" : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                    sx={{
                      width: "45px",
                      borderLeft:
                        dayjs(day).day() === 1 ? "1px solid black" : "none",
                      backgroundColor:
                        day % 2 === 0
                          ? "var(--color-gray-100)"
                          : "var(--color-gray-200)",
                      cursor: "pointer",
                    }}
                  >
                    <Typography className="timeline-date__DD">
                      {dayjs(day).format("DD")}
                    </Typography>
                    <Typography className="timeline-date__ddd">
                      {dayjs(day).format("ddd")}
                    </Typography>
                    <Box
                      className="event-bars"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        pointerEvents: "none",
                      }}
                    >
                      {renderEvents(day)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

TimelineSlider.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  setSelectedDate: PropTypes.func.isRequired,
  selectedEventId: PropTypes.number,
};

export default TimelineSlider;
