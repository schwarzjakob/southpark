import PropTypes from "prop-types";
import dayjs from "dayjs";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleOutline";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";

const getContrastingTextColor = (backgroundColor) => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "black" : "white";
};

const MapLegendComponent = ({ events, selectedDate }) => {
  const getEventPhase = (event, date) => {
    const eventDate = dayjs(date);
    if (
      eventDate.isSame(event.assembly_start_date, "day") ||
      eventDate.isSame(event.assembly_end_date, "day") ||
      eventDate.isBetween(
        event.assembly_start_date,
        event.assembly_end_date,
        null,
        "[]"
      )
    ) {
      return "assembly";
    } else if (
      eventDate.isSame(event.runtime_start_date, "day") ||
      eventDate.isSame(event.runtime_end_date, "day") ||
      eventDate.isBetween(
        event.runtime_start_date,
        event.runtime_end_date,
        null,
        "[]"
      )
    ) {
      return "runtime";
    } else if (
      eventDate.isSame(event.disassembly_start_date, "day") ||
      eventDate.isSame(event.disassembly_end_date, "day") ||
      eventDate.isBetween(
        event.disassembly_start_date,
        event.disassembly_end_date,
        null,
        "[]"
      )
    ) {
      return "disassembly";
    }
    return null;
  };

  const phasesUsed = new Set();
  const sortedEvents = [...events].sort((a, b) => {
    const phaseOrder = ["assembly", "runtime", "disassembly"];
    const phaseA = getEventPhase(a, selectedDate);
    const phaseB = getEventPhase(b, selectedDate);
    return phaseOrder.indexOf(phaseA) - phaseOrder.indexOf(phaseB);
  });

  return (
    <div className="legend">
      {sortedEvents.map((event) => {
        const phase = getEventPhase(event, selectedDate);
        if (!phase) return null;

        phasesUsed.add(phase);

        const phaseIcon =
          phase === "assembly" ? (
            <ArrowCircleUpRoundedIcon />
          ) : phase === "runtime" ? (
            <PlayCircleRoundedIcon />
          ) : (
            <ArrowCircleDownRoundedIcon />
          );

        const contrastColor = getContrastingTextColor(event.event_color);

        const phaseStyle =
          phase === "assembly" || phase === "disassembly"
            ? {
                backgroundColor: `${event.event_color}80`, // 50% transparency
                border: `1px solid ${event.event_color}`,
                color: event.event_color,
              }
            : {
                backgroundColor: event.event_color,
                color: contrastColor,
              };

        return (
          <div key={event.event_id} className="legend-item">
            <div className="legend-color" style={phaseStyle}>
              {phaseIcon}
            </div>
            <div className="legend-text">
              <div className={`legend-${phase}`}>
                <strong>{event.event_name}</strong>
              </div>
            </div>
          </div>
        );
      })}
      <div className="legend-icons">
        {phasesUsed.has("assembly") && (
          <div className="legend-icon">
            <ArrowCircleUpRoundedIcon /> assembly
          </div>
        )}
        {phasesUsed.has("runtime") && (
          <div className="legend-icon">
            <PlayCircleRoundedIcon /> runtime
          </div>
        )}
        {phasesUsed.has("disassembly") && (
          <div className="legend-icon">
            <ArrowCircleDownRoundedIcon /> disassembly
          </div>
        )}
      </div>
    </div>
  );
};

MapLegendComponent.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDate: PropTypes.string.isRequired,
};

export default MapLegendComponent;
