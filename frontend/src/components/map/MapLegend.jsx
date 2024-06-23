import PropTypes from "prop-types";
import dayjs from "dayjs";

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

  return (
    <div className="legend">
      {events.map((event) => {
        const phase = getEventPhase(event, selectedDate);
        if (!phase) return null;

        return (
          <div key={event.event_id} className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: event.event_color }}
            ></div>
            <div className="legend-text">
              <div
                className={`legend-${phase}`}
                style={{ color: "var(--textColor)" }}
              >
                <strong>{event.event_name}</strong> ({phase})
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

MapLegendComponent.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDate: PropTypes.string.isRequired,
};

export default MapLegendComponent;
