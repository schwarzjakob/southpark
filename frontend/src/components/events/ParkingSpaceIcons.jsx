import PropTypes from "prop-types";

const ParkingIcons = ({ color, ids }) => {
  const paths = [
    { id: "parking-lot-PN3", d: "M255 62L287 62L287 135L276 129L252 80z" },
    { id: "parking-lot-PN4", d: "M290 62L338 62L338 149L290 136z" },
    { id: "parking-lot-PN5", d: "M341 152L341 59L354 56L379 56L379 163z" },
    { id: "parking-lot-PN6", d: "M382 56L382 164L430 181L430 56z" },
    { id: "parking-lot-PN7", d: "M433 56L433 181L501 209L501 56z" },
    { id: "parking-lot-PN8", d: "M504 56L504 211L527 218L527 56z" },
    { id: "parking-lot-PN9", d: "M530 56L530 219L561 227L561 82L539 56z" },
    { id: "parking-lot-PN10", d: "M564 86L564 227L588 231L613 233L613 169z" },
    { id: "parking-lot-PN11", d: "M615 172L615 233L651 233z" },
    { id: "parking-lot-PN12", d: "M586 119L654 232L677 230L700 225L625 119z" },
    { id: "parking-lot-PWest", d: "M625 119L700 225L700 119z" },
  ];

  return (
    <svg width="200" height="90" viewBox="0 100 800 400">
      <g>
        {paths.map((path) => (
          <path
            key={path.id}
            className={`halls ${path.id}`}
            stroke="#b3b3b3"
            strokeOpacity="1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={ids.includes(path.id) ? color : "#cccccc"}
            fillOpacity="1"
            fillRule="evenodd"
            d={path.d}
          />
        ))}
      </g>
    </svg>
  );
};

ParkingIcons.propTypes = {
  color: PropTypes.string,
  ids: PropTypes.arrayOf(PropTypes.string),
};

export default ParkingIcons;
